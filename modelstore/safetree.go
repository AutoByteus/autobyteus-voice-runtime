package modelstore

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"os"
	"syscall"
)

func syncOwnedDirectory(root *os.Root) error {
	file, err := root.Open(".")
	if err != nil {
		return err
	}
	defer file.Close()
	return file.Sync()
}

func (s *Store) syncOwnedDirectory(relative string) error {
	directory, err := s.openOwnedDirectory(relative, false)
	if err != nil {
		return err
	}
	defer directory.Close()
	return syncOwnedDirectory(directory)
}

func (s *Store) syncOwnedTree(relative string) error {
	directory, err := s.openOwnedDirectory(relative, false)
	if err != nil {
		return err
	}
	defer directory.Close()
	return syncDirectoryTree(directory)
}

func syncDirectoryTree(root *os.Root) error {
	file, err := root.Open(".")
	if err != nil {
		return err
	}
	entries, err := file.ReadDir(-1)
	_ = file.Close()
	if err != nil {
		return err
	}
	for _, entry := range entries {
		info, err := root.Lstat(entry.Name())
		if err != nil || info.Mode()&os.ModeSymlink != 0 {
			return ErrStoreCorrupt
		}
		if safeDirectoryInfo(info) {
			child, err := root.OpenRoot(entry.Name())
			if err != nil {
				return ErrStoreCorrupt
			}
			opened, openedErr := child.Stat(".")
			if openedErr != nil || !os.SameFile(info, opened) {
				_ = child.Close()
				return ErrStoreCorrupt
			}
			if err := syncDirectoryTree(child); err != nil {
				_ = child.Close()
				return err
			}
			_ = child.Close()
			continue
		}
		if !safeRegularInfo(info) {
			return ErrStoreCorrupt
		}
		child, err := root.OpenFile(entry.Name(), os.O_RDONLY|syscall.O_NOFOLLOW, 0)
		if err != nil {
			return err
		}
		opened, openedErr := child.Stat()
		if openedErr != nil || !os.SameFile(info, opened) {
			_ = child.Close()
			return ErrStoreCorrupt
		}
		syncErr := child.Sync()
		_ = child.Close()
		if syncErr != nil {
			return syncErr
		}
	}
	return syncOwnedDirectory(root)
}

func (s *Store) removeOwnedTree(relative string) error {
	parent, leaf, err := s.openOwnedParent(relative, false)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	defer parent.Close()
	info, err := parent.Lstat(leaf)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil || !safeDirectoryInfo(info) {
		return ErrStoreCorrupt
	}
	directory, err := parent.OpenRoot(leaf)
	if err != nil {
		return ErrStoreCorrupt
	}
	opened, openedErr := directory.Stat(".")
	if openedErr != nil || !os.SameFile(info, opened) {
		_ = directory.Close()
		return ErrStoreCorrupt
	}
	if err := removeDirectoryContents(directory); err != nil {
		_ = directory.Close()
		return err
	}
	_ = directory.Close()
	return parent.Remove(leaf)
}

func removeDirectoryContents(root *os.Root) error {
	file, err := root.Open(".")
	if err != nil {
		return err
	}
	entries, err := file.ReadDir(-1)
	_ = file.Close()
	if err != nil {
		return err
	}
	for _, entry := range entries {
		info, err := root.Lstat(entry.Name())
		if err != nil || info.Mode()&os.ModeSymlink != 0 {
			return ErrStoreCorrupt
		}
		if safeDirectoryInfo(info) {
			child, err := root.OpenRoot(entry.Name())
			if err != nil {
				return ErrStoreCorrupt
			}
			opened, openedErr := child.Stat(".")
			if openedErr != nil || !os.SameFile(info, opened) {
				_ = child.Close()
				return ErrStoreCorrupt
			}
			if err := removeDirectoryContents(child); err != nil {
				_ = child.Close()
				return err
			}
			_ = child.Close()
			if err := root.Remove(entry.Name()); err != nil {
				return err
			}
			continue
		}
		if !safeRegularInfo(info) {
			return ErrStoreCorrupt
		}
		if err := root.Remove(entry.Name()); err != nil {
			return err
		}
	}
	return nil
}

func digestFile(file *os.File) (string, error) {
	hash := sha256.New()
	if _, err := io.CopyBuffer(hash, file, make([]byte, 256*1024)); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}
