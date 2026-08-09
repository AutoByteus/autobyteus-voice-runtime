package archive

import (
	"archive/zip"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func ExtractVerified(archivePath, destination string, expected ExtractExpectation) (report VerificationReport, finalErr error) {
	if expected.SchemaVersion != 2 || expected.HostPackageID == "" || expected.Target.Platform != "darwin" || expected.Target.Architecture != "arm64" || expected.Archive.Format != "zip" || expected.Archive.FormatVersion != 2 || expected.Archive.Compression != "deflate" || expected.Archive.Canonicalization != "autobyteus-runtime-host-zip-v2" || expected.Archive.RootDirectory != "host" || expected.Archive.CompressedSizeBytes <= 0 || expected.Archive.ExtractedSizeBytes <= 0 || expected.Archive.EntryCount <= 0 || expected.Archive.EntryCount >= 65535 || expected.HostDescriptor.Path != "provider/runtime-host-v2.json" || expected.FileManifest.Path != "provider/host-files-v2.json" || !shaPattern.MatchString(expected.Archive.SHA256) || !shaPattern.MatchString(expected.HostDescriptor.SHA256) || !shaPattern.MatchString(expected.FileManifest.SHA256) {
		return report, errors.New("invalid extraction expectation")
	}
	file, err := os.Open(archivePath)
	if err != nil {
		return report, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return report, err
	}
	if !info.Mode().IsRegular() {
		return report, errors.New("archive is not a regular file")
	}
	digest, size, err := HashFile(archivePath)
	if err != nil || digest != expected.Archive.SHA256 || size != expected.Archive.CompressedSizeBytes {
		return report, errors.New("archive byte identity mismatch")
	}
	records, err := inspectZIP(file, size)
	if err != nil {
		return report, err
	}
	var extracted int64
	for _, record := range records {
		extracted += int64(record.Uncompressed)
	}
	if len(records) != expected.Archive.EntryCount || extracted != expected.Archive.ExtractedSizeBytes || extracted > MaxPackageBytes {
		return report, errors.New("archive catalog facts mismatch")
	}
	if _, err := os.Lstat(destination); !os.IsNotExist(err) {
		return report, errors.New("destination must not exist")
	}
	parent := filepath.Dir(destination)
	if err := os.MkdirAll(parent, 0700); err != nil {
		return report, err
	}
	staging, err := os.MkdirTemp(parent, ".provider-stage-")
	if err != nil {
		return report, err
	}
	defer func() {
		if finalErr != nil {
			removeWritableTree(staging)
		}
	}()
	stagePackage := filepath.Join(staging, "host")
	if err := os.Mkdir(stagePackage, 0700); err != nil {
		return report, err
	}
	reader, err := zip.NewReader(file, size)
	if err != nil {
		return report, err
	}
	byName := map[string]*zip.File{}
	for _, entry := range reader.File {
		byName[entry.Name] = entry
	}
	for _, record := range records {
		entry := byName[record.Name]
		if entry == nil {
			return report, errors.New("zip reader record mismatch")
		}
		relative := record.Name[len("host/"):]
		target := filepath.Join(stagePackage, filepath.FromSlash(relative))
		if err := os.MkdirAll(filepath.Dir(target), 0700); err != nil {
			return report, err
		}
		output, err := os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
		if err != nil {
			return report, err
		}
		input, err := entry.Open()
		if err == nil {
			err = copyBounded(output, input, int64(record.Uncompressed))
		}
		if input != nil {
			input.Close()
		}
		closeErr := output.Close()
		if err == nil {
			err = closeErr
		}
		if err != nil {
			return report, err
		}
	}
	manifestPath := filepath.Join(stagePackage, filepath.FromSlash(expected.FileManifest.Path))
	if digest, size, err := HashFile(manifestPath); err != nil || digest != expected.FileManifest.SHA256 {
		return report, errors.New("manifest digest mismatch")
	} else {
		_ = size
	}
	descriptorPath := filepath.Join(stagePackage, filepath.FromSlash(expected.HostDescriptor.Path))
	descriptorDigest, _, err := HashFile(descriptorPath)
	if err != nil || descriptorDigest != expected.HostDescriptor.SHA256 {
		return report, errors.New("descriptor digest mismatch")
	}
	manifest, err := ReadManifest(manifestPath)
	if err != nil || manifest.HostPackageID != expected.HostPackageID {
		return report, errors.New("manifest package mismatch")
	}
	if err := verifyExtractedClosure(stagePackage, manifest); err != nil {
		return report, err
	}
	if err := verifyArchiveModes(records, manifest); err != nil {
		return report, err
	}
	if err := applyAndVerifyModes(stagePackage, manifest, expected.Target); err != nil {
		return report, err
	}
	if err := os.Rename(stagePackage, destination); err != nil {
		return report, err
	}
	if expected.Target.Platform != "win32" {
		if err := os.Chmod(destination, 0555); err != nil {
			removeWritableTree(destination)
			return report, err
		}
	}
	_ = os.Remove(staging)
	return VerificationReport{2, expected.HostPackageID, destination, digest, descriptorDigest, expected.FileManifest.SHA256, extracted, len(records), true}, nil
}

func verifyExtractedClosure(root string, manifest HostFileManifest) error {
	expected := map[string]ManifestFile{"provider/host-files-v2.json": {Path: "provider/host-files-v2.json", Mode: ReadOnly}}
	for _, record := range manifest.Files {
		expected[record.Path] = record
	}
	actual := []string{}
	err := filepath.WalkDir(root, func(target string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if target == root {
			return nil
		}
		relative, _ := filepath.Rel(root, target)
		relative = filepath.ToSlash(relative)
		if entry.IsDir() {
			return nil
		}
		info, err := entry.Info()
		if err != nil || !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 {
			return errors.New("extracted non-regular file")
		}
		actual = append(actual, relative)
		record, ok := expected[relative]
		if !ok {
			return fmt.Errorf("extra extracted file %s", relative)
		}
		if relative != "provider/host-files-v2.json" {
			digest, size, err := HashFile(target)
			if err != nil || digest != record.SHA256 || size != record.SizeBytes {
				return errors.New("extracted file identity mismatch")
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	sort.Strings(actual)
	if len(actual) != len(expected) {
		return errors.New("missing extracted file")
	}
	return nil
}

func actualContained(root, relative string) (string, error) {
	if ValidateRelativePath(relative) != nil {
		return "", errors.New("invalid contained path")
	}
	rootActual, err := filepath.EvalSymlinks(root)
	if err != nil {
		return "", err
	}
	target := filepath.Join(rootActual, filepath.FromSlash(relative))
	actual, err := filepath.EvalSymlinks(target)
	if err != nil {
		return "", err
	}
	rel, err := filepath.Rel(rootActual, actual)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || filepath.IsAbs(rel) {
		return "", errors.New("contained path escape")
	}
	return actual, nil
}

func readOnlyTreeSnapshot(root string) (map[string]string, error) {
	result := map[string]string{}
	err := filepath.WalkDir(root, func(target string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() {
			return nil
		}
		relative, _ := filepath.Rel(root, target)
		digest, size, err := HashFile(target)
		if err != nil {
			return err
		}
		result[filepath.ToSlash(relative)] = fmt.Sprintf("%s:%d", digest, size)
		return nil
	})
	return result, err
}

func removeWritableTree(root string) {
	_ = filepath.WalkDir(root, func(target string, entry os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if entry.IsDir() {
			_ = os.Chmod(target, 0700)
		} else {
			_ = os.Chmod(target, 0600)
		}
		return nil
	})
	_ = os.RemoveAll(root)
}
