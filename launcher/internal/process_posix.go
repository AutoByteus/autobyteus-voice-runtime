//go:build !windows

package launcher

import "syscall"

func executePrivate(executable string, args, environment []string, _ string) (int, bool) {
	if err := syscall.Exec(executable, args, environment); err != nil {
		return 0, false
	}
	return 0, true
}
