package modelstore

import (
	"errors"
	"os"
	"path/filepath"
	"sort"
	"strings"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	"github.com/AutoByteus/autobyteus-voice-runtime/internal/contractjson"
)

const defaultPruneLimit = 64

// PruneOrphans runs only while the caller holds the singular store-writer
// lease. It removes bounded, unreferenced activation/model subjects only after
// proving the installation lease is exclusive. A busy lease retains both the
// activation and its model reference for a later writer.
func (s *Store) PruneOrphans(limit int) (bool, error) {
	if limit <= 0 {
		limit = defaultPruneLimit
	}
	activeInstallations, err := s.activeInstallations()
	if err != nil {
		return false, err
	}
	activationIDs, err := s.ownedDirectoryNames("activations")
	if err != nil {
		return false, err
	}
	removed := 0
	pending := false
	for _, installationID := range activationIDs {
		if validateUUID(installationID) != nil {
			return false, ErrStoreCorrupt
		}
		if activeInstallations[installationID] {
			continue
		}
		if removed >= limit {
			pending = true
			continue
		}
		lease, err := s.AcquireInstallationExclusive(installationID)
		if errors.Is(err, ErrLeaseBusy) {
			pending = true
			continue
		}
		if err != nil {
			return false, err
		}
		removeErr := s.removeOwnedTree(filepath.Join("activations", installationID))
		_ = lease.Close()
		if removeErr != nil {
			return false, removeErr
		}
		leasePath := filepath.Join("leases", installationID+".lock")
		if err := s.removeOwned(leasePath, false); err != nil && !os.IsNotExist(err) {
			return false, err
		}
		removed++
	}
	referenced, err := s.activationModelReferences()
	if err != nil {
		return false, err
	}
	assetIDs, err := s.ownedDirectoryNames("models")
	if err != nil {
		return false, err
	}
	for _, assetID := range assetIDs {
		if validateID(assetID) != nil {
			return false, ErrStoreCorrupt
		}
		versions, err := s.ownedDirectoryNames(filepath.Join("models", assetID))
		if err != nil {
			return false, err
		}
		for _, version := range versions {
			manifestSHA := version
			staging := strings.HasSuffix(version, ".staging")
			if staging {
				manifestSHA = strings.TrimSuffix(version, ".staging")
			}
			if !digestPattern.MatchString(manifestSHA) {
				return false, ErrStoreCorrupt
			}
			if !staging && referenced[assetID+"\x00"+manifestSHA] {
				continue
			}
			if removed >= limit {
				pending = true
				continue
			}
			if err := s.removeOwnedTree(filepath.Join("models", assetID, version)); err != nil {
				return false, err
			}
			removed++
		}
		remaining, err := s.ownedDirectoryNames(filepath.Join("models", assetID))
		if err != nil {
			return false, err
		}
		if len(remaining) == 0 {
			if err := s.removeOwned(filepath.Join("models", assetID), true); err != nil && !os.IsNotExist(err) {
				return false, err
			}
		}
	}
	return pending, nil
}

func (s *Store) activeInstallations() (map[string]bool, error) {
	active := map[string]bool{}
	for _, profile := range []string{"english", "chinese"} {
		snapshot, err := s.Snapshot(profile)
		if err != nil {
			return nil, err
		}
		if snapshot.State == SnapshotActive {
			active[snapshot.Pointer.InstallationID] = true
		}
	}
	return active, nil
}

func (s *Store) activationModelReferences() (map[string]bool, error) {
	references := map[string]bool{}
	installationIDs, err := s.ownedDirectoryNames("activations")
	if err != nil {
		return nil, err
	}
	for _, installationID := range installationIDs {
		relative, err := s.activationRelativePath(installationID)
		if err != nil {
			return nil, ErrStoreCorrupt
		}
		data, err := s.readOwned(relative, 4*1024*1024)
		if err != nil {
			return nil, err
		}
		var activation installcontract.ActivationRecord
		if contractjson.Decode(data, &activation) != nil || validateActivationRecord(activation) != nil || activation.InstallationID != installationID {
			return nil, ErrStoreCorrupt
		}
		references[activation.Model.ModelAssetID+"\x00"+activation.Model.ManifestSHA256] = true
	}
	return references, nil
}

func (s *Store) ownedDirectoryNames(relative string) ([]string, error) {
	directory, err := s.openOwnedDirectory(relative, false)
	if err != nil {
		return nil, err
	}
	defer directory.Close()
	file, err := directory.Open(".")
	if err != nil {
		return nil, err
	}
	entries, err := file.ReadDir(-1)
	_ = file.Close()
	if err != nil {
		return nil, err
	}
	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		info, err := directory.Lstat(entry.Name())
		if err != nil || !safeDirectoryInfo(info) {
			return nil, ErrStoreCorrupt
		}
		names = append(names, entry.Name())
	}
	sort.Strings(names)
	return names, nil
}
