package modelmanager

import (
	"errors"
	"os"

	"github.com/AutoByteus/autobyteus-voice-runtime/modelstore"
)

func (s *Service) Status(profile, installRoot string) Terminal {
	if err := s.Events.Emit(Event{Phase: "checking"}); err != nil {
		return Terminal{Phase: "failed", FailureCategory: "internal"}
	}
	if _, err := VerifyHost(s.HostRoot, s.Expected); err != nil {
		return s.fail("host-authority-invalid")
	}
	store, err := modelstore.OpenReadOnly(installRoot)
	if os.IsNotExist(err) {
		return s.success("status-result", Event{Phase: "status-result", ProfileState: "not-installed"})
	}
	if err != nil {
		return s.fail("store-corrupt")
	}
	defer store.Close()
	snapshot, err := store.Snapshot(profile)
	if errors.Is(err, modelstore.ErrStateChanging) {
		return s.fail("state-changing")
	}
	if err != nil {
		return s.fail("store-corrupt")
	}
	return s.success("status-result", Event{Phase: "status-result", ProfileState: string(snapshot.State)})
}

func (s *Service) Remove(profile, installRoot string) Terminal {
	if err := s.Events.Emit(Event{Phase: "checking"}); err != nil {
		return Terminal{Phase: "failed", FailureCategory: "internal"}
	}
	if _, err := VerifyHost(s.HostRoot, s.Expected); err != nil {
		return s.fail("host-authority-invalid")
	}
	store, err := modelstore.OpenReadOnly(installRoot)
	if os.IsNotExist(err) {
		return s.success("not-installed", Event{Phase: "not-installed"})
	}
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
	snapshot, err := store.Snapshot(profile)
	if errors.Is(err, modelstore.ErrStateChanging) {
		return s.fail("state-changing")
	}
	if err != nil {
		return s.fail("store-corrupt")
	}
	if snapshot.State == modelstore.SnapshotNotInstalled {
		return s.success("not-installed", Event{Phase: "not-installed"})
	}
	lease, err := store.AcquireInstallationExclusive(snapshot.Pointer.InstallationID)
	if errors.Is(err, modelstore.ErrLeaseBusy) {
		return s.fail("profile-in-use")
	}
	if err != nil {
		return s.fail("store-corrupt")
	}
	defer lease.Close()
	if err := s.Events.Emit(Event{Phase: "deactivating"}); err != nil {
		return Terminal{Phase: "failed", FailureCategory: "internal"}
	}
	if !s.Lifecycle.BeginCommit() {
		if cancelled, signal := s.Lifecycle.Cancelled(); cancelled {
			return s.cancel(signal)
		}
		return s.fail("internal")
	}
	if err := store.RemovePointer(profile, snapshot.Pointer.InstallationID); err != nil {
		return s.fail("activation-failed")
	}
	s.Lifecycle.MarkCommitted()
	cleanupPending := s.Events.Emit(Event{Phase: "pruning"}) != nil
	if err := store.CleanupSubject(snapshot.Activation.InstallationID, snapshot.Activation.Model.ModelAssetID, snapshot.Activation.Model.ManifestSHA256); err != nil {
		cleanupPending = true
	}
	return s.success("removed", Event{Phase: "removed", CleanupPending: &cleanupPending})
}
