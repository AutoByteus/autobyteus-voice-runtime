package modelstore

import (
	"io"
	"os"
	"path/filepath"
	"strings"
	"syscall"
)

func openStoreRoot(path string) (*os.Root, error) {
	root, err := os.OpenRoot(path)
	if err != nil {
		return nil, err
	}
	pathInfo, pathErr := os.Lstat(path)
	rootInfo, rootErr := root.Stat(".")
	if pathErr != nil || rootErr != nil || pathInfo.Mode()&os.ModeSymlink != 0 || !pathInfo.IsDir() || !os.SameFile(pathInfo, rootInfo) {
		_ = root.Close()
		return nil, ErrStoreCorrupt
	}
	return root, nil
}

func (s *Store) Close() error {
	if s == nil || s.fs == nil {
		return nil
	}
	err := s.fs.Close()
	s.fs = nil
	return err
}

func safeParts(relative string) ([]string, error) {
	if relative == "." {
		return nil, nil
	}
	if relative == "" || filepath.IsAbs(relative) || filepath.Clean(relative) != relative {
		return nil, ErrStoreCorrupt
	}
	parts := strings.Split(filepath.ToSlash(relative), "/")
	for _, part := range parts {
		if part == "" || part == "." || part == ".." || strings.Contains(part, "\\") {
			return nil, ErrStoreCorrupt
		}
	}
	return parts, nil
}

func safeDirectoryInfo(info os.FileInfo) bool {
	return info != nil && info.IsDir() && info.Mode()&os.ModeSymlink == 0 && info.Mode().Perm()&0022 == 0
}

func safeRegularInfo(info os.FileInfo) bool {
	if info == nil || !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 {
		return false
	}
	stat, ok := info.Sys().(*syscall.Stat_t)
	return !ok || stat.Nlink == 1
}

// openOwnedDirectory walks one descriptor-relative component at a time. Every
// opened descriptor is compared with the lstat subject that authorized it, so
// a symlink/non-directory replacement cannot redirect an owned operation.
func (s *Store) openOwnedDirectory(relative string, create bool) (*os.Root, error) {
	if s == nil || s.fs == nil {
		return nil, ErrStoreCorrupt
	}
	parts, err := safeParts(relative)
	if err != nil {
		return nil, err
	}
	current, err := s.fs.OpenRoot(".")
	if err != nil {
		return nil, ErrStoreCorrupt
	}
	for _, part := range parts {
		before, statErr := current.Lstat(part)
		if os.IsNotExist(statErr) && create {
			if mkdirErr := current.Mkdir(part, 0700); mkdirErr != nil && !os.IsExist(mkdirErr) {
				_ = current.Close()
				return nil, mkdirErr
			}
			before, statErr = current.Lstat(part)
		}
		if statErr != nil {
			_ = current.Close()
			return nil, statErr
		}
		if !safeDirectoryInfo(before) {
			_ = current.Close()
			return nil, ErrStoreCorrupt
		}
		next, openErr := current.OpenRoot(part)
		if openErr != nil {
			_ = current.Close()
			return nil, ErrStoreCorrupt
		}
		after, afterErr := next.Stat(".")
		if afterErr != nil || !safeDirectoryInfo(after) || !os.SameFile(before, after) {
			_ = next.Close()
			_ = current.Close()
			return nil, ErrStoreCorrupt
		}
		_ = current.Close()
		current = next
	}
	return current, nil
}

func (s *Store) openOwnedParent(relative string, create bool) (*os.Root, string, error) {
	parts, err := safeParts(relative)
	if err != nil || len(parts) == 0 {
		return nil, "", ErrStoreCorrupt
	}
	parent := "."
	if len(parts) > 1 {
		parent = filepath.Join(parts[:len(parts)-1]...)
	}
	directory, err := s.openOwnedDirectory(parent, create)
	if err != nil {
		return nil, "", err
	}
	return directory, parts[len(parts)-1], nil
}

func (s *Store) openOwnedRegular(relative string, flags int, mode os.FileMode, createParents bool) (*os.File, error) {
	parent, leaf, err := s.openOwnedParent(relative, createParents)
	if err != nil {
		return nil, err
	}
	defer parent.Close()
	before, statErr := parent.Lstat(leaf)
	if statErr == nil && !safeRegularInfo(before) {
		return nil, ErrStoreCorrupt
	}
	if statErr != nil && !os.IsNotExist(statErr) {
		return nil, ErrStoreCorrupt
	}
	file, err := parent.OpenFile(leaf, flags|syscall.O_NOFOLLOW, mode)
	if err != nil {
		return nil, err
	}
	after, statErr := file.Stat()
	if statErr != nil || !safeRegularInfo(after) || (before != nil && !os.SameFile(before, after)) {
		_ = file.Close()
		return nil, ErrStoreCorrupt
	}
	return file, nil
}

func (s *Store) readOwned(relative string, limit int64) ([]byte, error) {
	file, err := s.openOwnedRegular(relative, os.O_RDONLY, 0, false)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || info.Size() > limit {
		return nil, ErrStoreCorrupt
	}
	return io.ReadAll(io.LimitReader(file, limit+1))
}

func (s *Store) writeOwnedExclusive(relative string, data []byte, mode os.FileMode) error {
	file, err := s.openOwnedRegular(relative, os.O_CREATE|os.O_EXCL|os.O_WRONLY, mode, true)
	if err != nil {
		return err
	}
	_, writeErr := file.Write(data)
	syncErr := file.Sync()
	closeErr := file.Close()
	if writeErr != nil {
		return writeErr
	}
	if syncErr != nil {
		return syncErr
	}
	return closeErr
}

func (s *Store) removeOwned(relative string, allowDirectory bool) error {
	parent, leaf, err := s.openOwnedParent(relative, false)
	if err != nil {
		return err
	}
	defer parent.Close()
	info, err := parent.Lstat(leaf)
	if err != nil {
		return err
	}
	if info.Mode()&os.ModeSymlink != 0 || (!allowDirectory && !safeRegularInfo(info)) || (allowDirectory && !safeDirectoryInfo(info)) {
		return ErrStoreCorrupt
	}
	return parent.Remove(leaf)
}

func (s *Store) renameOwned(oldRelative, newRelative string) error {
	oldParent, oldLeaf, err := s.openOwnedParent(oldRelative, false)
	if err != nil {
		return err
	}
	defer oldParent.Close()
	newParent, newLeaf, err := s.openOwnedParent(newRelative, false)
	if err != nil {
		return err
	}
	defer newParent.Close()
	before, err := oldParent.Lstat(oldLeaf)
	if err != nil || before.Mode()&os.ModeSymlink != 0 || (!safeRegularInfo(before) && !safeDirectoryInfo(before)) {
		return ErrStoreCorrupt
	}
	if destination, destinationErr := newParent.Lstat(newLeaf); destinationErr == nil {
		if destination.Mode()&os.ModeSymlink != 0 || (!safeRegularInfo(destination) && !safeDirectoryInfo(destination)) {
			return ErrStoreCorrupt
		}
	} else if !os.IsNotExist(destinationErr) {
		return ErrStoreCorrupt
	}
	if err := s.fs.Rename(oldRelative, newRelative); err != nil {
		return err
	}
	after, err := newParent.Lstat(newLeaf)
	if err != nil || !os.SameFile(before, after) {
		return ErrStoreCorrupt
	}
	return nil
}
