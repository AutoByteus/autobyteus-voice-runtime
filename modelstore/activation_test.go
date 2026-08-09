package modelstore

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
)

const (
	installationID = "00000000-0000-4000-8000-000000000001"
	selectorID     = "00000000-0000-4000-8000-000000000002"
)

func TestActivationSnapshotAndRemovalLinearization(t *testing.T) {
	base, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	store, err := Open(filepath.Join(base, "store"))
	if err != nil {
		t.Fatal(err)
	}
	record := fixtureActivation()
	_, activationSHA, err := store.WriteActivation(record)
	if err != nil {
		t.Fatal(err)
	}
	pointer := installcontract.ActivePointer{SchemaVersion: 1, ProfileID: "english", Target: modelcontract.Target{Platform: "darwin", Architecture: "arm64"}, InstallationID: installationID, SelectorGeneration: selectorID, ActivationRelativePath: "activations/" + installationID + "/profile-activation-v1.json", ActivationSHA256: activationSHA, CompatibilityPairSHA256: record.CompatibilityPairSHA256, UpdatedAt: time.Now().UTC().Format(time.RFC3339Nano)}
	prepared, err := store.PreparePointer(pointer)
	if err != nil {
		t.Fatal(err)
	}
	before, err := store.Snapshot("english")
	if err != nil || before.State != SnapshotNotInstalled {
		t.Fatalf("precommit snapshot=%s err=%v", before.State, err)
	}
	if err := prepared.Commit(); err != nil {
		t.Fatal(err)
	}
	after, err := store.Snapshot("english")
	if err != nil || after.State != SnapshotActive || after.Pointer.SelectorGeneration != selectorID {
		t.Fatalf("postcommit snapshot=%s err=%v", after.State, err)
	}
	if err := store.RemovePointer("english", installationID); err != nil {
		t.Fatal(err)
	}
	removed, err := store.Snapshot("english")
	if err != nil || removed.State != SnapshotNotInstalled {
		t.Fatalf("removed snapshot=%s err=%v", removed.State, err)
	}
}

func TestActivationRejectsAliasesAndMutation(t *testing.T) {
	base, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	store, err := Open(filepath.Join(base, "store"))
	if err != nil {
		t.Fatal(err)
	}
	record := fixtureActivation()
	if _, _, err := store.WriteActivation(record); err != nil {
		t.Fatal(err)
	}
	path, _ := store.activationPath(installationID)
	alias := path + ".alias"
	if err := os.Link(path, alias); err != nil {
		t.Fatal(err)
	}
	if _, err := readNoFollow(path); err == nil {
		t.Fatal("hard-linked activation accepted")
	}
	_ = os.Remove(alias)
	record.Model.Revision = "not-a-revision"
	if _, _, err := store.WriteActivation(record); err == nil {
		t.Fatal("invalid activation accepted")
	}
}

func fixtureActivation() installcontract.ActivationRecord {
	digest := "a"
	for len(digest) < 64 {
		digest += "a"
	}
	files := []modelcontract.FileIdentity{{Path: "weights.bin", Role: "weights", SizeBytes: 1, SHA256: digest, Mode: "read-only"}}
	tree := "0d4915c9779be507d105e3b15bf9ba77ea9cac4070d1e39530c29f3f5b197cb8"
	return installcontract.ActivationRecord{SchemaVersion: 1, InstallationID: installationID, ProfileID: "english", LanguageMode: "en", Target: modelcontract.Target{Platform: "darwin", Architecture: "arm64"}, Catalog: installcontract.CatalogIdentity{FileName: "catalog.json", SHA256: digest}, Host: installcontract.HostIdentity{HostPackageID: "host", ProviderID: "provider", DescriptorSHA256: digest, FileManifestSHA256: digest, HostSourceClosureSHA256: digest, ModelAdmissionRootSHA256: digest, CompatibilityRequirementSHA256: digest}, Model: installcontract.ActivatedModel{ModelAssetID: "asset", ModelID: "model", ManifestSHA256: digest, Revision: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", LayoutID: "layout", TreeSHA256: tree, Files: files}, CompatibilityPairSHA256: digest, CapabilityDigest: digest, Decision: "active", CreatedAt: time.Now().UTC().Format(time.RFC3339Nano)}
}
