package launcher

import (
	"os"
	"path/filepath"
	"testing"
)

func TestPrivateEnvironmentCreatesOwnedScratchMarker(t *testing.T) {
	scratch, environment, err := privateEnvironment(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(scratch)
	marker, err := os.ReadFile(filepath.Join(scratch, scratchMarker))
	if err != nil || string(marker) != scratchMarkerContents {
		t.Fatal("scratch ownership marker missing")
	}
	if len(environment) == 0 {
		t.Fatal("isolated environment missing")
	}
}
