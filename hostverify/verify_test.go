package hostverify

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"testing"

	hostcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/host"
)

func TestHostFileClosureRejectsMutationExtraModelAndHardLink(t *testing.T) {
	root := t.TempDir()
	write := func(relative, value string) hostcontract.FileRecord {
		t.Helper()
		path := filepath.Join(root, filepath.FromSlash(relative))
		if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(value), 0400); err != nil {
			t.Fatal(err)
		}
		sum := sha256.Sum256([]byte(value))
		return hostcontract.FileRecord{Path: relative, SHA256: hex.EncodeToString(sum[:]), SizeBytes: int64(len(value)), Mode: "read-only"}
	}
	record := write("provider/control.json", "control")
	manifest := hostcontract.FileManifest{SchemaVersion: 2, HostPackageID: "fixture", Files: []hostcontract.FileRecord{record}}
	if err := verifyHostFiles(root, manifest); err != nil {
		t.Fatal(err)
	}
	controlPath := filepath.Join(root, "provider/control.json")
	if err := os.Chmod(controlPath, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(controlPath, []byte("changed"), 0400); err != nil {
		t.Fatal(err)
	}
	if err := verifyHostFiles(root, manifest); err == nil {
		t.Fatal("modified host file accepted")
	}
	if err := os.WriteFile(controlPath, []byte("control"), 0400); err != nil {
		t.Fatal(err)
	}
	if err := os.Link(filepath.Join(root, "provider/control.json"), filepath.Join(root, "outside-alias")); err != nil {
		t.Fatal(err)
	}
	if err := verifyHostFiles(root, manifest); err == nil {
		t.Fatal("hard-linked host file accepted")
	}
	if err := os.Remove(filepath.Join(root, "outside-alias")); err != nil {
		t.Fatal(err)
	}
	model := write("model/weights.npz", "weights")
	manifest.Files = []hostcontract.FileRecord{model, record}
	if err := verifyHostFiles(root, manifest); err == nil {
		t.Fatal("model payload accepted in runtime host")
	}
}
