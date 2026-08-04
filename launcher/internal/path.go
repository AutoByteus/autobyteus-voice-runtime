package launcher

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
)

func DerivePackageRoot() (string, error) {
	executable, err := os.Executable()
	if err != nil {
		return "", err
	}
	actual, err := filepath.EvalSymlinks(executable)
	if err != nil {
		return "", err
	}
	actual, err = filepath.Abs(actual)
	if err != nil {
		return "", err
	}
	expectedName := "voice-provider"
	if actualTarget().Platform == "win32" {
		expectedName += ".exe"
	}
	if filepath.Base(actual) != expectedName || filepath.Base(filepath.Dir(actual)) != "bin" {
		return "", errors.New("launcher path mismatch")
	}
	return filepath.Dir(filepath.Dir(actual)), nil
}

func validRelativePath(value string) bool {
	if value == "" || filepath.IsAbs(value) || strings.Contains(value, "\\") || strings.ContainsRune(value, 0) {
		return false
	}
	cleaned := filepath.ToSlash(filepath.Clean(filepath.FromSlash(value)))
	if cleaned != value || value == "." || strings.HasPrefix(value, "../") || strings.Contains(value, "/../") || strings.Contains(value, "//") {
		return false
	}
	return true
}

func containedRegular(root, relative string) (string, error) {
	if !validRelativePath(relative) {
		return "", errors.New("invalid contained path")
	}
	rootActual, err := filepath.EvalSymlinks(root)
	if err != nil {
		return "", err
	}
	candidate := filepath.Join(rootActual, filepath.FromSlash(relative))
	for current := candidate; current != rootActual; current = filepath.Dir(current) {
		info, err := os.Lstat(current)
		if err != nil || info.Mode()&os.ModeSymlink != 0 || platformPathIsReparse(current) {
			return "", errors.New("path contains a link")
		}
		if filepath.Dir(current) == current {
			return "", errors.New("path lineage escaped package")
		}
	}
	actual, err := filepath.EvalSymlinks(candidate)
	if err != nil {
		return "", err
	}
	rel, err := filepath.Rel(rootActual, actual)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || filepath.IsAbs(rel) {
		return "", errors.New("path escaped package")
	}
	info, err := os.Lstat(actual)
	if err != nil || !info.Mode().IsRegular() {
		return "", errors.New("path is not regular")
	}
	return actual, nil
}
