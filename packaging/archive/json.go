package archive

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"os"
	"regexp"
	"sort"
)

var shaPattern = regexp.MustCompile(`^[a-f0-9]{64}$`)

func decodeExact(data []byte, target any) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("trailing JSON")
	}
	return nil
}

// DecodeExtractExpectation rejects unknown fields and trailing values before any extraction.
func DecodeExtractExpectation(data []byte) (ExtractExpectation, error) {
	var expected ExtractExpectation
	if err := decodeExact(data, &expected); err != nil {
		return expected, err
	}
	return expected, nil
}

func ReadManifest(filePath string) (HostFileManifest, error) {
	var manifest HostFileManifest
	data, err := os.ReadFile(filePath)
	if err != nil || decodeExact(data, &manifest) != nil || manifest.SchemaVersion != 2 || manifest.HostPackageID == "" || len(manifest.Files) == 0 {
		return manifest, errors.New("invalid host manifest")
	}
	paths := make([]string, len(manifest.Files))
	for index, file := range manifest.Files {
		paths[index] = file.Path
		if !shaPattern.MatchString(file.SHA256) || file.SizeBytes < 0 || (file.Mode != Executable && file.Mode != ReadOnly) {
			return manifest, errors.New("invalid manifest record")
		}
	}
	if ValidatePathSet(paths) != nil || !sort.StringsAreSorted(paths) {
		return manifest, errors.New("manifest paths invalid or unsorted")
	}
	for _, file := range manifest.Files {
		if file.Path == "provider/host-files-v2.json" {
			return manifest, errors.New("manifest lists itself")
		}
	}
	return manifest, nil
}
