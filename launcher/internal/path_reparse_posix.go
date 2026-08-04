//go:build !windows

package launcher

func platformPathIsReparse(string) bool { return false }
