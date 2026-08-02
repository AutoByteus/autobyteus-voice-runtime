//go:build !windows

package launcher

func validatedWindowsSystemRoot(value string) (string, error) { return value, nil }
