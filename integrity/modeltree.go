package integrity

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"syscall"

	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
)

var (
	digestPattern   = regexp.MustCompile(`^[a-f0-9]{64}$`)
	revisionPattern = regexp.MustCompile(`^[a-f0-9]{40}$`)
	relativePattern = regexp.MustCompile(`^[A-Za-z0-9._/-]+$`)
)

func ValidRelativePath(value string) bool {
	if !relativePattern.MatchString(value) || strings.Contains(value, `\`) || strings.HasPrefix(value, "/") {
		return false
	}
	cleaned := filepath.ToSlash(filepath.Clean(filepath.FromSlash(value)))
	return cleaned == value && value != "." && !strings.HasPrefix(value, "../") && !strings.Contains(value, "/../")
}

func ValidateManifest(value modelcontract.AssetManifest) error {
	if value.SchemaVersion != 1 || value.ModelAssetID == "" || value.ModelID == "" || !revisionPattern.MatchString(value.Revision) || value.LayoutID == "" || len(value.Files) == 0 || len(value.CompatibleHosts) != 1 {
		return errors.New("invalid model manifest identity")
	}
	var total int64
	seen := map[string]bool{}
	folded := map[string]bool{}
	previous := ""
	rows := make([]modelcontract.FileIdentity, 0, len(value.Files))
	for _, file := range value.Files {
		if !ValidRelativePath(file.Path) || file.Path <= previous || seen[file.Path] || folded[strings.ToLower(file.Path)] || file.Role == "" || file.SizeBytes <= 0 || !digestPattern.MatchString(file.SHA256) || file.Mode != "read-only" || !revisionPattern.MatchString(file.Revision) || !validPinnedURL(file.URL, file.Revision) {
			return fmt.Errorf("invalid model manifest file: %s", file.Path)
		}
		previous, seen[file.Path], folded[strings.ToLower(file.Path)] = file.Path, true, true
		total += file.SizeBytes
		rows = append(rows, modelcontract.FileIdentity{Path: file.Path, Role: file.Role, SizeBytes: file.SizeBytes, SHA256: file.SHA256, Mode: file.Mode})
	}
	if total != value.TotalSizeBytes || TreeDigest(rows) != value.ModelTreeSHA256 {
		return errors.New("model manifest aggregate mismatch")
	}
	policy := value.DownloadPolicy
	if policy.InitialOrigin != "https://huggingface.co" || !policy.HTTPSOnly || !policy.PublicNetworkRedirectsOnly || policy.MaxRedirects != 5 || policy.ConnectTimeoutMS != 10000 || policy.ReadIdleTimeoutMS != 30000 || policy.OverallFileTimeoutMS != 7200000 || policy.Resume != "range-if-validator-matches-otherwise-restart" || value.Notice.Path != "THIRD_PARTY_NOTICES.json" || !digestPattern.MatchString(value.Notice.SHA256) {
		return errors.New("invalid model download/notice policy")
	}
	return nil
}

func ValidateCompatibility(requirement modelcontract.CompatibilityRequirement, manifest modelcontract.AssetManifest, requirementSHA string) error {
	if requirement.SchemaVersion != 1 || requirement.AcceptedModelManifestSchemaVersion != 1 || requirement.ModelTreeAlgorithm != "canonical-path-size-sha256-v1" || !digestPattern.MatchString(requirementSHA) || len(manifest.CompatibleHosts) != 1 {
		return errors.New("invalid compatibility requirement")
	}
	if requirement.Model.ModelID != manifest.ModelID || requirement.Model.Family != manifest.Family || requirement.Model.Size != manifest.Size || requirement.Model.Precision != manifest.Precision || requirement.Model.LayoutID != manifest.LayoutID || len(requirement.RequiredFiles) != len(manifest.Files) {
		return errors.New("host/model identity mismatch")
	}
	for index := range requirement.RequiredFiles {
		if requirement.RequiredFiles[index].Path != manifest.Files[index].Path || requirement.RequiredFiles[index].Role != manifest.Files[index].Role {
			return errors.New("host/model file layout mismatch")
		}
	}
	host := manifest.CompatibleHosts[0]
	if host.ProviderID != requirement.ProviderID || host.Platform != requirement.Target.Platform || host.Architecture != requirement.Target.Architecture || host.EngineKind != requirement.Engine.Kind || host.EngineVersion != requirement.Engine.Version || host.EngineConfigurationSHA256 != requirement.Engine.ConfigurationSHA256 || host.CompatibilityRequirementSHA256 != requirementSHA {
		return errors.New("reciprocal host compatibility mismatch")
	}
	return nil
}

func TreeDigest(files []modelcontract.FileIdentity) string {
	rows := make([][]any, len(files))
	for index, file := range files {
		rows[index] = []any{file.Path, file.SizeBytes, file.SHA256}
	}
	data, _ := json.Marshal(rows)
	data = append(data, '\n')
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

func VerifyTree(root string, files []modelcontract.FileIdentity) error {
	actual := []string{}
	err := filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == root {
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if info.Mode()&os.ModeSymlink != 0 || (!entry.IsDir() && !info.Mode().IsRegular()) {
			return errors.New("model tree contains non-ordinary entry")
		}
		if info.Mode().IsRegular() {
			if stat, ok := info.Sys().(*syscall.Stat_t); ok && stat.Nlink != 1 {
				return errors.New("model tree contains hard-link alias")
			}
		}
		if info.Mode().IsRegular() {
			actual = append(actual, filepath.ToSlash(strings.TrimPrefix(path, root+string(filepath.Separator))))
		}
		return nil
	})
	if err != nil {
		return err
	}
	sort.Strings(actual)
	if len(actual) != len(files) {
		return errors.New("model tree file count mismatch")
	}
	for index, file := range files {
		if actual[index] != file.Path {
			return errors.New("model tree path mismatch")
		}
		path := filepath.Join(root, filepath.FromSlash(file.Path))
		info, err := os.Lstat(path)
		if err != nil || !info.Mode().IsRegular() || info.Size() != file.SizeBytes || info.Mode().Perm()&0222 != 0 {
			return fmt.Errorf("model file identity mismatch: %s", file.Path)
		}
		digest, err := FileDigest(path)
		if err != nil || digest != file.SHA256 {
			return fmt.Errorf("model file digest mismatch: %s", file.Path)
		}
	}
	return nil
}

func FileDigest(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()
	hash := sha256.New()
	if _, err := io.CopyBuffer(hash, file, make([]byte, 256*1024)); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}

func validPinnedURL(value, revision string) bool {
	return strings.HasPrefix(value, "https://huggingface.co/") && strings.Contains(value, "/resolve/"+revision+"/") && !strings.ContainsAny(value, "?#@")
}
