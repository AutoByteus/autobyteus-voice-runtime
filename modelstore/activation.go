package modelstore

import (
	"bytes"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	"github.com/AutoByteus/autobyteus-voice-runtime/integrity"
	"github.com/AutoByteus/autobyteus-voice-runtime/internal/contractjson"
)

type SnapshotState string

const (
	SnapshotActive       SnapshotState = "active"
	SnapshotNotInstalled SnapshotState = "not-installed"
)

var (
	ErrStateChanging = errors.New("activation state changing")
	ErrStoreCorrupt  = errors.New("activation store corrupt")
)

type Snapshot struct {
	State           SnapshotState
	Pointer         installcontract.ActivePointer
	Activation      installcontract.ActivationRecord
	PointerBytes    []byte
	ActivationBytes []byte
}

func (s *Store) WriteActivation(record installcontract.ActivationRecord) ([]byte, string, error) {
	if validateActivationRecord(record) != nil {
		return nil, "", errors.New("invalid activation record")
	}
	relative, err := s.activationRelativePath(record.InstallationID)
	if err != nil {
		return nil, "", err
	}
	data, err := contractjson.Canonical(record)
	if err != nil {
		return nil, "", err
	}
	if existing, err := s.readOwned(relative, 4*1024*1024); err == nil {
		if !bytes.Equal(existing, data) {
			return nil, "", errors.New("immutable activation conflict")
		}
		return data, contractjson.Digest(data), nil
	}
	directory, err := s.openOwnedDirectory(filepath.Dir(relative), true)
	if err != nil {
		return nil, "", err
	}
	_ = directory.Close()
	temp := relative + ".tmp"
	if err := s.writeOwnedExclusive(temp, data, 0400); err != nil {
		return nil, "", err
	}
	if err := s.renameOwned(temp, relative); err != nil {
		return nil, "", err
	}
	if err := s.syncOwnedDirectory(filepath.Dir(relative)); err != nil {
		return nil, "", err
	}
	return data, contractjson.Digest(data), nil
}

type PreparedPointer struct {
	directory *os.Root
	temporary string
	final     string
}

// PreparePointer writes and fsyncs the complete selector while the operation
// is still cancellable. Commit performs only the linearizing rename and
// directory sync after the service's atomic cancellation cutoff.
func (s *Store) PreparePointer(pointer installcontract.ActivePointer) (*PreparedPointer, error) {
	if pointer.SchemaVersion != 1 || validateUUID(pointer.InstallationID) != nil || validateUUID(pointer.SelectorGeneration) != nil || !digestPattern.MatchString(pointer.ActivationSHA256) || pointer.ActivationRelativePath != fmt.Sprintf("activations/%s/profile-activation-v1.json", pointer.InstallationID) {
		return nil, errors.New("invalid active pointer")
	}
	relative, err := s.pointerRelativePath(pointer.ProfileID)
	if err != nil {
		return nil, err
	}
	directory, err := s.openOwnedDirectory(filepath.Dir(relative), true)
	if err != nil {
		return nil, err
	}
	data, err := contractjson.Canonical(pointer)
	if err != nil {
		_ = directory.Close()
		return nil, err
	}
	final := filepath.Base(relative)
	temp := final + ".tmp-" + pointer.SelectorGeneration
	if err := writeDurableAt(directory, temp, data, 0600); err != nil {
		_ = directory.Close()
		return nil, err
	}
	return &PreparedPointer{directory: directory, temporary: temp, final: final}, nil
}

func (p *PreparedPointer) Abort() {
	if p != nil {
		if p.directory != nil && p.temporary != "" {
			_ = p.directory.Remove(p.temporary)
		}
		if p.directory != nil {
			_ = p.directory.Close()
			p.directory = nil
		}
	}
}

func (p *PreparedPointer) Commit() error {
	if p == nil || p.directory == nil || p.temporary == "" || p.final == "" {
		return errors.New("pointer was not prepared")
	}
	if err := p.directory.Rename(p.temporary, p.final); err != nil {
		return err
	}
	p.temporary = ""
	// Rename is the committed-state linearization point. Directory fsync is
	// durability hardening and cannot truthfully turn the new active pointer
	// into a reported precommit failure after the rename succeeded.
	_ = syncOwnedDirectory(p.directory)
	_ = p.directory.Close()
	p.directory = nil
	return nil
}

func (s *Store) RemovePointer(profile, installationID string) error {
	relative, err := s.pointerRelativePath(profile)
	if err != nil {
		return err
	}
	data, err := s.readOwned(relative, 4*1024*1024)
	if err != nil {
		return err
	}
	var pointer installcontract.ActivePointer
	if contractjson.Decode(data, &pointer) != nil || pointer.InstallationID != installationID {
		return ErrStoreCorrupt
	}
	if err := s.removeOwned(relative, false); err != nil {
		return err
	}
	// Unlink is the removal linearization point; later durability hardening
	// cannot change the already-committed logical result.
	_ = s.syncOwnedDirectory(filepath.Dir(relative))
	return nil
}

func (s *Store) Snapshot(profile string) (Snapshot, error) {
	pointerRelative, err := s.pointerRelativePath(profile)
	if err != nil {
		return Snapshot{}, err
	}
	for attempt := 0; attempt < 3; attempt++ {
		first, err := s.readOwned(pointerRelative, 4*1024*1024)
		if os.IsNotExist(err) {
			// Absence is a complete snapshot at this first open. An install that
			// follows linearizes after this not-installed observation.
			return Snapshot{State: SnapshotNotInstalled}, nil
		}
		if err != nil {
			return Snapshot{}, ErrStoreCorrupt
		}
		var pointer installcontract.ActivePointer
		pointerErr := contractjson.Decode(first, &pointer)
		if pointerErr == nil {
			pointerErr = validatePointer(pointer, profile)
		}
		var activation installcontract.ActivationRecord
		var activationBytes []byte
		activationErr := pointerErr
		if pointerErr == nil {
			activationPath, pathErr := s.activationPath(pointer.InstallationID)
			if pathErr != nil || filepath.ToSlash(stringsRelative(s.Root, activationPath)) != pointer.ActivationRelativePath {
				activationErr = ErrStoreCorrupt
			} else {
				activationRelative, _ := s.activationRelativePath(pointer.InstallationID)
				activationBytes, activationErr = s.readOwned(activationRelative, 4*1024*1024)
				if activationErr == nil {
					activationErr = contractjson.Decode(activationBytes, &activation)
					if activationErr == nil {
						activationErr = validateActivation(activation, pointer, profile)
					}
					if activationErr == nil && contractjson.Digest(activationBytes) != pointer.ActivationSHA256 {
						activationErr = ErrStoreCorrupt
					}
				}
			}
		}
		second, secondErr := s.readOwned(pointerRelative, 4*1024*1024)
		if secondErr != nil || !bytes.Equal(first, second) {
			continue
		}
		if activationErr != nil {
			return Snapshot{}, ErrStoreCorrupt
		}
		return Snapshot{State: SnapshotActive, Pointer: pointer, Activation: activation, PointerBytes: first, ActivationBytes: activationBytes}, nil
	}
	return Snapshot{}, ErrStateChanging
}

func stringsRelative(root, path string) string {
	relative, err := filepath.Rel(root, path)
	if err != nil {
		return ""
	}
	return relative
}
func validatePointer(pointer installcontract.ActivePointer, profile string) error {
	if pointer.SchemaVersion != 1 || pointer.ProfileID != profile || pointer.Target.Platform != "darwin" || pointer.Target.Architecture != "arm64" || validateUUID(pointer.InstallationID) != nil || validateUUID(pointer.SelectorGeneration) != nil || !digestPattern.MatchString(pointer.ActivationSHA256) || !digestPattern.MatchString(pointer.CompatibilityPairSHA256) || pointer.ActivationRelativePath != fmt.Sprintf("activations/%s/profile-activation-v1.json", pointer.InstallationID) {
		return ErrStoreCorrupt
	}
	return nil
}

func validateActivation(activation installcontract.ActivationRecord, pointer installcontract.ActivePointer, profile string) error {
	if validateActivationRecord(activation) != nil || activation.InstallationID != pointer.InstallationID || activation.ProfileID != profile || activation.CompatibilityPairSHA256 != pointer.CompatibilityPairSHA256 {
		return ErrStoreCorrupt
	}
	return nil
}

func validateActivationRecord(record installcontract.ActivationRecord) error {
	validLanguage := (record.ProfileID == "english" && record.LanguageMode == "en") || (record.ProfileID == "chinese" && record.LanguageMode == "zh")
	if record.SchemaVersion != 1 || validateUUID(record.InstallationID) != nil || !validLanguage || record.Target.Platform != "darwin" || record.Target.Architecture != "arm64" || validateID(record.Catalog.FileName) != nil || !digestPattern.MatchString(record.Catalog.SHA256) || validateID(record.Host.HostPackageID) != nil || validateID(record.Host.ProviderID) != nil || validateID(record.Model.ModelAssetID) != nil || validateID(record.Model.ModelID) != nil || !revisionPattern.MatchString(record.Model.Revision) || validateID(record.Model.LayoutID) != nil || !digestPattern.MatchString(record.Host.DescriptorSHA256) || !digestPattern.MatchString(record.Host.FileManifestSHA256) || !digestPattern.MatchString(record.Host.HostSourceClosureSHA256) || !digestPattern.MatchString(record.Host.ModelAdmissionRootSHA256) || !digestPattern.MatchString(record.Host.CompatibilityRequirementSHA256) || !digestPattern.MatchString(record.Model.ManifestSHA256) || !digestPattern.MatchString(record.Model.TreeSHA256) || !digestPattern.MatchString(record.CompatibilityPairSHA256) || !digestPattern.MatchString(record.CapabilityDigest) || record.Decision != "active" || len(record.Model.Files) == 0 {
		return ErrStoreCorrupt
	}
	if _, err := time.Parse(time.RFC3339Nano, record.CreatedAt); err != nil {
		return ErrStoreCorrupt
	}
	previous := ""
	for _, file := range record.Model.Files {
		if !integrity.ValidRelativePath(file.Path) || file.Path <= previous || !rolePattern.MatchString(file.Role) || file.SizeBytes <= 0 || !digestPattern.MatchString(file.SHA256) || file.Mode != "read-only" {
			return ErrStoreCorrupt
		}
		previous = file.Path
	}
	if integrity.TreeDigest(record.Model.Files) != record.Model.TreeSHA256 {
		return ErrStoreCorrupt
	}
	return nil
}
func writeDurableAt(directory *os.Root, name string, data []byte, mode os.FileMode) error {
	file, err := directory.OpenFile(name, os.O_CREATE|os.O_EXCL|os.O_WRONLY, mode)
	if err != nil {
		return err
	}
	if info, statErr := file.Stat(); statErr != nil || !safeRegularInfo(info) {
		_ = file.Close()
		return ErrStoreCorrupt
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
