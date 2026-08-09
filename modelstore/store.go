package modelstore

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"regexp"

	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
)

var (
	digestPattern   = regexp.MustCompile(`^[a-f0-9]{64}$`)
	uuidPattern     = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	revisionPattern = regexp.MustCompile(`^[a-f0-9]{40}$`)
	rolePattern     = regexp.MustCompile(`^[a-z][a-z0-9-]+$`)
	ErrLeaseBusy    = errors.New("lease busy")
)

type Store struct {
	Root string
	fs   *os.Root
}

func validateUUID(value string) error {
	if !uuidPattern.MatchString(value) {
		return errors.New("invalid UUID")
	}
	return nil
}

func (s *Store) VerifyModel(modelAssetID, manifestSHA string, files []modelcontract.FileIdentity) error {
	relative, err := s.modelRelativeRoot(modelAssetID, manifestSHA)
	if err != nil {
		return err
	}
	return s.verifyOwnedModelTree(filepath.Join(relative, "files"), files)
}

func (s *Store) CommitModel(modelAssetID, manifestSHA string, files []modelcontract.FileIdentity, partials map[string]*Partial, manifestBytes, noticeBytes []byte) (string, error) {
	finalRelative, err := s.modelRelativeRoot(modelAssetID, manifestSHA)
	if err != nil {
		return "", err
	}
	final := filepath.Join(s.Root, finalRelative)
	if directory, err := s.openOwnedDirectory(finalRelative, false); err == nil {
		_ = directory.Close()
		return final, s.VerifyCommittedModel(modelAssetID, manifestSHA, files, manifestBytes, noticeBytes)
	} else if !os.IsNotExist(err) {
		return "", err
	}
	assetDirectory := filepath.Dir(finalRelative)
	assetRoot, err := s.openOwnedDirectory(assetDirectory, true)
	if err != nil {
		return "", err
	}
	_ = assetRoot.Close()
	stagingRelative := finalRelative + ".staging"
	if err := s.removeOwnedTree(stagingRelative); err != nil && !os.IsNotExist(err) {
		return "", err
	}
	stagingFiles, err := s.openOwnedDirectory(filepath.Join(stagingRelative, "files"), true)
	if err != nil {
		return "", err
	}
	_ = stagingFiles.Close()
	cleanup := true
	defer func() {
		if cleanup {
			_ = s.removeOwnedTree(stagingRelative)
		}
	}()
	for _, item := range files {
		source := partials[item.Path]
		if source == nil || source.store != s {
			return "", errors.New("missing verified partial")
		}
		destinationRelative := filepath.Join(stagingRelative, "files", filepath.FromSlash(item.Path))
		destinationDirectory, err := s.openOwnedDirectory(filepath.Dir(destinationRelative), true)
		if err != nil {
			return "", err
		}
		_ = destinationDirectory.Close()
		if err := s.renameOwned(source.dataRelative, destinationRelative); err != nil {
			return "", err
		}
		destination, err := s.openOwnedRegular(destinationRelative, os.O_RDONLY, 0, false)
		if err != nil {
			return "", err
		}
		chmodErr := destination.Chmod(0400)
		closeErr := destination.Close()
		if chmodErr != nil {
			return "", chmodErr
		}
		if closeErr != nil {
			return "", closeErr
		}
	}
	for _, partial := range partials {
		if err := partial.removeRecord(); err != nil {
			return "", err
		}
	}
	if err := s.writeOwnedExclusive(filepath.Join(stagingRelative, "model-asset-manifest-v1.json"), manifestBytes, 0400); err != nil {
		return "", err
	}
	if err := s.writeOwnedExclusive(filepath.Join(stagingRelative, "THIRD_PARTY_NOTICES.json"), noticeBytes, 0400); err != nil {
		return "", err
	}
	if err := s.syncOwnedTree(stagingRelative); err != nil {
		return "", err
	}
	if err := s.renameOwned(stagingRelative, finalRelative); err != nil {
		return "", err
	}
	if err := s.syncOwnedDirectory(filepath.Dir(finalRelative)); err != nil {
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

// CleanupInstallation removes only the selected immutable activation and its
// unreferenced content. Callers must hold the store-writer lock and the
// installation's exclusive lifetime lease.
func (s *Store) CleanupInstallation(record modelcontractActivation) error {
	activation, err := s.activationRelativePath(record.InstallationID)
	if err != nil {
		return err
	}
	if err := s.removeOwned(activation, false); err != nil && !os.IsNotExist(err) {
		return err
	}
	if err := s.removeOwned(filepath.Dir(activation), true); err != nil && !os.IsNotExist(err) {
		return err
	}
	if referenced, err := s.modelReferenced(record.ModelAssetID, record.ManifestSHA256); err != nil || referenced {
		return err
	}
	model, err := s.modelRelativeRoot(record.ModelAssetID, record.ManifestSHA256)
	if err != nil {
		return err
	}
	return s.removeOwnedTree(model)
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
	for _, profile := range []string{"english", "chinese"} {
		snapshot, err := s.Snapshot(profile)
		if err != nil {
			return false, err
		}
		if snapshot.State == SnapshotActive && snapshot.Activation.Model.ModelAssetID == modelAssetID && snapshot.Activation.Model.ManifestSHA256 == manifestSHA {
			return true, nil
		}
	}
	return false, nil
}

func (s *Store) ReadModelAuthority(modelAssetID, manifestSHA string) ([]byte, []byte, error) {
	root, err := s.modelRelativeRoot(modelAssetID, manifestSHA)
	if err != nil {
		return nil, nil, err
	}
	manifest, err := s.readOwned(filepath.Join(root, "model-asset-manifest-v1.json"), 4*1024*1024)
	if err != nil {
		return nil, nil, err
	}
	notice, err := s.readOwned(filepath.Join(root, "THIRD_PARTY_NOTICES.json"), 4*1024*1024)
	if err != nil {
		return nil, nil, err
	}
	return manifest, notice, nil
}
