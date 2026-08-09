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
	writer, err := store.AcquireWriter()
	if err != nil {
		if errors.Is(err, modelstore.ErrLeaseBusy) {
			return s.fail("writer-in-progress")
		}
		return s.fail("store-corrupt")
	}
	defer writer.Close()
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
	metadataBytes := int64(len(resolved.ManifestBytes) + len(resolved.NoticeBytes) + 16*1024)
	if !spaceAvailable(store.Root, resolved.Manifest.TotalSizeBytes+metadataBytes+freeSpaceReserve) {
		return s.fail("insufficient-space")
	}
	partials := make(map[string]string, len(resolved.Manifest.Files))
	download := s.Downloader(resolved.Manifest.DownloadPolicy)
	installContext := s.Lifecycle.Context(ctx)
	for index, file := range resolved.Manifest.Files {
		if cancelled, signal := s.Lifecycle.Cancelled(); cancelled {
			return s.cancel(signal)
		}
		partial, record, pathErr := store.PartialPaths(resolved.ManifestSHA256, file.Path)
		if pathErr != nil {
			return s.fail("store-corrupt")
		}
		partials[file.Path] = partial
		fileIndex, fileCount := index+1, len(resolved.Manifest.Files)
		err = download.Fetch(installContext, file, resolved.CatalogSHA256, resolved.ManifestSHA256, resolved.Manifest.ModelAssetID, resolved.Manifest.Revision, partial, record, func(completed, total int64) error {
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

func (s *Service) commitInstall(store *modelstore.Store, authority HostAuthority, resolved ResolvedProfile, profile string, partials map[string]string, metadataBytes int64) Terminal {
	files := modelFiles(resolved.Manifest)
	if _, err := store.CommitModel(resolved.Manifest.ModelAssetID, resolved.ManifestSHA256, files, partials, resolved.ManifestBytes, resolved.NoticeBytes); err != nil {
		return s.fail("store-corrupt")
	}
	if !spaceAvailable(store.Root, metadataBytes+freeSpaceReserve) || store.VerifyModel(resolved.Manifest.ModelAssetID, resolved.ManifestSHA256, files) != nil {
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
	return s.success("installed", Event{Phase: "installed", ModelAssetID: resolved.Manifest.ModelAssetID})
}
