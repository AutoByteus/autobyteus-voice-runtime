package modelstore

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"sort"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
	"github.com/AutoByteus/autobyteus-voice-runtime/integrity"
	"github.com/AutoByteus/autobyteus-voice-runtime/internal/contractjson"
)

var (
	digestPattern   = regexp.MustCompile(`^[a-f0-9]{64}$`)
	uuidPattern     = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	revisionPattern = regexp.MustCompile(`^[a-f0-9]{40}$`)
	rolePattern     = regexp.MustCompile(`^[a-z][a-z0-9-]+$`)
	ErrLeaseBusy    = errors.New("lease busy")
)

type Store struct{ Root string }

func validateUUID(value string) error {
	if !uuidPattern.MatchString(value) {
		return errors.New("invalid UUID")
	}
	return nil
}

func (s *Store) PartialPaths(manifestSHA, relative string) (string, string, error) {
	if !digestPattern.MatchString(manifestSHA) || !integrity.ValidRelativePath(relative) {
		return "", "", errors.New("invalid partial identity")
	}
	encoded := fmt.Sprintf("%x", []byte(relative))
	directory := filepath.Join(s.Root, "partials", manifestSHA)
	if err := os.MkdirAll(directory, 0700); err != nil {
		return "", "", err
	}
	if err := validateOwnedDirectory(filepath.Join(s.Root, "partials")); err != nil {
		return "", "", err
	}
	if err := validateOwnedDirectory(directory); err != nil {
		return "", "", err
	}
	return filepath.Join(directory, encoded+".part"), filepath.Join(directory, "partial-download-v1.json"), nil
}

func (s *Store) VerifyModel(modelAssetID, manifestSHA string, files []modelcontract.FileIdentity) error {
	root, err := s.modelRoot(modelAssetID, manifestSHA)
	if err != nil {
		return err
	}
	return integrity.VerifyTree(filepath.Join(root, "files"), files)
}

func (s *Store) CommitModel(modelAssetID, manifestSHA string, files []modelcontract.FileIdentity, partials map[string]string, manifestBytes, noticeBytes []byte) (string, error) {
	final, err := s.modelRoot(modelAssetID, manifestSHA)
	if err != nil {
		return "", err
	}
	if _, err := os.Stat(final); err == nil {
		return final, s.VerifyCommittedModel(modelAssetID, manifestSHA, files, manifestBytes, noticeBytes)
	}
	staging := final + ".staging"
	_ = os.RemoveAll(staging)
	if err := os.MkdirAll(filepath.Join(staging, "files"), 0700); err != nil {
		return "", err
	}
	cleanup := true
	defer func() {
		if cleanup {
			_ = os.RemoveAll(staging)
		}
	}()
	for _, item := range files {
		source := partials[item.Path]
		if source == "" {
			return "", errors.New("missing verified partial")
		}
		destination := filepath.Join(staging, "files", filepath.FromSlash(item.Path))
		if err := os.MkdirAll(filepath.Dir(destination), 0700); err != nil {
			return "", err
		}
		if err := os.Rename(source, destination); err != nil {
			return "", err
		}
		if err := os.Chmod(destination, 0400); err != nil {
			return "", err
		}
	}
	if err := os.WriteFile(filepath.Join(staging, "model-asset-manifest-v1.json"), manifestBytes, 0400); err != nil {
		return "", err
	}
	if err := os.WriteFile(filepath.Join(staging, "THIRD_PARTY_NOTICES.json"), noticeBytes, 0400); err != nil {
		return "", err
	}
	if err := syncTree(staging); err != nil {
		return "", err
	}
	if err := os.MkdirAll(filepath.Dir(final), 0700); err != nil {
		return "", err
	}
	if err := os.Rename(staging, final); err != nil {
		return "", err
	}
	if err := syncDirectory(filepath.Dir(final)); err != nil {
		return "", err
	}
	cleanup = false
	return final, s.VerifyCommittedModel(modelAssetID, manifestSHA, files, manifestBytes, noticeBytes)
}

func (s *Store) VerifyCommittedModel(modelAssetID, manifestSHA string, files []modelcontract.FileIdentity, manifestBytes, noticeBytes []byte) error {
	if err := s.VerifyModel(modelAssetID, manifestSHA, files); err != nil {
		return err
	}
	observedManifest, observedNotice, err := s.ReadModelAuthority(modelAssetID, manifestSHA)
	if err != nil || !bytes.Equal(observedManifest, manifestBytes) || !bytes.Equal(observedNotice, noticeBytes) {
		return errors.New("committed model authority mismatch")
	}
	return nil
}

func CopyFixed(destination string, source io.Reader, maximum int64) (int64, error) {
	file, err := os.OpenFile(destination, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0600)
	if err != nil {
		return 0, err
	}
	written, copyErr := io.CopyBuffer(file, io.LimitReader(source, maximum+1), make([]byte, 256*1024))
	syncErr := file.Sync()
	closeErr := file.Close()
	if copyErr != nil {
		return written, copyErr
	}
	if written > maximum {
		return written, errors.New("download exceeds declared size")
	}
	if syncErr != nil {
		return written, syncErr
	}
	return written, closeErr
}
func syncTree(root string) error {
	paths := []string{}
	err := filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		paths = append(paths, path)
		return nil
	})
	if err != nil {
		return err
	}
	sort.Slice(paths, func(i, j int) bool { return len(paths[i]) > len(paths[j]) })
	for _, path := range paths {
		info, err := os.Lstat(path)
		if err != nil {
			return err
		}
		if info.Mode()&os.ModeSymlink != 0 {
			return errors.New("symlink in store")
		}
		if info.IsDir() {
			if err := syncDirectory(path); err != nil {
				return err
			}
		} else if info.Mode().IsRegular() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			err = file.Sync()
			_ = file.Close()
			if err != nil {
				return err
			}
		} else {
			return errors.New("non-ordinary store entry")
		}
	}
	return nil
}
func syncDirectory(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	return file.Sync()
}

// CleanupInstallation removes only the selected immutable activation and its
// unreferenced content. Callers must hold the store-writer lock and the
// installation's exclusive lifetime lease.
func (s *Store) CleanupInstallation(record modelcontractActivation) error {
	activation, err := s.activationPath(record.InstallationID)
	if err != nil {
		return err
	}
	if err := os.Remove(activation); err != nil && !os.IsNotExist(err) {
		return err
	}
	_ = os.Remove(filepath.Dir(activation))
	if referenced, err := s.modelReferenced(record.ModelAssetID, record.ManifestSHA256); err != nil || referenced {
		return err
	}
	model, err := s.modelRoot(record.ModelAssetID, record.ManifestSHA256)
	if err != nil {
		return err
	}
	return os.RemoveAll(model)
}

type modelcontractActivation struct {
	InstallationID string
	ModelAssetID   string
	ManifestSHA256 string
}

func (s *Store) CleanupSubject(installationID, modelAssetID, manifestSHA string) error {
	return s.CleanupInstallation(modelcontractActivation{installationID, modelAssetID, manifestSHA})
}

func (s *Store) modelReferenced(modelAssetID, manifestSHA string) (bool, error) {
	profiles := filepath.Join(s.Root, "profiles")
	found := false
	err := filepath.WalkDir(profiles, func(path string, entry os.DirEntry, err error) error {
		if os.IsNotExist(err) {
			return nil
		}
		if err != nil || found || entry.IsDir() || entry.Name() != "active-v1.json" {
			return err
		}
		pointerBytes, err := readNoFollow(path)
		if err != nil {
			return err
		}
		var pointer installcontract.ActivePointer
		if contractjson.Decode(pointerBytes, &pointer) != nil {
			return ErrStoreCorrupt
		}
		activationPath, err := s.activationPath(pointer.InstallationID)
		if err != nil {
			return err
		}
		activationBytes, err := readNoFollow(activationPath)
		if err != nil {
			return err
		}
		var activation installcontract.ActivationRecord
		if contractjson.Decode(activationBytes, &activation) != nil || contractjson.Digest(activationBytes) != pointer.ActivationSHA256 {
			return ErrStoreCorrupt
		}
		found = activation.Model.ModelAssetID == modelAssetID && activation.Model.ManifestSHA256 == manifestSHA
		return nil
	})
	return found, err
}

func (s *Store) ReadModelAuthority(modelAssetID, manifestSHA string) ([]byte, []byte, error) {
	root, err := s.modelRoot(modelAssetID, manifestSHA)
	if err != nil {
		return nil, nil, err
	}
	manifest, err := readNoFollow(filepath.Join(root, "model-asset-manifest-v1.json"))
	if err != nil {
		return nil, nil, err
	}
	notice, err := readNoFollow(filepath.Join(root, "THIRD_PARTY_NOTICES.json"))
	if err != nil {
		return nil, nil, err
	}
	return manifest, notice, nil
}
