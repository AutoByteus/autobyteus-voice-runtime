package modelstore

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
)

func TestOwnedDescendantsRejectSymlinksNonDirectoriesAndHardLinks(t *testing.T) {
	tests := map[string]func(*testing.T, *Store, string){
		"profile symlink": func(t *testing.T, store *Store, outside string) {
			t.Helper()
			mustSymlink(t, outside, filepath.Join(store.Root, "profiles", "english"))
			if prepared, err := store.PreparePointer(pointerFixture(installationID, selectorID)); err == nil {
				prepared.Abort()
				t.Fatal("profile ancestor symlink accepted")
			}
		},
		"profile non-directory": func(t *testing.T, store *Store, _ string) {
			t.Helper()
			if err := os.WriteFile(filepath.Join(store.Root, "profiles", "english"), []byte("not-a-directory"), 0600); err != nil {
				t.Fatal(err)
			}
			if prepared, err := store.PreparePointer(pointerFixture(installationID, selectorID)); err == nil {
				prepared.Abort()
				t.Fatal("non-directory profile ancestor accepted")
			}
		},
		"activation symlink": func(t *testing.T, store *Store, outside string) {
			t.Helper()
			mustSymlink(t, outside, filepath.Join(store.Root, "activations", installationID))
			if _, _, err := store.WriteActivation(fixtureActivation()); err == nil {
				t.Fatal("activation ancestor symlink accepted")
			}
		},
		"partial symlink": func(t *testing.T, store *Store, outside string) {
			t.Helper()
			mustSymlink(t, outside, filepath.Join(store.Root, "partials", digestFixture("a")))
			if _, err := store.Partial(digestFixture("a"), "weights.bin"); err == nil {
				t.Fatal("partial ancestor symlink accepted")
			}
		},
		"model symlink": func(t *testing.T, store *Store, outside string) {
			t.Helper()
			partial, err := store.Partial(digestFixture("a"), "weights.bin")
			if err != nil {
				t.Fatal(err)
			}
			file, err := partial.OpenData(os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
			if err != nil {
				t.Fatal(err)
			}
			_, _ = file.Write([]byte("x"))
			_ = file.Close()
			mustSymlink(t, outside, filepath.Join(store.Root, "models", "asset"))
			sum := sha256.Sum256([]byte("x"))
			files := []modelcontract.FileIdentity{{Path: "weights.bin", Role: "weights", SizeBytes: 1, SHA256: hex.EncodeToString(sum[:]), Mode: "read-only"}}
			if _, err := store.CommitModel("asset", digestFixture("a"), files, map[string]*Partial{"weights.bin": partial}, []byte("manifest"), []byte("notice")); err == nil {
				t.Fatal("model ancestor symlink accepted")
			}
		},
		"model hard link": func(t *testing.T, store *Store, outside string) {
			t.Helper()
			model := filepath.Join("models", "asset", digestFixture("a"), "files")
			directory, err := store.openOwnedDirectory(model, true)
			if err != nil {
				t.Fatal(err)
			}
			_ = directory.Close()
			if err := store.writeOwnedExclusive(filepath.Join(model, "weights.bin"), []byte("x"), 0400); err != nil {
				t.Fatal(err)
			}
			modelPath := filepath.Join(store.Root, model, "weights.bin")
			alias := filepath.Join(outside, "model-alias")
			if err := os.Link(modelPath, alias); err != nil {
				t.Fatal(err)
			}
			sum := sha256.Sum256([]byte("x"))
			files := []modelcontract.FileIdentity{{Path: "weights.bin", Role: "weights", SizeBytes: 1, SHA256: hex.EncodeToString(sum[:]), Mode: "read-only"}}
			if err := store.VerifyModel("asset", digestFixture("a"), files); err == nil {
				t.Fatal("hard-linked model file accepted")
			}
			if err := os.Remove(alias); err != nil {
				t.Fatal(err)
			}
		},
		"writer hard link": func(t *testing.T, store *Store, outside string) {
			t.Helper()
			external := filepath.Join(outside, "writer")
			if err := os.WriteFile(external, []byte("sentinel"), 0600); err != nil {
				t.Fatal(err)
			}
			if err := os.Link(external, filepath.Join(store.Root, "locks", "store-writer-v1.lock")); err != nil {
				t.Fatal(err)
			}
			if lease, err := store.AcquireWriter(); err == nil {
				_ = lease.Close()
				t.Fatal("hard-linked writer lock accepted")
			}
		},
		"lease hard link": func(t *testing.T, store *Store, outside string) {
			t.Helper()
			external := filepath.Join(outside, "lease")
			if err := os.WriteFile(external, []byte("sentinel"), 0600); err != nil {
				t.Fatal(err)
			}
			if err := os.Link(external, filepath.Join(store.Root, "leases", installationID+".lock")); err != nil {
				t.Fatal(err)
			}
			if lease, err := store.AcquireInstallationShared(installationID); err == nil {
				_ = lease.Close()
				t.Fatal("hard-linked installation lease accepted")
			}
		},
	}
	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			base, err := filepath.EvalSymlinks(t.TempDir())
			if err != nil {
				t.Fatal(err)
			}
			outside := filepath.Join(base, "outside")
			if err := os.Mkdir(outside, 0700); err != nil {
				t.Fatal(err)
			}
			store, err := Open(filepath.Join(base, "store"))
			if err != nil {
				t.Fatal(err)
			}
			defer store.Close()
			test(t, store, outside)
			entries, err := os.ReadDir(outside)
			if err != nil {
				t.Fatal(err)
			}
			for _, entry := range entries {
				if entry.Name() != "writer" && entry.Name() != "lease" {
					t.Fatalf("owned operation created external entry %q", entry.Name())
				}
			}
		})
	}
}

func TestPointerPreparationCannotEscapeDuringLineageDrift(t *testing.T) {
	base, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	outside := filepath.Join(base, "outside")
	if err := os.Mkdir(outside, 0700); err != nil {
		t.Fatal(err)
	}
	store, err := Open(filepath.Join(base, "store"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	initial, err := store.PreparePointer(pointerFixture(installationID, selectorID))
	if err != nil {
		t.Fatal(err)
	}
	initial.Abort()
	profile := filepath.Join(store.Root, "profiles", "english")
	saved := profile + ".saved"
	stop := make(chan struct{})
	var worker sync.WaitGroup
	worker.Add(1)
	go func() {
		defer worker.Done()
		for {
			select {
			case <-stop:
				return
			default:
			}
			if os.Rename(profile, saved) == nil {
				_ = os.Symlink(outside, profile)
				_ = os.Remove(profile)
				_ = os.Rename(saved, profile)
			}
		}
	}()
	for index := 3; index < 503; index++ {
		selector := fmt.Sprintf("00000000-0000-4000-8000-%012x", index)
		if prepared, err := store.PreparePointer(pointerFixture(installationID, selector)); err == nil {
			prepared.Abort()
		}
	}
	close(stop)
	worker.Wait()
	entries, err := os.ReadDir(outside)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 0 {
		t.Fatalf("lineage drift escaped Store 1: %v", entries)
	}
}

func TestPruneRejectsNestedSymlinkWithoutExternalUnlink(t *testing.T) {
	base, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	outside := filepath.Join(base, "outside")
	if err := os.Mkdir(outside, 0700); err != nil {
		t.Fatal(err)
	}
	marker := filepath.Join(outside, "marker")
	if err := os.WriteFile(marker, []byte("preserve"), 0600); err != nil {
		t.Fatal(err)
	}
	store, err := Open(filepath.Join(base, "store"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	writer, err := store.AcquireWriter()
	if err != nil {
		t.Fatal(err)
	}
	defer writer.Close()
	model := filepath.Join("models", "asset", digestFixture("a"))
	directory, err := store.openOwnedDirectory(model, true)
	if err != nil {
		t.Fatal(err)
	}
	_ = directory.Close()
	if err := os.Symlink(outside, filepath.Join(store.Root, model, "files")); err != nil {
		t.Fatal(err)
	}
	if _, err := store.PruneOrphans(64); err == nil {
		t.Fatal("orphan prune accepted nested symlink")
	}
	if data, err := os.ReadFile(marker); err != nil || string(data) != "preserve" {
		t.Fatalf("external marker changed: data=%q err=%v", data, err)
	}
}

func pointerFixture(installation, selector string) installcontract.ActivePointer {
	return installcontract.ActivePointer{SchemaVersion: 1, ProfileID: "english", Target: modelcontract.Target{Platform: "darwin", Architecture: "arm64"}, InstallationID: installation, SelectorGeneration: selector, ActivationRelativePath: "activations/" + installation + "/profile-activation-v1.json", ActivationSHA256: digestFixture("a"), CompatibilityPairSHA256: digestFixture("a"), UpdatedAt: "2026-08-09T00:00:00Z"}
}

func digestFixture(character string) string { return strings.Repeat(character, 64) }

func mustSymlink(t *testing.T, target, link string) {
	t.Helper()
	if err := os.Symlink(target, link); err != nil {
		t.Fatal(err)
	}
}
