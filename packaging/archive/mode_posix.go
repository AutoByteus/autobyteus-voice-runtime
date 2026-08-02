//go:build !windows

package archive

import (
	"errors"
	"os"
	"path/filepath"
)

func applyAndVerifyModes(root string, manifest PackageFileManifest, _ Target) error {
	modes := map[string]FileMode{"provider/package-files-v1.json": ReadOnly}
	for _, record := range manifest.Files {
		modes[record.Path] = record.Mode
	}
	for relative, logical := range modes {
		target, err := actualContained(root, relative)
		if err != nil {
			return err
		}
		mode := os.FileMode(0444)
		if logical == Executable {
			mode = 0555
		}
		if err := os.Chmod(target, mode); err != nil {
			return err
		}
		info, err := os.Lstat(target)
		if err != nil || !info.Mode().IsRegular() || info.Mode().Perm() != mode {
			return errors.New("final POSIX file mode mismatch")
		}
	}
	directories := []string{}
	if err := filepath.WalkDir(root, func(target string, entry os.DirEntry, err error) error {
		if err == nil && entry.IsDir() {
			directories = append(directories, target)
		}
		return err
	}); err != nil {
		return err
	}
	for index := len(directories) - 1; index >= 0; index-- {
		if directories[index] == root {
			continue
		}
		if err := os.Chmod(directories[index], 0555); err != nil {
			return err
		}
	}
	return nil
}
