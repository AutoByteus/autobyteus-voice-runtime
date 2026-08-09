package modelstore

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"syscall"
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
	path, err := s.activationPath(record.InstallationID)
	if err != nil {
		return nil, "", err
	}
	data, err := contractjson.Canonical(record)
	if err != nil {
		return nil, "", err
	}
	if existing, err := readNoFollow(path); err == nil {
		if !bytes.Equal(existing, data) {
			return nil, "", errors.New("immutable activation conflict")
		}
		return data, contractjson.Digest(data), nil
	}
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return nil, "", err
	}
	temp := path + ".tmp"
	if err := writeDurable(temp, data, 0400); err != nil {
		return nil, "", err
	}
	if err := os.Rename(temp, path); err != nil {
		return nil, "", err
	}
	if err := syncDirectory(filepath.Dir(path)); err != nil {
		return nil, "", err
	}
	return data, contractjson.Digest(data), nil
}

type PreparedPointer struct {
	temporary string
	final     string
	directory string
}

// PreparePointer writes and fsyncs the complete selector while the operation
// is still cancellable. Commit performs only the linearizing rename and
// directory sync after the service's atomic cancellation cutoff.
func (s *Store) PreparePointer(pointer installcontract.ActivePointer) (*PreparedPointer, error) {
	if pointer.SchemaVersion != 1 || validateUUID(pointer.InstallationID) != nil || validateUUID(pointer.SelectorGeneration) != nil || !digestPattern.MatchString(pointer.ActivationSHA256) || pointer.ActivationRelativePath != fmt.Sprintf("activations/%s/profile-activation-v1.json", pointer.InstallationID) {
		return nil, errors.New("invalid active pointer")
	}
	path, err := s.pointerPath(pointer.ProfileID)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return nil, err
	}
	data, err := contractjson.Canonical(pointer)
	if err != nil {
		return nil, err
	}
	temp := path + ".tmp-" + pointer.SelectorGeneration
	if err := writeDurable(temp, data, 0600); err != nil {
		return nil, err
	}
	return &PreparedPointer{temporary: temp, final: path, directory: filepath.Dir(path)}, nil
}

func (p *PreparedPointer) Abort() {
	if p != nil {
		_ = os.Remove(p.temporary)
	}
}

func (p *PreparedPointer) Commit() error {
	if p == nil || p.temporary == "" || p.final == "" {
		return errors.New("pointer was not prepared")
	}
	if err := os.Rename(p.temporary, p.final); err != nil {
		return err
	}
	p.temporary = ""
	// Rename is the committed-state linearization point. Directory fsync is
	// durability hardening and cannot truthfully turn the new active pointer
	// into a reported precommit failure after the rename succeeded.
	_ = syncDirectory(p.directory)
	return nil
}

func (s *Store) RemovePointer(profile, installationID string) error {
	path, err := s.pointerPath(profile)
	if err != nil {
		return err
	}
	data, err := readNoFollow(path)
	if err != nil {
		return err
	}
	var pointer installcontract.ActivePointer
	if contractjson.Decode(data, &pointer) != nil || pointer.InstallationID != installationID {
		return ErrStoreCorrupt
	}
	if err := os.Remove(path); err != nil {
		return err
	}
	// Unlink is the removal linearization point; later durability hardening
	// cannot change the already-committed logical result.
	_ = syncDirectory(filepath.Dir(path))
	return nil
}

func (s *Store) Snapshot(profile string) (Snapshot, error) {
	pointerPath, err := s.pointerPath(profile)
	if err != nil {
		return Snapshot{}, err
	}
	for attempt := 0; attempt < 3; attempt++ {
		first, err := readNoFollow(pointerPath)
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
				activationBytes, activationErr = readNoFollow(activationPath)
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
		second, secondErr := readNoFollow(pointerPath)
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
func readNoFollow(path string) ([]byte, error) {
	fd, err := syscall.Open(path, syscall.O_RDONLY|syscall.O_NOFOLLOW, 0)
	if err != nil {
		return nil, err
	}
	file := os.NewFile(uintptr(fd), path)
	if file == nil {
		syscall.Close(fd)
		return nil, errors.New("open file descriptor failed")
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() > 4*1024*1024 {
		return nil, ErrStoreCorrupt
	}
	if stat, ok := info.Sys().(*syscall.Stat_t); ok && stat.Nlink != 1 {
		return nil, ErrStoreCorrupt
	}
	return io.ReadAll(io.LimitReader(file, 4*1024*1024))
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
func writeDurable(path string, data []byte, mode os.FileMode) error {
	file, err := os.OpenFile(path, os.O_CREATE|os.O_EXCL|os.O_WRONLY|syscall.O_NOFOLLOW, mode)
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
