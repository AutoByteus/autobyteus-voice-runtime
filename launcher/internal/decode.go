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
var uuidPattern = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

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
	if decodeExact(data, &plan) != nil || plan.SchemaVersion != 2 || plan.HostPackageID == "" || !validTarget(plan.Target) {
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
	if err != nil || !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 || info.Size() > 1024*1024 {
		return config, errors.New("config is not an ordinary bounded file")
	}
	data, err := os.ReadFile(path)
	if err != nil || decodeExact(data, &config) != nil {
		return config, errors.New("invalid config")
	}
	e := config.Expected
	validDigests := []string{config.ActivationSHA256, e.DescriptorSHA256, e.FileManifestSHA256, e.HostSourceClosureSHA256, e.ModelAdmissionRootSHA256, e.ModelManifestSHA256, e.ModelTreeSHA256, e.CompatibilityPairSHA256, e.CapabilityDigest}
	for _, value := range validDigests {
		if !sha256Pattern.MatchString(value) {
			return config, errors.New("invalid config digest")
		}
	}
	if config.SchemaVersion != 2 || config.ProtocolVersion != 1 || !uuidPattern.MatchString(config.SessionID) || !uuidPattern.MatchString(config.InstallationID) || !filepath.IsAbs(config.InstallationRoot) || !profileLanguage(config.ProfileID, e.LanguageMode) || e.HostPackageID == "" || e.ProviderID == "" || e.ModelID == "" || !validTarget(Target{Platform: e.Platform, Architecture: e.Architecture}) {
		return config, errors.New("invalid config identity")
	}
	return config, nil
}
func validTarget(target Target) bool {
	return target.Platform == "darwin" && target.Architecture == "arm64"
}
func profileLanguage(profile, language string) bool {
	return (profile == "english" && language == "en") || (profile == "chinese" && language == "zh")
}
func actualTarget() Target {
	platform, architecture := runtime.GOOS, runtime.GOARCH
	if platform == "windows" {
		platform = "win32"
	}
	if architecture == "amd64" {
		architecture = "x64"
	}
	return Target{Platform: platform, Architecture: architecture}
}
