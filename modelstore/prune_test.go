package modelstore

import (
	"os"
	"path/filepath"
	"testing"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
)

func TestPruneOrphansCoversPrecommitReplacementReferencesAndLeases(t *testing.T) {
	t.Run("crash or cancellation before pointer commit", func(t *testing.T) {
		store := openStoreFixture(t)
		defer store.Close()
		defer acquireWriterFixture(t, store).Close()
		record := activationFixtureFor(installationID, "asset-orphan", digestFixture("b"))
		writeActivationAndModel(t, store, record)
		pending, err := store.PruneOrphans(64)
		if err != nil || pending {
			t.Fatalf("pending=%v err=%v", pending, err)
		}
		assertOwnedDirectoryMissing(t, store, filepath.Join("activations", record.InstallationID))
		assertOwnedDirectoryMissing(t, store, filepath.Join("models", record.Model.ModelAssetID, record.Model.ManifestSHA256))
	})

	t.Run("replacement preserves current and removes previous", func(t *testing.T) {
		store := openStoreFixture(t)
		defer store.Close()
		defer acquireWriterFixture(t, store).Close()
		oldRecord := activationFixtureFor(installationID, "asset-old", digestFixture("b"))
		newRecord := activationFixtureFor("00000000-0000-4000-8000-000000000003", "asset-new", digestFixture("c"))
		oldSHA := writeActivationAndModel(t, store, oldRecord)
		commitPointerFixture(t, store, oldRecord, oldSHA, selectorID)
		newSHA := writeActivationAndModel(t, store, newRecord)
		commitPointerFixture(t, store, newRecord, newSHA, "00000000-0000-4000-8000-000000000004")
		pending, err := store.PruneOrphans(64)
		if err != nil || pending {
			t.Fatalf("pending=%v err=%v", pending, err)
		}
		assertOwnedDirectoryMissing(t, store, filepath.Join("activations", oldRecord.InstallationID))
		assertOwnedDirectoryMissing(t, store, filepath.Join("models", oldRecord.Model.ModelAssetID, oldRecord.Model.ManifestSHA256))
		assertOwnedDirectoryPresent(t, store, filepath.Join("activations", newRecord.InstallationID))
		assertOwnedDirectoryPresent(t, store, filepath.Join("models", newRecord.Model.ModelAssetID, newRecord.Model.ManifestSHA256))
	})

	t.Run("provider lease retains orphan until later writer", func(t *testing.T) {
		store := openStoreFixture(t)
		defer store.Close()
		defer acquireWriterFixture(t, store).Close()
		record := activationFixtureFor("00000000-0000-4000-8000-000000000005", "asset-leased", digestFixture("d"))
		writeActivationAndModel(t, store, record)
		lease, err := store.AcquireInstallationShared(record.InstallationID)
		if err != nil {
			t.Fatal(err)
		}
		pending, err := store.PruneOrphans(64)
		if err != nil || !pending {
			t.Fatalf("leased pending=%v err=%v", pending, err)
		}
		assertOwnedDirectoryPresent(t, store, filepath.Join("activations", record.InstallationID))
		assertOwnedDirectoryPresent(t, store, filepath.Join("models", record.Model.ModelAssetID, record.Model.ManifestSHA256))
		if err := lease.Close(); err != nil {
			t.Fatal(err)
		}
		pending, err = store.PruneOrphans(64)
		if err != nil || pending {
			t.Fatalf("released pending=%v err=%v", pending, err)
		}
		assertOwnedDirectoryMissing(t, store, filepath.Join("activations", record.InstallationID))
		assertOwnedDirectoryMissing(t, store, filepath.Join("models", record.Model.ModelAssetID, record.Model.ManifestSHA256))
	})
}

func openStoreFixture(t *testing.T) *Store {
	t.Helper()
	base, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	store, err := Open(filepath.Join(base, "store"))
	if err != nil {
		t.Fatal(err)
	}
	return store
}

func acquireWriterFixture(t *testing.T, store *Store) *Lease {
	t.Helper()
	lease, err := store.AcquireWriter()
	if err != nil {
		t.Fatal(err)
	}
	return lease
}

func activationFixtureFor(id, assetID, manifestSHA string) installcontract.ActivationRecord {
	record := fixtureActivation()
	record.InstallationID = id
	record.Model.ModelAssetID = assetID
	record.Model.ManifestSHA256 = manifestSHA
	return record
}

func writeActivationAndModel(t *testing.T, store *Store, record installcontract.ActivationRecord) string {
	t.Helper()
	model, err := store.modelRelativeRoot(record.Model.ModelAssetID, record.Model.ManifestSHA256)
	if err != nil {
		t.Fatal(err)
	}
	directory, err := store.openOwnedDirectory(filepath.Join(model, "files"), true)
	if err != nil {
		t.Fatal(err)
	}
	_ = directory.Close()
	_, activationSHA, err := store.WriteActivation(record)
	if err != nil {
		t.Fatal(err)
	}
	return activationSHA
}

func commitPointerFixture(t *testing.T, store *Store, record installcontract.ActivationRecord, activationSHA, selector string) {
	t.Helper()
	pointer := pointerFixture(record.InstallationID, selector)
	pointer.ActivationSHA256 = activationSHA
	pointer.CompatibilityPairSHA256 = record.CompatibilityPairSHA256
	prepared, err := store.PreparePointer(pointer)
	if err != nil {
		t.Fatal(err)
	}
	if err := prepared.Commit(); err != nil {
		t.Fatal(err)
	}
}

func assertOwnedDirectoryPresent(t *testing.T, store *Store, relative string) {
	t.Helper()
	directory, err := store.openOwnedDirectory(relative, false)
	if err != nil {
		t.Fatalf("expected %s present: %v", relative, err)
	}
	_ = directory.Close()
}

func assertOwnedDirectoryMissing(t *testing.T, store *Store, relative string) {
	t.Helper()
	directory, err := store.openOwnedDirectory(relative, false)
	if err == nil {
		_ = directory.Close()
		t.Fatalf("expected %s missing", relative)
	}
	if !os.IsNotExist(err) {
		t.Fatalf("unexpected missing error for %s: %v", relative, err)
	}
}
