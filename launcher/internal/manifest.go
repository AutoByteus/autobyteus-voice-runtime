package launcher

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func validateControlFiles(root string, config SessionConfig, plan LauncherPlan, embeddedPlan []byte) error {
	manifestPath, err := containedRegular(root, "provider/package-files-v1.json")
	if err != nil {
		return err
	}
	manifestBytes, err := os.ReadFile(manifestPath)
	if err != nil || digest(manifestBytes) != config.Expected.FileManifestSHA256 {
		return errors.New("manifest identity mismatch")
	}
	var manifest FileManifest
	if decodeExact(manifestBytes, &manifest) != nil || manifest.SchemaVersion != 1 || manifest.PackageID != plan.PackageID {
		return errors.New("invalid manifest")
	}
	if !sort.SliceIsSorted(manifest.Files, func(i, j int) bool { return manifest.Files[i].Path < manifest.Files[j].Path }) {
		return errors.New("manifest not sorted")
	}
	requiredExecutable := map[string]bool{plan.Invocation.Executable: true}
	launcherPath := "bin/voice-provider"
	if config.Expected.Platform == "win32" {
		launcherPath += ".exe"
	}
	requiredExecutable[launcherPath] = true
	seen := map[string]bool{}
	for _, record := range manifest.Files {
		if seen[record.Path] || !validRelativePath(record.Path) || !sha256Pattern.MatchString(record.SHA256) || record.SizeBytes < 0 || (record.Mode != "executable" && record.Mode != "read-only") {
			return errors.New("invalid manifest record")
		}
		seen[record.Path] = true
		if requiredExecutable[record.Path] && record.Mode != "executable" {
			return errors.New("private executable mode mismatch")
		}
		if isControlRecord(record.Path, plan) {
			controlPath, err := containedRegular(root, record.Path)
			if err != nil {
				return err
			}
			data, err := os.ReadFile(controlPath)
			if err != nil || int64(len(data)) != record.SizeBytes || digest(data) != record.SHA256 {
				return errors.New("control file identity mismatch")
			}
		}
	}
	for required := range requiredExecutable {
		if !seen[required] {
			return errors.New("missing executable record")
		}
	}
	descriptorPath, err := containedRegular(root, "provider/provider-package-v1.json")
	if err != nil {
		return err
	}
	descriptorBytes, err := os.ReadFile(descriptorPath)
	if err != nil || digest(descriptorBytes) != config.Expected.DescriptorSHA256 {
		return errors.New("descriptor identity mismatch")
	}
	planCopy, err := os.ReadFile(filepath.Join(root, "provider", "package-launcher-plan-v1.json"))
	if err != nil || string(planCopy) != string(embeddedPlan) {
		return errors.New("embedded launcher plan mismatch")
	}
	return nil
}

func isControlRecord(relative string, plan LauncherPlan) bool {
	if relative == plan.Invocation.Executable || relative == plan.Invocation.Worker || relative == "bin/voice-provider" || relative == "bin/voice-provider.exe" {
		return true
	}
	return relative == "model/model-descriptor-v1.json" || strings.HasPrefix(relative, "worker/") || strings.HasPrefix(relative, "normalizer/") || strings.HasPrefix(relative, "provider/") || strings.HasPrefix(relative, "contracts/")
}

func digest(value []byte) string { sum := sha256.Sum256(value); return hex.EncodeToString(sum[:]) }

func validatePrivatePaths(root string, plan LauncherPlan) (string, string, error) {
	executable, err := containedRegular(root, plan.Invocation.Executable)
	if err != nil {
		return "", "", err
	}
	worker := ""
	if plan.Invocation.Kind == "python-worker" {
		worker, err = containedRegular(root, plan.Invocation.Worker)
		if err != nil {
			return "", "", err
		}
	}
	info, err := os.Stat(executable)
	if err != nil {
		return "", "", err
	}
	if actualTarget().Platform != "win32" && info.Mode().Perm()&0111 == 0 {
		return "", "", errors.New("private executable not executable")
	}
	_ = filepath.Separator
	return executable, worker, nil
}
