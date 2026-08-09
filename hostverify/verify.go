package hostverify

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"syscall"

	hostcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/host"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
	"github.com/AutoByteus/autobyteus-voice-runtime/integrity"
	"github.com/AutoByteus/autobyteus-voice-runtime/internal/contractjson"
)

type Expected struct {
	HostPackageID                  string
	HostSourceClosureSHA256        string
	ModelAdmissionRootSHA256       string
	CompatibilityRequirementSHA256 string
}

type HostAuthority struct {
	Root                   string
	Descriptor             hostcontract.Descriptor
	DescriptorSHA256       string
	FileManifest           hostcontract.FileManifest
	FileManifestSHA256     string
	HostSourceClosureBytes []byte
	Admission              modelcontract.AdmissionRoot
	AdmissionSHA256        string
	Compatibility          modelcontract.CompatibilityRequirement
	CompatibilitySHA256    string
}

func Verify(root string, expected Expected) (HostAuthority, error) {
	if expected.HostPackageID == "" || expected.HostPackageID == "UNSET" || !digest(expected.HostSourceClosureSHA256) || !digest(expected.ModelAdmissionRootSHA256) || !digest(expected.CompatibilityRequirementSHA256) {
		return HostAuthority{}, errors.New("host authority is not embedded")
	}
	descriptorPath := filepath.Join(root, "provider/runtime-host-v2.json")
	var descriptor hostcontract.Descriptor
	descriptorBytes, err := contractjson.Read(descriptorPath, &descriptor)
	if err != nil {
		return HostAuthority{}, err
	}
	if descriptor.SchemaVersion != 2 || descriptor.HostPackageID != expected.HostPackageID || descriptor.HostSourceClosure.SHA256 != expected.HostSourceClosureSHA256 || descriptor.ModelAdmissionRoot.SHA256 != expected.ModelAdmissionRootSHA256 || descriptor.ModelCompatibilityRequirement.SHA256 != expected.CompatibilityRequirementSHA256 {
		return HostAuthority{}, errors.New("host descriptor authority mismatch")
	}
	var manifest hostcontract.FileManifest
	manifestBytes, err := contractjson.Read(filepath.Join(root, descriptor.FileManifestPath), &manifest)
	if err != nil {
		return HostAuthority{}, err
	}
	if manifest.SchemaVersion != 2 || manifest.HostPackageID != expected.HostPackageID {
		return HostAuthority{}, errors.New("host file manifest mismatch")
	}
	if err := verifyHostFiles(root, manifest); err != nil {
		return HostAuthority{}, err
	}
	if err := verifyDescriptorBindings(descriptor, manifest); err != nil {
		return HostAuthority{}, err
	}
	closurePath := filepath.Join(root, filepath.FromSlash(descriptor.HostSourceClosure.Path))
	closureBytes, err := os.ReadFile(closurePath)
	if err != nil || contractjson.Digest(closureBytes) != expected.HostSourceClosureSHA256 {
		return HostAuthority{}, errors.New("host source closure mismatch")
	}
	var admission modelcontract.AdmissionRoot
	admissionBytes, err := contractjson.Read(filepath.Join(root, filepath.FromSlash(descriptor.ModelAdmissionRoot.Path)), &admission)
	if err != nil || contractjson.Digest(admissionBytes) != expected.ModelAdmissionRootSHA256 {
		return HostAuthority{}, errors.New("model admission root mismatch")
	}
	if admission.SchemaVersion != 1 || admission.AuthorityVersion != 1 || admission.HostPackageID != expected.HostPackageID || admission.UpdatePolicy != "new-host-required" || len(admission.AdmittedModels) != 1 || admission.CompatibilityRequirement.SHA256 != expected.CompatibilityRequirementSHA256 {
		return HostAuthority{}, errors.New("invalid model admission root")
	}
	var requirement modelcontract.CompatibilityRequirement
	requirementBytes, err := contractjson.Read(filepath.Join(root, filepath.FromSlash(descriptor.ModelCompatibilityRequirement.Path)), &requirement)
	if err != nil || contractjson.Digest(requirementBytes) != expected.CompatibilityRequirementSHA256 {
		return HostAuthority{}, errors.New("model compatibility requirement mismatch")
	}
	return HostAuthority{Root: root, Descriptor: descriptor, DescriptorSHA256: contractjson.Digest(descriptorBytes), FileManifest: manifest, FileManifestSHA256: contractjson.Digest(manifestBytes), HostSourceClosureBytes: closureBytes, Admission: admission, AdmissionSHA256: expected.ModelAdmissionRootSHA256, Compatibility: requirement, CompatibilitySHA256: expected.CompatibilityRequirementSHA256}, nil
}

func verifyDescriptorBindings(descriptor hostcontract.Descriptor, manifest hostcontract.FileManifest) error {
	records := make(map[string]hostcontract.FileRecord, len(manifest.Files))
	for _, record := range manifest.Files {
		records[record.Path] = record
	}
	expected := map[string]string{
		descriptor.LauncherPlan.Path:                  descriptor.LauncherPlan.SHA256,
		descriptor.Host.Executable:                    descriptor.Host.SHA256,
		descriptor.Worker.Entrypoint:                  descriptor.Worker.SHA256,
		descriptor.Engine.Configuration.Path:          descriptor.Engine.Configuration.SHA256,
		descriptor.HostSourceClosure.Path:             descriptor.HostSourceClosure.SHA256,
		descriptor.ModelAdmissionRoot.Path:            descriptor.ModelAdmissionRoot.SHA256,
		descriptor.ModelCompatibilityRequirement.Path: descriptor.ModelCompatibilityRequirement.SHA256,
	}
	for path, sha := range expected {
		record, ok := records[path]
		if !ok || record.SHA256 != sha {
			return errors.New("host descriptor control binding mismatch")
		}
	}
	for _, executable := range []string{descriptor.Launcher, descriptor.ModelManager, descriptor.Host.Executable} {
		if record, ok := records[executable]; !ok || record.Mode != "executable" {
			return errors.New("host executable binding mismatch")
		}
	}
	return nil
}

func verifyHostFiles(root string, manifest hostcontract.FileManifest) error {
	previous := ""
	seen := map[string]bool{}
	folded := map[string]bool{}
	for _, record := range manifest.Files {
		if !integrity.ValidRelativePath(record.Path) || record.Path <= previous || seen[record.Path] || folded[strings.ToLower(record.Path)] || !digest(record.SHA256) || record.SizeBytes < 0 || (record.Mode != "read-only" && record.Mode != "executable") {
			return errors.New("invalid host file manifest row")
		}
		previous = record.Path
		seen[record.Path] = true
		folded[strings.ToLower(record.Path)] = true
		if strings.HasPrefix(record.Path, "model/") || strings.Contains(strings.ToLower(record.Path), "weights.npz") || strings.HasSuffix(strings.ToLower(record.Path), ".gguf") {
			return errors.New("model payload in runtime host")
		}
		path := filepath.Join(root, filepath.FromSlash(record.Path))
		info, err := os.Lstat(path)
		if err != nil {
			return fmt.Errorf("host file mismatch: %s", record.Path)
		}
		stat, linked := info.Sys().(*syscall.Stat_t)
		if !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 || info.Size() != record.SizeBytes || (linked && stat.Nlink != 1) {
			return fmt.Errorf("host file mismatch: %s", record.Path)
		}
		observed, err := integrity.FileDigest(path)
		if err != nil || observed != record.SHA256 {
			return fmt.Errorf("host file digest mismatch: %s", record.Path)
		}
		if record.Mode == "executable" && info.Mode().Perm()&0111 == 0 {
			return errors.New("host executable mode mismatch")
		}
	}
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
			return errors.New("non-ordinary host entry")
		}
		if info.Mode().IsRegular() {
			relative, _ := filepath.Rel(root, path)
			relative = filepath.ToSlash(relative)
			if relative != "provider/host-files-v2.json" {
				actual = append(actual, relative)
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	sort.Strings(actual)
	if len(actual) != len(manifest.Files) {
		return errors.New("host manifest closure mismatch")
	}
	for index := range actual {
		if actual[index] != manifest.Files[index].Path {
			return errors.New("host manifest path closure mismatch")
		}
	}
	return nil
}
func digest(value string) bool {
	return len(value) == 64 && strings.Trim(value, "0123456789abcdef") == ""
}
