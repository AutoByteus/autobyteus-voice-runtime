package modelstore

import (
	"errors"
	"os"
	"path/filepath"
	"syscall"
)

type Lease struct{ file *os.File }

func (l *Lease) File() *os.File { return l.file }
func (l *Lease) FD() uintptr    { return l.file.Fd() }

// PrepareForExec keeps only this authenticated lease descriptor across the
// POSIX exec boundary used by the launcher.
func (l *Lease) PrepareForExec() error {
	if l == nil || l.file == nil {
		return errors.New("lease is closed")
	}
	_, _, errno := syscall.Syscall(syscall.SYS_FCNTL, l.file.Fd(), syscall.F_SETFD, 0)
	if errno != 0 {
		return errno
	}
	return nil
}
func (l *Lease) Close() error {
	if l == nil || l.file == nil {
		return nil
	}
	_ = syscall.Flock(int(l.file.Fd()), syscall.LOCK_UN)
	return l.file.Close()
}

func acquire(path string, shared bool) (*Lease, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return nil, err
	}
	fd, err := syscall.Open(path, syscall.O_CREAT|syscall.O_RDWR|syscall.O_NOFOLLOW, 0600)
	if err != nil {
		return nil, err
	}
	file := os.NewFile(uintptr(fd), path)
	if file == nil {
		_ = syscall.Close(fd)
		return nil, errors.New("lease descriptor unavailable")
	}
	info, statErr := file.Stat()
	if statErr != nil || !info.Mode().IsRegular() {
		_ = file.Close()
		return nil, errors.New("unsafe lease file")
	}
	if stat, ok := info.Sys().(*syscall.Stat_t); ok && stat.Nlink != 1 {
		_ = file.Close()
		return nil, errors.New("unsafe lease alias")
	}
	operation := syscall.LOCK_EX | syscall.LOCK_NB
	if shared {
		operation = syscall.LOCK_SH | syscall.LOCK_NB
	}
	if err := syscall.Flock(int(file.Fd()), operation); err != nil {
		file.Close()
		if errors.Is(err, syscall.EWOULDBLOCK) {
			return nil, ErrLeaseBusy
		}
		return nil, err
	}
	return &Lease{file: file}, nil
}

func (s *Store) AcquireWriter() (*Lease, error) {
	return acquire(filepath.Join(s.Root, "locks/store-writer-v1.lock"), false)
}
func (s *Store) AcquireInstallationShared(installationID string) (*Lease, error) {
	if validateUUID(installationID) != nil {
		return nil, errors.New("invalid installation identity")
	}
	return acquire(filepath.Join(s.Root, "leases", installationID+".lock"), true)
}
func (s *Store) AcquireInstallationExclusive(installationID string) (*Lease, error) {
	if validateUUID(installationID) != nil {
		return nil, errors.New("invalid installation identity")
	}
	return acquire(filepath.Join(s.Root, "leases", installationID+".lock"), false)
}
