package modelmanager

import (
	"crypto/rand"
	"fmt"
	"syscall"
	"time"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
)

const freeSpaceReserve int64 = 67_108_864

type Service struct {
	HostRoot   string
	Expected   EmbeddedAuthority
	Events     *EventWriter
	Lifecycle  *OperationLifecycle
	Downloader func(modelcontract.DownloadPolicy) *DownloadSession
	Now        func() time.Time
	UUID       func() (string, error)
}

func NewService(hostRoot string, expected EmbeddedAuthority, events *EventWriter, lifecycle *OperationLifecycle) *Service {
	return &Service{HostRoot: hostRoot, Expected: expected, Events: events, Lifecycle: lifecycle, Downloader: NewDownloadSession, Now: time.Now, UUID: randomUUID}
}

func (s *Service) fail(category string) Terminal {
	_ = s.Events.Emit(Event{Phase: "failed", FailureCategory: category})
	return Terminal{Phase: "failed", FailureCategory: category}
}
func (s *Service) cancel(signal int) Terminal {
	_ = s.Events.Emit(Event{Phase: "cancelled", FailureCategory: "cancelled"})
	return Terminal{Phase: "cancelled", FailureCategory: "cancelled", Signal: signal}
}
func (s *Service) success(phase string, event Event) Terminal {
	_ = s.Events.Emit(event)
	return Terminal{Phase: phase, CleanupPending: event.CleanupPending != nil && *event.CleanupPending}
}

func category(err error, fallback string) string {
	for _, allowed := range []string{"catalog-invalid", "catalog-unadmitted", "host-incompatible", "network-unavailable", "http-status", "redirect-policy", "timeout", "size-mismatch", "digest-mismatch"} {
		if err != nil && err.Error() == allowed {
			return allowed
		}
	}
	return fallback
}

func activationRecord(id string, authority HostAuthority, resolved ResolvedProfile, now time.Time) installcontract.ActivationRecord {
	files := modelFiles(resolved.Manifest)
	return installcontract.ActivationRecord{SchemaVersion: 1, InstallationID: id, ProfileID: resolved.Entry.ProfileID, LanguageMode: resolved.Entry.LanguageMode, Target: modelcontract.Target{Platform: "darwin", Architecture: "arm64"}, Catalog: installcontract.CatalogIdentity{FileName: resolved.CatalogFileName, SHA256: resolved.CatalogSHA256}, Host: installcontract.HostIdentity{HostPackageID: authority.Descriptor.HostPackageID, ProviderID: authority.Descriptor.ProviderID, DescriptorSHA256: authority.DescriptorSHA256, FileManifestSHA256: authority.FileManifestSHA256, HostSourceClosureSHA256: authority.Descriptor.HostSourceClosure.SHA256, ModelAdmissionRootSHA256: authority.AdmissionSHA256, CompatibilityRequirementSHA256: authority.CompatibilitySHA256}, Model: installcontract.ActivatedModel{ModelAssetID: resolved.Manifest.ModelAssetID, ModelID: resolved.Manifest.ModelID, ManifestSHA256: resolved.ManifestSHA256, Revision: resolved.Manifest.Revision, LayoutID: resolved.Manifest.LayoutID, TreeSHA256: resolved.Manifest.ModelTreeSHA256, Files: files}, CompatibilityPairSHA256: resolved.CompatibilityPairSHA256, CapabilityDigest: resolved.Entry.CapabilityDigest, Decision: "active", CreatedAt: now.Format(time.RFC3339Nano)}
}
func modelFiles(manifest modelcontract.AssetManifest) []modelcontract.FileIdentity {
	files := make([]modelcontract.FileIdentity, len(manifest.Files))
	for index, file := range manifest.Files {
		files[index] = modelcontract.FileIdentity{Path: file.Path, Role: file.Role, SizeBytes: file.SizeBytes, SHA256: file.SHA256, Mode: file.Mode}
	}
	return files
}
func activationMatches(record installcontract.ActivationRecord, authority HostAuthority, resolved ResolvedProfile) bool {
	return record.Decision == "active" && record.ProfileID == resolved.Entry.ProfileID && record.Host.HostPackageID == authority.Descriptor.HostPackageID && record.Host.DescriptorSHA256 == authority.DescriptorSHA256 && record.Host.FileManifestSHA256 == authority.FileManifestSHA256 && record.Host.HostSourceClosureSHA256 == authority.Descriptor.HostSourceClosure.SHA256 && record.Host.ModelAdmissionRootSHA256 == authority.AdmissionSHA256 && record.Model.ModelAssetID == resolved.Manifest.ModelAssetID && record.Model.ManifestSHA256 == resolved.ManifestSHA256 && record.Model.TreeSHA256 == resolved.Manifest.ModelTreeSHA256 && record.CompatibilityPairSHA256 == resolved.CompatibilityPairSHA256
}
func spaceAvailable(path string, required int64) bool {
	var stat syscall.Statfs_t
	if syscall.Statfs(path, &stat) != nil {
		return false
	}
	return int64(stat.Bavail)*int64(stat.Bsize) >= required
}
func randomUUID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", bytes[0:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:16]), nil
}
