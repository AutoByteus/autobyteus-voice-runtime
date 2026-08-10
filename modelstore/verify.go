package modelstore

import (
	"errors"
	"os"
	"path/filepath"
	"sort"
	"syscall"

	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
)

// verifyOwnedModelTree authenticates the complete immutable model tree from a
// descriptor already rooted beneath Store 1. Descendant names are never
// reopened through the caller-controlled absolute installation path.
func (s *Store) verifyOwnedModelTree(relative string, files []modelcontract.FileIdentity) error {
	root, err := s.openOwnedDirectory(relative, false)
	if err != nil {
		return err
	}
	defer root.Close()
	actual := map[string]observedModelFile{}
	if err := collectOwnedModelFiles(root, "", actual); err != nil {
		return err
	}
	paths := make([]string, 0, len(actual))
	for path := range actual {
		paths = append(paths, path)
	}
	sort.Strings(paths)
	if len(paths) != len(files) {
		return errors.New("model tree file count mismatch")
	}
	for index, expected := range files {
		observed := actual[paths[index]]
		if paths[index] != expected.Path || observed.size != expected.SizeBytes || observed.sha256 != expected.SHA256 || observed.mode&0222 != 0 {
			return errors.New("model file identity mismatch")
		}
	}
	return nil
}

type observedModelFile struct {
	size   int64
	sha256 string
	mode   os.FileMode
}

func collectOwnedModelFiles(root *os.Root, prefix string, actual map[string]observedModelFile) error {
	directory, err := root.Open(".")
	if err != nil {
		return err
	}
	entries, err := directory.ReadDir(-1)
	_ = directory.Close()
	if err != nil {
		return err
	}
	for _, entry := range entries {
		name := entry.Name()
		before, err := root.Lstat(name)
		if err != nil || before.Mode()&os.ModeSymlink != 0 {
			return ErrStoreCorrupt
		}
		relative := filepath.ToSlash(filepath.Join(prefix, name))
		if safeDirectoryInfo(before) {
			child, err := root.OpenRoot(name)
			if err != nil {
				return ErrStoreCorrupt
			}
			after, statErr := child.Stat(".")
			if statErr != nil || !os.SameFile(before, after) {
				_ = child.Close()
				return ErrStoreCorrupt
			}
			err = collectOwnedModelFiles(child, relative, actual)
			_ = child.Close()
			if err != nil {
				return err
			}
			continue
		}
		if !safeRegularInfo(before) {
			return ErrStoreCorrupt
		}
		file, err := root.OpenFile(name, os.O_RDONLY|syscall.O_NOFOLLOW, 0)
		if err != nil {
			return ErrStoreCorrupt
		}
		after, statErr := file.Stat()
		if statErr != nil || !safeRegularInfo(after) || !os.SameFile(before, after) {
			_ = file.Close()
			return ErrStoreCorrupt
		}
		digest, digestErr := digestFile(file)
		_ = file.Close()
		if digestErr != nil {
			return digestErr
		}
		actual[relative] = observedModelFile{size: after.Size(), sha256: digest, mode: after.Mode().Perm()}
	}
	return nil
}
