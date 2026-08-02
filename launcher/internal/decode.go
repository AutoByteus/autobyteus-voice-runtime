package launcher

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
)

var sha256Pattern = regexp.MustCompile(`^[a-f0-9]{64}$`)
var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

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

func DecodePlan(data []byte) (LauncherPlan, error) {
	var plan LauncherPlan
	if err := decodeExact(data, &plan); err != nil {
		return plan, err
	}
	if plan.SchemaVersion != 1 || plan.PackageID == "" || !validTarget(plan.Target) {
		return plan, errors.New("invalid plan identity")
	}
	if plan.Invocation.Kind == "python-worker" {
		if !validRelativePath(plan.Invocation.Executable) || !validRelativePath(plan.Invocation.Worker) {
			return plan, errors.New("invalid python plan")
		}
	} else if plan.Invocation.Kind == "native-worker" {
		if !validRelativePath(plan.Invocation.Executable) || plan.Invocation.Worker != "" {
			return plan, errors.New("invalid native plan")
		}
	} else {
		return plan, errors.New("invalid invocation kind")
	}
	return plan, nil
}

func DecodeSession(path string) (SessionConfig, error) {
	var config SessionConfig
	if !filepath.IsAbs(path) {
		return config, errors.New("config must be absolute")
	}
	info, err := os.Lstat(path)
	if err != nil || !info.Mode().IsRegular() || info.Size() > 1024*1024 {
		return config, errors.New("config is not an ordinary bounded file")
	}
	data, err := os.ReadFile(path)
	if err != nil || decodeExact(data, &config) != nil {
		return config, errors.New("invalid config")
	}
	e := config.Expected
	if config.SchemaVersion != 1 || config.ProtocolVersion != 1 || !uuidPattern.MatchString(config.SessionID) || !profileLanguage(config.ProfileID, e.LanguageMode) || e.PackageID == "" || e.ProviderID == "" || e.ModelID == "" || !validTarget(Target{e.Platform, e.Architecture}) || !sha256Pattern.MatchString(e.DescriptorSHA256) || !sha256Pattern.MatchString(e.FileManifestSHA256) || !sha256Pattern.MatchString(e.CapabilityDigest) {
		return config, errors.New("invalid config identity")
	}
	return config, nil
}

func validTarget(target Target) bool {
	if target.Platform != "darwin" && target.Platform != "linux" && target.Platform != "win32" {
		return false
	}
	if target.Architecture != "arm64" && target.Architecture != "x64" {
		return false
	}
	return !(target.Platform != "darwin" && target.Architecture == "arm64")
}

func profileLanguage(profile, language string) bool {
	return (profile == "english" && language == "en") || (profile == "chinese" && language == "zh") || (profile == "auto" && language == "auto")
}

func actualTarget() Target {
	platform := runtime.GOOS
	if platform == "windows" {
		platform = "win32"
	}
	architecture := runtime.GOARCH
	if architecture == "amd64" {
		architecture = "x64"
	}
	return Target{platform, architecture}
}
