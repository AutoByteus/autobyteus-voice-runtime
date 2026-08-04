package archive

import "testing"

func TestPathPolicy(t *testing.T) {
	for _, value := range []string{"bin/voice-provider", "provider/package.json"} {
		if ValidateRelativePath(value) != nil {
			t.Fatal(value)
		}
	}
	for _, value := range []string{"../x", "/x", "C:/x", "a\\b", "a//b", "a/./b", "CON", "dir/NUL.txt", "trail.", "trail "} {
		if ValidateRelativePath(value) == nil {
			t.Fatalf("accepted %s", value)
		}
	}
	if ValidatePathSet([]string{"Case/File", "case/file"}) == nil {
		t.Fatal("case collision accepted")
	}
}
