package archive

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestCanonicalBuildAndVerifiedExtraction(t *testing.T) {
	root := t.TempDir()
	payload := filepath.Join(root, "payload")
	os.MkdirAll(filepath.Join(payload, "bin"), 0700)
	os.MkdirAll(filepath.Join(payload, "provider"), 0700)
	os.WriteFile(filepath.Join(payload, "bin", "voice-provider"), []byte("probe"), 0700)
	descriptor := []byte("{}\n")
	os.WriteFile(filepath.Join(payload, "provider", "runtime-host-v2.json"), descriptor, 0600)
	files := []ManifestFile{{"bin/voice-provider", digestBytes([]byte("probe")), 5, Executable}, {"provider/runtime-host-v2.json", digestBytes(descriptor), int64(len(descriptor)), ReadOnly}}
	manifest := HostFileManifest{2, "fixture.host", files}
	manifestBytes, _ := json.MarshalIndent(manifest, "", "  ")
	manifestBytes = append(manifestBytes, '\n')
	os.WriteFile(filepath.Join(payload, "provider", "host-files-v2.json"), manifestBytes, 0600)
	first := filepath.Join(root, "first.zip")
	second := filepath.Join(root, "second.zip")
	one, err := BuildCanonicalZIP(payload, first)
	if err != nil {
		t.Fatal(err)
	}
	two, err := BuildCanonicalZIP(payload, second)
	if err != nil {
		t.Fatal(err)
	}
	a, _ := os.ReadFile(first)
	b, _ := os.ReadFile(second)
	if !reflect.DeepEqual(a, b) {
		t.Fatal("archive not deterministic")
	}
	expected := ExtractExpectation{2, "fixture.host", Target{"darwin", "arm64"}, ArchiveIdentity{"zip", 2, "deflate", "autobyteus-runtime-host-zip-v2", "host", "fixture.zip", "https://example/fixture.zip", one.SHA256, one.CompressedSizeBytes, one.ExtractedSizeBytes, one.EntryCount}, AssetRef{"provider/runtime-host-v2.json", digestBytes(descriptor)}, AssetRef{"provider/host-files-v2.json", digestBytes(manifestBytes)}}
	destination := filepath.Join(root, "verified package")
	t.Cleanup(func() {
		filepath.WalkDir(destination, func(target string, entry os.DirEntry, _ error) error {
			if entry != nil && entry.IsDir() {
				_ = os.Chmod(target, 0700)
			} else {
				_ = os.Chmod(target, 0600)
			}
			return nil
		})
	})
	report, err := ExtractVerified(first, destination, expected)
	if err != nil {
		t.Fatal(err)
	}
	if !report.ModesVerified {
		t.Fatal("modes not verified")
	}
	if report.HostRoot != expected.Archive.RootDirectory || report.HostRoot != "host" {
		t.Fatalf("verification report exposed the wrong host root: %q", report.HostRoot)
	}
	if report.HostRoot == destination {
		t.Fatal("verification report exposed the private extraction destination")
	}
	if _, err := os.Stat(filepath.Join(destination, "bin", "voice-provider")); err != nil {
		t.Fatal(err)
	}
	t.Run("rejects noncanonical central metadata without a destination", func(t *testing.T) {
		mutated := append([]byte(nil), a...)
		central := int(binary.LittleEndian.Uint32(mutated[len(mutated)-22+16:]))
		mutated[central+4]++
		archivePath := filepath.Join(root, "noncanonical.zip")
		if err := os.WriteFile(archivePath, mutated, 0600); err != nil {
			t.Fatal(err)
		}
		invalid := expected
		invalid.Archive.SHA256 = digestBytes(mutated)
		invalidDestination := filepath.Join(root, "noncanonical destination")
		if _, err := ExtractVerified(archivePath, invalidDestination, invalid); err == nil {
			t.Fatal("noncanonical central metadata accepted")
		}
		assertAbsent(t, invalidDestination)
	})
	t.Run("rejects logical mode mismatch and removes staging", func(t *testing.T) {
		mutated := append([]byte(nil), a...)
		central := int(binary.LittleEndian.Uint32(mutated[len(mutated)-22+16:]))
		binary.LittleEndian.PutUint32(mutated[central+38:], regularFileType|0444)
		archivePath := filepath.Join(root, "wrong-mode.zip")
		if err := os.WriteFile(archivePath, mutated, 0600); err != nil {
			t.Fatal(err)
		}
		invalid := expected
		invalid.Archive.SHA256 = digestBytes(mutated)
		invalidDestination := filepath.Join(root, "wrong mode destination")
		if _, err := ExtractVerified(archivePath, invalidDestination, invalid); err == nil {
			t.Fatal("logical mode mismatch accepted")
		}
		assertAbsent(t, invalidDestination)
	})
	t.Run("rejects expectation path escape before extraction", func(t *testing.T) {
		invalid := expected
		invalid.FileManifest.Path = "../host-files-v2.json"
		invalidDestination := filepath.Join(root, "path escape destination")
		if _, err := ExtractVerified(first, invalidDestination, invalid); err == nil {
			t.Fatal("expectation path escape accepted")
		}
		assertAbsent(t, invalidDestination)
	})
	_ = two
}
func digestBytes(value []byte) string { sum := sha256.Sum256(value); return hex.EncodeToString(sum[:]) }
func assertAbsent(t *testing.T, path string) {
	t.Helper()
	if _, err := os.Lstat(path); !os.IsNotExist(err) {
		t.Fatalf("unexpected partial destination: %v", err)
	}
}
