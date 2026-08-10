package modelstore

import (
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var idPattern = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)

func Open(root string) (*Store, error) {
	if !filepath.IsAbs(root) {
		return nil, errors.New("installation root must be absolute")
	}
	clean := filepath.Clean(root)
	if err := ensureLineage(clean); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(clean, 0700); err != nil {
		return nil, err
	}
	if err := ensureLineage(clean); err != nil {
		return nil, err
	}
	info, err := os.Stat(clean)
	if err != nil || !info.IsDir() || info.Mode().Perm()&0022 != 0 {
		return nil, errors.New("unsafe installation root")
	}
	rootHandle, err := openStoreRoot(clean)
	if err != nil {
		return nil, err
	}
	store := &Store{Root: clean, fs: rootHandle}
	for _, directory := range []string{"models", "activations", "profiles", "partials", "locks", "leases"} {
		owned, err := store.openOwnedDirectory(directory, true)
		if err != nil {
			_ = store.Close()
			return nil, err
		}
		_ = owned.Close()
	}
	return store, nil
}

// OpenReadOnly validates an existing store without creating or repairing any
// path. Provider startup and status use this boundary so reads cannot mutate
// the caller-owned installation root.
func OpenReadOnly(root string) (*Store, error) {
	if !filepath.IsAbs(root) {
		return nil, errors.New("installation root must be absolute")
	}
	clean := filepath.Clean(root)
	if err := ensureLineage(clean); err != nil {
		return nil, err
	}
	info, err := os.Lstat(clean)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 || info.Mode().Perm()&0022 != 0 {
		return nil, errors.New("unsafe installation root")
	}
	rootHandle, err := openStoreRoot(clean)
	if err != nil {
		return nil, err
	}
	store := &Store{Root: clean, fs: rootHandle}
	for _, directory := range []string{"models", "activations", "profiles", "partials", "locks", "leases"} {
		owned, err := store.openOwnedDirectory(directory, false)
		if err != nil {
			_ = store.Close()
			return nil, err
		}
		_ = owned.Close()
	}
	return store, nil
}

func ensureLineage(target string) error {
	volume := filepath.VolumeName(target)
	rest := strings.TrimPrefix(target, volume+string(filepath.Separator))
	current := volume + string(filepath.Separator)
	if volume == "" {
		current = string(filepath.Separator)
	}
	for _, part := range strings.Split(rest, string(filepath.Separator)) {
		if part == "" {
			continue
		}
		current = filepath.Join(current, part)
		info, err := os.Lstat(current)
		if os.IsNotExist(err) {
			return nil
		}
		if err != nil {
			return err
		}
		if info.Mode()&os.ModeSymlink != 0 || (!info.IsDir() && current != target) {
			return errors.New("symlink or non-directory installation lineage")
		}
	}
	return nil
}

func validateID(value string) error {
	if !idPattern.MatchString(value) || value == "." || value == ".." {
		return errors.New("invalid store identity")
	}
	return nil
}

func (s *Store) modelRoot(modelAssetID, manifestSHA string) (string, error) {
	relative, err := s.modelRelativeRoot(modelAssetID, manifestSHA)
	if err != nil {
		return "", err
	}
	return filepath.Join(s.Root, relative), nil
}

func (s *Store) modelRelativeRoot(modelAssetID, manifestSHA string) (string, error) {
	if validateID(modelAssetID) != nil || !digestPattern.MatchString(manifestSHA) {
		return "", errors.New("invalid model identity")
	}
	return filepath.Join("models", modelAssetID, manifestSHA), nil
}

func (s *Store) ModelRoot(modelAssetID, manifestSHA string) (string, error) {
	return s.modelRoot(modelAssetID, manifestSHA)
}
func (s *Store) activationPath(installationID string) (string, error) {
	relative, err := s.activationRelativePath(installationID)
	if err != nil {
		return "", err
	}
	return filepath.Join(s.Root, relative), nil
}

func (s *Store) activationRelativePath(installationID string) (string, error) {
	if validateUUID(installationID) != nil {
		return "", errors.New("invalid installation identity")
	}
	return filepath.Join("activations", installationID, "profile-activation-v1.json"), nil
}

func (s *Store) ActivationPath(installationID string) (string, error) {
	return s.activationPath(installationID)
}
func (s *Store) pointerRelativePath(profile string) (string, error) {
	if profile != "english" && profile != "chinese" {
		return "", errors.New("invalid profile")
	}
	return filepath.Join("profiles", profile, "darwin-arm64", "active-v1.json"), nil
}
