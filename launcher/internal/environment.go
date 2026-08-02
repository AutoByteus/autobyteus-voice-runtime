package launcher

import (
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

const scratchMarker = ".autobyteus-voice-scratch-v1"
const scratchMarkerContents = "autobyteus-voice-scratch-v1\n"

func privateEnvironment(packageRoot string) (string, []string, error) {
	scratch, err := os.MkdirTemp("", "autobyteus-voice-")
	if err != nil {
		return "", nil, err
	}
	if err := os.Chmod(scratch, 0700); err != nil {
		os.RemoveAll(scratch)
		return "", nil, err
	}
	if err := os.WriteFile(filepath.Join(scratch, scratchMarker), []byte(scratchMarkerContents), 0600); err != nil {
		os.RemoveAll(scratch)
		return "", nil, err
	}
	rootAbs, _ := filepath.Abs(packageRoot)
	scratchAbs, _ := filepath.Abs(scratch)
	if rel, _ := filepath.Rel(rootAbs, scratchAbs); rel == "." || (!strings.HasPrefix(rel, ".."+string(filepath.Separator)) && rel != "..") {
		os.RemoveAll(scratch)
		return "", nil, errors.New("scratch inside package")
	}
	environment := []string{}
	if runtime.GOOS == "windows" {
		systemRoot, err := validatedWindowsSystemRoot(os.Getenv("SystemRoot"))
		if err != nil {
			os.RemoveAll(scratch)
			return "", nil, err
		}
		environment = append(environment, "SystemRoot="+systemRoot, "WINDIR="+systemRoot, "USERPROFILE="+scratch, "TEMP="+scratch, "TMP="+scratch)
	} else {
		environment = append(environment, "HOME="+scratch, "TMPDIR="+scratch, "LANG=C.UTF-8", "LC_ALL=C.UTF-8")
	}
	return scratch, environment, nil
}
