//go:build windows

package launcher

import "syscall"

func platformPathIsReparse(path string) bool {
	pointer, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		return true
	}
	attributes, err := syscall.GetFileAttributes(pointer)
	return err != nil || attributes&syscall.FILE_ATTRIBUTE_REPARSE_POINT != 0
}
