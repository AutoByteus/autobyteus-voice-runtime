package archive

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestRuntimeClosureManifest(t *testing.T) {
	manifestPath := os.Getenv("VOICE_RUNTIME_CLOSURE_MANIFEST")
	if manifestPath == "" {
		manifest := HostFileManifest{
			SchemaVersion: 2,
			HostPackageID: "fixture.host",
			Files: []ManifestFile{
				{Path: "host/python/bin/python3", SHA256: digestBytes([]byte("python")), SizeBytes: 6, Mode: Executable},
				{Path: "worker/worker.py", SHA256: digestBytes([]byte("worker")), SizeBytes: 6, Mode: ReadOnly},
			},
		}
		data, err := json.Marshal(manifest)
		if err != nil {
			t.Fatal(err)
		}
		manifestPath = filepath.Join(t.TempDir(), "host-files-v2.json")
		if err := os.WriteFile(manifestPath, data, 0600); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := ReadManifest(manifestPath); err != nil {
		t.Fatalf("runtime closure manifest rejected: %v", err)
	}
}
