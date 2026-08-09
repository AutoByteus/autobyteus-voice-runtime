package modelmanager

import (
	"context"
	"errors"
	"fmt"
	"time"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
	"github.com/AutoByteus/autobyteus-voice-runtime/modelstore"
)

func (s *Service) Install(ctx context.Context, catalogPath, profile, installRoot string) Terminal {
	if err := s.Events.Emit(Event{Phase: "checking"}); err != nil {
		return Terminal{Phase: "failed", FailureCategory: "internal"}
	}
	authority, err := VerifyHost(s.HostRoot, s.Expected)
	if err != nil {
		return s.fail("host-authority-invalid")
	}
	resolved, err := ResolveProfile(authority, catalogPath, profile)
	if err != nil {
		return s.fail(category(err, "catalog-invalid"))
	}
	store, err := modelstore.Open(installRoot)
	if err != nil {
		return s.fail("store-corrupt")
	}
	defer store.Close()
	writer, err := store.AcquireWriter()
	if err != nil {
		if errors.Is(err, modelstore.ErrLeaseBusy) {
			return s.fail("writer-in-progress")
		}
		return s.fail("store-corrupt")
	}
	defer writer.Close()
	if _, err := store.PruneOrphans(64); err != nil {
		return s.fail("store-corrupt")
	}
	if cancelled, signal := s.Lifecycle.Cancelled(); cancelled {
		return s.cancel(signal)
	}
	if snapshot, snapshotErr := store.Snapshot(profile); snapshotErr == nil && snapshot.State == modelstore.SnapshotActive {
		if activationMatches(snapshot.Activation, authority, resolved) && store.VerifyCommittedModel(resolved.Manifest.ModelAssetID, resolved.ManifestSHA256, modelFiles(resolved.Manifest), resolved.ManifestBytes, resolved.NoticeBytes) == nil {
			return s.success("already-installed", Event{Phase: "already-installed", ModelAssetID: resolved.Manifest.ModelAssetID})
		}
	} else if snapshotErr != nil && !errors.Is(snapshotErr, modelstore.ErrStateChanging) {
		return s.fail("store-corrupt")
	}
	download := s.Downloader(resolved.Manifest.DownloadPolicy)
	metadataBytes := int64(len(resolved.ManifestBytes) + len(resolved.NoticeBytes) + 16*1024)
	partials, remainingBytes, err := inventoryResumablePartials(store, download, resolved)
	if err != nil {
		return s.fail("store-corrupt")
	}
	if remainingBytes < 0 || !s.Space(store.Root, remainingBytes+metadataBytes+freeSpaceReserve) {
		return s.fail("insufficient-space")
	}
	installContext := s.Lifecycle.Context(ctx)
	for index, file := range resolved.Manifest.Files {
		if cancelled, signal := s.Lifecycle.Cancelled(); cancelled {
			return s.cancel(signal)
		}
		partial := partials[file.Path]
		fileIndex, fileCount := index+1, len(resolved.Manifest.Files)
		err = download.Fetch(installContext, file, resolved.CatalogSHA256, resolved.ManifestSHA256, resolved.Manifest.ModelAssetID, resolved.Manifest.Revision, partial, func(completed, total int64) error {
			if cancelled, _ := s.Lifecycle.Cancelled(); cancelled {
				return context.Canceled
			}
			return s.Events.Emit(Event{Phase: "downloading", ModelAssetID: resolved.Manifest.ModelAssetID, FileIndex: fileIndex, FileCount: fileCount, CompletedBytes: &completed, TotalBytes: &total})
		})
		if err != nil {
			if cancelled, signal := s.Lifecycle.Cancelled(); cancelled {
				return s.cancel(signal)
			}
			return s.fail(category(err, "network-unavailable"))
		}
		completed := file.SizeBytes
		if err := s.Events.Emit(Event{Phase: "verifying", ModelAssetID: resolved.Manifest.ModelAssetID, FileIndex: fileIndex, FileCount: fileCount, CompletedBytes: &completed, TotalBytes: &completed}); err != nil {
			return Terminal{Phase: "failed", FailureCategory: "internal"}
		}
	}
	return s.commitInstall(store, authority, resolved, profile, partials, metadataBytes)
}

func inventoryResumablePartials(store *modelstore.Store, download *DownloadSession, resolved ResolvedProfile) (map[string]*modelstore.Partial, int64, error) {
	partials := make(map[string]*modelstore.Partial, len(resolved.Manifest.Files))
	remainingBytes := resolved.Manifest.TotalSizeBytes
	for _, file := range resolved.Manifest.Files {
		partial, err := store.Partial(resolved.ManifestSHA256, file.Path)
		if err != nil {
			return nil, 0, err
		}
		partials[file.Path] = partial
		resumable, err := download.ResumableBytes(file, resolved.CatalogSHA256, resolved.ManifestSHA256, resolved.Manifest.ModelAssetID, resolved.Manifest.Revision, partial)
		if err != nil {
			return nil, 0, err
		}
		remainingBytes -= resumable
	}
	if remainingBytes < 0 {
		return nil, 0, modelstore.ErrStoreCorrupt
	}
	return partials, remainingBytes, nil
}

func (s *Service) commitInstall(store *modelstore.Store, authority HostAuthority, resolved ResolvedProfile, profile string, partials map[string]*modelstore.Partial, metadataBytes int64) Terminal {
	files := modelFiles(resolved.Manifest)
	if _, err := store.CommitModel(resolved.Manifest.ModelAssetID, resolved.ManifestSHA256, files, partials, resolved.ManifestBytes, resolved.NoticeBytes); err != nil {
		return s.fail("store-corrupt")
	}
	if !s.Space(store.Root, metadataBytes+freeSpaceReserve) || store.VerifyModel(resolved.Manifest.ModelAssetID, resolved.ManifestSHA256, files) != nil {
		return s.fail("digest-mismatch")
	}
	installationID, err := s.UUID()
	if err != nil {
		return s.fail("internal")
	}
	activation := activationRecord(installationID, authority, resolved, s.Now().UTC())
	_, activationSHA, err := store.WriteActivation(activation)
	if err != nil {
		return s.fail("activation-failed")
	}
	selector, err := s.UUID()
	if err != nil {
		return s.fail("internal")
	}
	pointer := installcontract.ActivePointer{SchemaVersion: 1, ProfileID: profile, Target: modelcontract.Target{Platform: "darwin", Architecture: "arm64"}, InstallationID: installationID, SelectorGeneration: selector, ActivationRelativePath: fmt.Sprintf("activations/%s/profile-activation-v1.json", installationID), ActivationSHA256: activationSHA, CompatibilityPairSHA256: resolved.CompatibilityPairSHA256, UpdatedAt: s.Now().UTC().Format(time.RFC3339Nano)}
	prepared, err := store.PreparePointer(pointer)
	if err != nil {
		return s.fail("activation-failed")
	}
	defer prepared.Abort()
	if err := s.Events.Emit(Event{Phase: "activating", ModelAssetID: resolved.Manifest.ModelAssetID}); err != nil {
		return Terminal{Phase: "failed", FailureCategory: "internal"}
	}
	if !s.Lifecycle.BeginCommit() {
		if cancelled, signal := s.Lifecycle.Cancelled(); cancelled {
			return s.cancel(signal)
		}
		return s.fail("internal")
	}
	if err := prepared.Commit(); err != nil {
		return s.fail("activation-failed")
	}
	s.Lifecycle.MarkCommitted()
	_, _ = store.PruneOrphans(64)
	return s.success("installed", Event{Phase: "installed", ModelAssetID: resolved.Manifest.ModelAssetID})
}
