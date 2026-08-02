package archive

import (
	"archive/zip"
	"compress/flate"
	"errors"
	"hash/crc32"
	"io"
	"os"
	"path/filepath"
	"sort"
	"time"
)

type BuildReport struct {
	SHA256              string
	CompressedSizeBytes int64
	ExtractedSizeBytes  int64
	EntryCount          int
}

func BuildCanonicalZIP(packageRoot, outputPath string) (BuildReport, error) {
	manifest, err := ReadManifest(filepath.Join(packageRoot, "provider", "package-files-v1.json"))
	if err != nil {
		return BuildReport{}, err
	}
	modes := map[string]FileMode{"provider/package-files-v1.json": ReadOnly}
	for _, record := range manifest.Files {
		modes[record.Path] = record.Mode
	}
	paths, extracted, err := completeRegularFiles(packageRoot, modes)
	if err != nil {
		return BuildReport{}, err
	}
	sort.Strings(paths)
	if extracted > MaxPackageBytes || len(paths) >= 65535 {
		return BuildReport{}, errors.New("package exceeds Provider Archive 1 limits")
	}
	if err := os.MkdirAll(filepath.Dir(outputPath), 0700); err != nil {
		return BuildReport{}, err
	}
	output, err := os.OpenFile(outputPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		return BuildReport{}, err
	}
	success := false
	defer func() {
		output.Close()
		if !success {
			os.Remove(outputPath)
		}
	}()
	writer := zip.NewWriter(output)
	for _, relative := range paths {
		if err := addCanonicalFile(writer, packageRoot, relative, modes[relative], filepath.Dir(outputPath)); err != nil {
			writer.Close()
			return BuildReport{}, err
		}
	}
	if err := writer.Close(); err != nil {
		return BuildReport{}, err
	}
	if err := output.Sync(); err != nil {
		return BuildReport{}, err
	}
	if err := output.Close(); err != nil {
		return BuildReport{}, err
	}
	digest, compressed, err := HashFile(outputPath)
	if err != nil || compressed > MaxPackageBytes {
		return BuildReport{}, errors.New("archive identity failed")
	}
	success = true
	return BuildReport{digest, compressed, extracted, len(paths)}, nil
}

func addCanonicalFile(writer *zip.Writer, root, relative string, logical FileMode, temporaryRoot string) error {
	source, err := os.Open(filepath.Join(root, filepath.FromSlash(relative)))
	if err != nil {
		return err
	}
	defer source.Close()
	compressed, err := os.CreateTemp(temporaryRoot, ".deflate-")
	if err != nil {
		return err
	}
	compressedName := compressed.Name()
	defer os.Remove(compressedName)
	crc := crc32.NewIEEE()
	compressor, err := flate.NewWriter(compressed, flate.BestCompression)
	if err != nil {
		return err
	}
	size, err := io.Copy(io.MultiWriter(compressor, crc), source)
	if closeErr := compressor.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		compressed.Close()
		return err
	}
	compressedSize, err := compressed.Seek(0, io.SeekCurrent)
	if err != nil {
		compressed.Close()
		return err
	}
	if _, err = compressed.Seek(0, io.SeekStart); err != nil {
		compressed.Close()
		return err
	}
	perm := os.FileMode(0444)
	if logical == Executable {
		perm = 0555
	}
	header := &zip.FileHeader{Name: "package/" + relative, Method: zip.Deflate, Flags: 0x800, CRC32: crc.Sum32(), CompressedSize64: uint64(compressedSize), UncompressedSize64: uint64(size), CreatorVersion: uint16(3<<8 | 20), ReaderVersion: 20, Modified: time.Date(1980, 1, 1, 0, 0, 0, 0, time.UTC)}
	header.SetMode(0100000 | perm)
	header.Extra = nil
	header.Comment = ""
	header.ModifiedDate = 0x21
	header.ModifiedTime = 0
	destination, err := writer.CreateRaw(header)
	if err == nil {
		_, err = io.Copy(destination, compressed)
	}
	closeErr := compressed.Close()
	if err == nil {
		err = closeErr
	}
	return err
}

func completeRegularFiles(root string, modes map[string]FileMode) ([]string, int64, error) {
	paths := []string{}
	var total int64
	err := filepath.WalkDir(root, func(target string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if target == root {
			return nil
		}
		relativeNative, _ := filepath.Rel(root, target)
		relative := filepath.ToSlash(relativeNative)
		if entry.IsDir() {
			return nil
		}
		info, err := entry.Info()
		if err != nil || !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 {
			return errors.New("package contains non-regular entry")
		}
		if _, ok := modes[relative]; !ok {
			return errors.New("package contains file absent from manifest")
		}
		paths = append(paths, relative)
		total += info.Size()
		return nil
	})
	if err != nil {
		return nil, 0, err
	}
	if len(paths) != len(modes) || ValidatePathSet(paths) != nil {
		return nil, 0, errors.New("manifest/file closure mismatch")
	}
	return paths, total, nil
}
