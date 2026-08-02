//go:build windows

package archive

import (
	"debug/pe"
	"errors"
	"os"
	"path/filepath"
	"syscall"
)

func applyAndVerifyModes(root string, manifest PackageFileManifest, target Target) error {
	modes := map[string]FileMode{"provider/package-files-v1.json": ReadOnly}
	for _, record := range manifest.Files {
		modes[record.Path] = record.Mode
	}
	for relative, logical := range modes {
		filePath, err := actualContained(root, relative)
		if err != nil {
			return err
		}
		pointer, err := syscall.UTF16PtrFromString(filePath)
		if err != nil {
			return err
		}
		attributes, err := syscall.GetFileAttributes(pointer)
		if err != nil || attributes&syscall.FILE_ATTRIBUTE_REPARSE_POINT != 0 {
			return errors.New("windows reparse point rejected")
		}
		if logical == Executable {
			if filepath.Ext(relative) != ".exe" || !validPE(filePath, target.Architecture) {
				return errors.New("windows executable identity mismatch")
			}
		}
		if err := syscall.SetFileAttributes(pointer, attributes|syscall.FILE_ATTRIBUTE_READONLY); err != nil {
			return err
		}
		current, err := syscall.GetFileAttributes(pointer)
		if err != nil || current&syscall.FILE_ATTRIBUTE_READONLY == 0 {
			return errors.New("windows read-only attribute missing")
		}
	}
	return nil
}
func validPE(path, architecture string) bool {
	file, err := pe.Open(path)
	if err != nil {
		return false
	}
	defer file.Close()
	expected := uint16(pe.IMAGE_FILE_MACHINE_AMD64)
	if architecture == "arm64" {
		expected = pe.IMAGE_FILE_MACHINE_ARM64
	}
	return file.FileHeader.Machine == expected
}

var _ = os.FileMode(0)
