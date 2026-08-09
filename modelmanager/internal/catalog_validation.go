package modelmanager

import (
	"errors"
	"fmt"
	"net/url"
	"path"
	"reflect"
	"regexp"
	"strings"

	catalogcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/catalog"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
	"github.com/AutoByteus/autobyteus-voice-runtime/internal/contractjson"
)

const currentReleaseVersion = "1.0.0"

var (
	catalogDigestPattern = regexp.MustCompile(`^[a-f0-9]{64}$`)
	catalogNamePattern   = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)
)

func validateCurrentCatalog(catalog catalogcontract.Catalog, authority HostAuthority, profile string) (*catalogcontract.Entry, error) {
	matrix, err := catalogcontract.CurrentMatrix()
	if err != nil || catalog.SchemaVersion != 4 || catalog.CatalogID != "voice-runtime-catalog-v4" || catalog.ReleaseVersion != currentReleaseVersion || len(catalog.Entries) != len(matrix.Entries) {
		return nil, errors.New("catalog-invalid")
	}
	assetBase := ""
	var selected *catalogcontract.Entry
	for index, matrixEntry := range matrix.Entries {
		entry := &catalog.Entries[index]
		admission, admissionBytes, err := modelcontract.CurrentAdmission(matrixEntry.ProfileID)
		if err != nil || contractjson.Digest(admissionBytes) != matrixEntry.ModelAdmissionRoot.SHA256 || !catalogRowMatchesCurrent(*entry, matrixEntry, admission, admissionBytes) {
			return nil, errors.New("catalog-invalid")
		}
		for _, located := range []catalogcontract.LocatedFileIdentity{entry.Host.Archive, entry.Model.Manifest} {
			base, err := exactAssetBase(located.URL, located.FileName)
			if err != nil || (assetBase != "" && base != assetBase) {
				return nil, errors.New("catalog-invalid")
			}
			assetBase = base
		}
		pairBytes, err := contractjson.Canonical(compatibilityPair{entry.Host.HostPackageID, entry.Host.DescriptorSHA256, entry.Host.CompatibilityRequirementSHA256, entry.Model.Manifest.SHA256, entry.CapabilityDigest})
		if err != nil || entry.CompatibilityPairSHA256 != contractjson.Digest(pairBytes) {
			return nil, errors.New("catalog-invalid")
		}
		if entry.ProfileID == profile {
			selected = entry
		}
	}
	if selected == nil || !selectedCatalogRowMatchesHost(*selected, authority) {
		return nil, errors.New("catalog-unadmitted")
	}
	return selected, nil
}

func catalogRowMatchesCurrent(entry catalogcontract.Entry, matrix catalogcontract.MatrixEntry, admission modelcontract.AdmissionRoot, admissionBytes []byte) bool {
	admitted := admission.AdmittedModels[0]
	expectedArchive := fmt.Sprintf("voice-host-%s-darwin-arm64-%s.zip", matrix.ProfileID, currentReleaseVersion)
	return entry.ProfileID == matrix.ProfileID &&
		entry.LanguageMode == matrix.LanguageMode &&
		entry.Target.Platform == matrix.Platform &&
		entry.Target.Architecture == matrix.Architecture &&
		entry.ProviderID == matrix.ProviderID &&
		entry.ModelID == matrix.ModelID &&
		entry.CapabilityDigest == matrix.CapabilityDigest &&
		entry.SupportStatement == "macOS Apple Silicon only" &&
		entry.Host.HostPackageID == matrix.HostPackageID &&
		entry.Host.Archive.FileName == expectedArchive && validLocatedFile(entry.Host.Archive) &&
		validDigest(entry.Host.DescriptorSHA256) && validDigest(entry.Host.FileManifestSHA256) &&
		entry.Host.CompatibilityRequirementSHA256 == matrix.CompatibilityRequirementSHA256 &&
		entry.Host.LauncherPath == "bin/voice-provider" && entry.Host.ModelManagerPath == "bin/voice-model-manager" &&
		entry.HostAuthority.HostSourceClosure.FileName == "host-source-closure-v1.json" && validFile(entry.HostAuthority.HostSourceClosure) &&
		entry.HostAuthority.ModelAdmissionRoot.FileName == "model-admission-root-v1.json" &&
		entry.HostAuthority.ModelAdmissionRoot.SizeBytes == int64(len(admissionBytes)) &&
		entry.HostAuthority.ModelAdmissionRoot.SHA256 == matrix.ModelAdmissionRoot.SHA256 &&
		entry.Model.Manifest.FileName == matrix.ModelManifest.FileName && entry.Model.Manifest.SizeBytes == admitted.SizeBytes && entry.Model.Manifest.SHA256 == matrix.ModelManifest.SHA256 && validLocatedFile(entry.Model.Manifest) &&
		entry.Model.ModelAssetID == matrix.ModelAssetID && entry.Model.Revision == admitted.Revision && entry.Model.LayoutID == admitted.LayoutID && entry.Model.ModelTreeSHA256 == admitted.ModelTreeSHA256 && entry.Model.TotalSizeBytes == admitted.TotalSizeBytes &&
		admission.ProfileID == matrix.ProfileID && admission.LanguageMode == matrix.LanguageMode && admission.Target.Platform == matrix.Platform && admission.Target.Architecture == matrix.Architecture && admission.ProviderID == matrix.ProviderID && admission.CapabilityDigest == matrix.CapabilityDigest && admission.HostPackageID == matrix.HostPackageID && admission.CompatibilityRequirement.SHA256 == matrix.CompatibilityRequirementSHA256 && admitted.ManifestFileName == matrix.ModelManifest.FileName && admitted.SHA256 == matrix.ModelManifest.SHA256 && admitted.ModelAssetID == matrix.ModelAssetID
}

func selectedCatalogRowMatchesHost(entry catalogcontract.Entry, authority HostAuthority) bool {
	admitted := authority.Admission.AdmittedModels[0]
	profile := authority.Descriptor.Profiles
	return entry.ProfileID == authority.Admission.ProfileID &&
		entry.LanguageMode == authority.Admission.LanguageMode &&
		reflect.DeepEqual(entry.Target, authority.Admission.Target) &&
		authority.Descriptor.PackageVersion == currentReleaseVersion &&
		reflect.DeepEqual(entry.Target, authority.Descriptor.Target) &&
		entry.ProviderID == authority.Descriptor.ProviderID && entry.ProviderID == authority.Admission.ProviderID &&
		len(profile) == 1 && profile[0].ProfileID == entry.ProfileID && profile[0].LanguageMode == entry.LanguageMode && profile[0].CapabilityDigest == entry.CapabilityDigest &&
		entry.ModelID == authority.Compatibility.Model.ModelID && authority.Compatibility.ProfileID == entry.ProfileID && authority.Compatibility.LanguageMode == entry.LanguageMode && reflect.DeepEqual(entry.Target, authority.Compatibility.Target) &&
		entry.CapabilityDigest == authority.Admission.CapabilityDigest && entry.CapabilityDigest == authority.Compatibility.CapabilityDigest &&
		entry.Host.HostPackageID == authority.Descriptor.HostPackageID && entry.Host.HostPackageID == authority.Admission.HostPackageID &&
		entry.Host.DescriptorSHA256 == authority.DescriptorSHA256 && entry.Host.FileManifestSHA256 == authority.FileManifestSHA256 && entry.Host.CompatibilityRequirementSHA256 == authority.CompatibilitySHA256 &&
		entry.Host.LauncherPath == authority.Descriptor.Launcher && entry.Host.ModelManagerPath == authority.Descriptor.ModelManager &&
		entry.HostAuthority.HostSourceClosure.SizeBytes == int64(len(authority.HostSourceClosureBytes)) && entry.HostAuthority.HostSourceClosure.SHA256 == authority.Descriptor.HostSourceClosure.SHA256 &&
		entry.HostAuthority.ModelAdmissionRoot.SizeBytes > 0 && entry.HostAuthority.ModelAdmissionRoot.SHA256 == authority.AdmissionSHA256 &&
		entry.Model.Manifest.FileName == admitted.ManifestFileName && entry.Model.Manifest.SizeBytes == admitted.SizeBytes && entry.Model.Manifest.SHA256 == admitted.SHA256 &&
		entry.Model.ModelAssetID == admitted.ModelAssetID && entry.Model.Revision == admitted.Revision && entry.Model.LayoutID == admitted.LayoutID && entry.Model.ModelTreeSHA256 == admitted.ModelTreeSHA256 && entry.Model.TotalSizeBytes == admitted.TotalSizeBytes
}

func validFile(file catalogcontract.FileIdentity) bool {
	return catalogNamePattern.MatchString(file.FileName) && file.SizeBytes > 0 && validDigest(file.SHA256)
}

func validLocatedFile(file catalogcontract.LocatedFileIdentity) bool {
	return validFile(file.FileIdentity) && file.URL != ""
}

func validDigest(value string) bool { return catalogDigestPattern.MatchString(value) }

func exactAssetBase(rawURL, fileName string) (string, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme != "https" || parsed.Host == "" || parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" || parsed.RawPath != "" {
		return "", errors.New("invalid catalog asset URL")
	}
	suffix := path.Join("v"+currentReleaseVersion, fileName)
	if !strings.HasSuffix(parsed.Path, "/"+suffix) {
		return "", errors.New("catalog asset URL does not match release subject")
	}
	return parsed.Scheme + "://" + parsed.Host + strings.TrimSuffix(parsed.Path, suffix), nil
}
