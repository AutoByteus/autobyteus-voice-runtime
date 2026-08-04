//go:build windows

package launcher

import (
	"errors"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

var getWindowsDirectoryW = syscall.NewLazyDLL("kernel32.dll").NewProc("GetWindowsDirectoryW")

func validatedWindowsSystemRoot(value string) (string, error) {
	if value == "" || !filepath.IsAbs(value) {
		return "", errors.New("invalid windows system root")
	}
	buffer := make([]uint16, 32768)
	length, _, _ := getWindowsDirectoryW.Call(uintptr(unsafe.Pointer(&buffer[0])), uintptr(len(buffer)))
	if length == 0 || length >= uintptr(len(buffer)) {
		return "", errors.New("windows directory lookup failed")
	}
	expected, err := filepath.Abs(syscall.UTF16ToString(buffer[:length]))
	if err != nil {
		return "", errors.New("windows directory identity failed")
	}
	actual, err := filepath.EvalSymlinks(value)
	if err != nil || platformPathIsReparse(actual) {
		return "", errors.New("windows directory is not canonical")
	}
	actual, err = filepath.Abs(actual)
	if err != nil || !strings.EqualFold(filepath.Clean(actual), filepath.Clean(expected)) {
		return "", errors.New("windows directory identity mismatch")
	}
	return expected, nil
}
