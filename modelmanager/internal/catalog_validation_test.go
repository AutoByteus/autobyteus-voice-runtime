package modelmanager

import (
	"reflect"
	"strings"
	"testing"

	catalogcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/catalog"
	hostcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/host"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
	"github.com/AutoByteus/autobyteus-voice-runtime/internal/contractjson"
)

func TestCurrentCatalogValidatesCompleteOrderedSubject(t *testing.T) {
	catalog, authorities := currentCatalogFixture(t)
	if _, err := validateCurrentCatalog(catalog, authorities["english"], "english"); err != nil {
		t.Fatal(err)
	}
	if _, err := validateCurrentCatalog(catalog, authorities["chinese"], "chinese"); err != nil {
		t.Fatal(err)
	}

	tests := map[string]func(*catalogcontract.Catalog){
		"order": func(value *catalogcontract.Catalog) {
			value.Entries[0], value.Entries[1] = value.Entries[1], value.Entries[0]
		},
		"non-selected provider": func(value *catalogcontract.Catalog) { value.Entries[1].ProviderID = "wrong" },
		"selected language":     func(value *catalogcontract.Catalog) { value.Entries[0].LanguageMode = "zh" },
		"selected target":       func(value *catalogcontract.Catalog) { value.Entries[0].Target.Architecture = "x64" },
		"selected model":        func(value *catalogcontract.Catalog) { value.Entries[0].ModelID = "wrong" },
		"selected capability":   func(value *catalogcontract.Catalog) { value.Entries[0].CapabilityDigest = strings.Repeat("f", 64) },
		"selected support":      func(value *catalogcontract.Catalog) { value.Entries[0].SupportStatement = "other" },
		"selected host locator": func(value *catalogcontract.Catalog) {
			value.Entries[0].Host.Archive.URL = "https://other.invalid/wrong.zip"
		},
		"selected model locator": func(value *catalogcontract.Catalog) { value.Entries[0].Model.Manifest.FileName = "wrong.json" },
		"release":                func(value *catalogcontract.Catalog) { value.ReleaseVersion = "1.0.1" },
	}
	for name, mutate := range tests {
		t.Run(name, func(t *testing.T) {
			changed := catalog
			changed.Entries = append([]catalogcontract.Entry(nil), catalog.Entries...)
			mutate(&changed)
			if _, err := validateCurrentCatalog(changed, authorities["english"], "english"); err == nil {
				t.Fatal("drifted Catalog 4 accepted")
			}
		})
	}

	t.Run("selected host authority", func(t *testing.T) {
		authority := authorities["english"]
		authority.Descriptor.PackageVersion = "1.0.1"
		if _, err := validateCurrentCatalog(catalog, authority, "english"); err == nil {
			t.Fatal("drifted selected host authority accepted")
		}
	})
}

func currentCatalogFixture(t *testing.T) (catalogcontract.Catalog, map[string]HostAuthority) {
	t.Helper()
	matrix, err := catalogcontract.CurrentMatrix()
	if err != nil {
		t.Fatal(err)
	}
	digestA, digestB, digestC := strings.Repeat("a", 64), strings.Repeat("b", 64), strings.Repeat("c", 64)
	catalog := catalogcontract.Catalog{SchemaVersion: 4, CatalogID: "voice-runtime-catalog-v4", ReleaseVersion: currentReleaseVersion}
	authorities := map[string]HostAuthority{}
	for _, matrixEntry := range matrix.Entries {
		admission, admissionBytes, err := modelcontract.CurrentAdmission(matrixEntry.ProfileID)
		if err != nil {
			t.Fatal(err)
		}
		admitted := admission.AdmittedModels[0]
		var entry catalogcontract.Entry
		entry.ProfileID, entry.LanguageMode = matrixEntry.ProfileID, matrixEntry.LanguageMode
		entry.Target = modelcontract.Target{Platform: matrixEntry.Platform, Architecture: matrixEntry.Architecture}
		entry.ProviderID, entry.ModelID, entry.CapabilityDigest = matrixEntry.ProviderID, matrixEntry.ModelID, matrixEntry.CapabilityDigest
		entry.Host.Archive = catalogcontract.LocatedFileIdentity{FileIdentity: catalogcontract.FileIdentity{FileName: "voice-host-" + matrixEntry.ProfileID + "-darwin-arm64-1.0.0.zip", SizeBytes: 100, SHA256: digestA}, URL: "https://cdn.example/v1.0.0/voice-host-" + matrixEntry.ProfileID + "-darwin-arm64-1.0.0.zip"}
		entry.Host.HostPackageID, entry.Host.DescriptorSHA256, entry.Host.FileManifestSHA256 = matrixEntry.HostPackageID, digestB, digestC
		entry.Host.CompatibilityRequirementSHA256 = matrixEntry.CompatibilityRequirementSHA256
		entry.Host.LauncherPath, entry.Host.ModelManagerPath = "bin/voice-provider", "bin/voice-model-manager"
		entry.HostAuthority.HostSourceClosure = catalogcontract.FileIdentity{FileName: "host-source-closure-v1.json", SizeBytes: 7, SHA256: digestA}
		entry.HostAuthority.ModelAdmissionRoot = catalogcontract.FileIdentity{FileName: "model-admission-root-v1.json", SizeBytes: int64(len(admissionBytes)), SHA256: matrixEntry.ModelAdmissionRoot.SHA256}
		entry.Model.Manifest = catalogcontract.LocatedFileIdentity{FileIdentity: catalogcontract.FileIdentity{FileName: matrixEntry.ModelManifest.FileName, SizeBytes: admitted.SizeBytes, SHA256: admitted.SHA256}, URL: "https://cdn.example/v1.0.0/" + matrixEntry.ModelManifest.FileName}
		entry.Model.ModelAssetID, entry.Model.Revision, entry.Model.LayoutID = admitted.ModelAssetID, admitted.Revision, admitted.LayoutID
		entry.Model.ModelTreeSHA256, entry.Model.TotalSizeBytes = admitted.ModelTreeSHA256, admitted.TotalSizeBytes
		entry.SupportStatement = "macOS Apple Silicon only"
		pairBytes, _ := contractjson.Canonical(compatibilityPair{entry.Host.HostPackageID, entry.Host.DescriptorSHA256, entry.Host.CompatibilityRequirementSHA256, entry.Model.Manifest.SHA256, entry.CapabilityDigest})
		entry.CompatibilityPairSHA256 = contractjson.Digest(pairBytes)
		catalog.Entries = append(catalog.Entries, entry)

		descriptor := hostcontract.Descriptor{SchemaVersion: 2, HostPackageID: matrixEntry.HostPackageID, PackageVersion: currentReleaseVersion, ProviderID: matrixEntry.ProviderID, Target: entry.Target, Launcher: "bin/voice-provider", ModelManager: "bin/voice-model-manager", Profiles: []hostcontract.ProfileIdentity{{ProfileID: matrixEntry.ProfileID, LanguageMode: matrixEntry.LanguageMode, CapabilityDigest: matrixEntry.CapabilityDigest}}, HostSourceClosure: hostcontract.PathIdentity{Path: "provider/host-source-closure-v1.json", SHA256: digestA}}
		compatibility := modelcontract.CompatibilityRequirement{SchemaVersion: 1, ProviderID: matrixEntry.ProviderID, ProfileID: matrixEntry.ProfileID, LanguageMode: matrixEntry.LanguageMode, Target: entry.Target, Model: modelcontract.ModelIdentity{ModelID: matrixEntry.ModelID}, CapabilityDigest: matrixEntry.CapabilityDigest}
		authorities[matrixEntry.ProfileID] = HostAuthority{Descriptor: descriptor, DescriptorSHA256: digestB, FileManifestSHA256: digestC, HostSourceClosureBytes: []byte("closure"), Admission: admission, AdmissionSHA256: matrixEntry.ModelAdmissionRoot.SHA256, Compatibility: compatibility, CompatibilitySHA256: matrixEntry.CompatibilityRequirementSHA256}
	}
	if !reflect.DeepEqual([]string{catalog.Entries[0].ProfileID, catalog.Entries[1].ProfileID}, []string{"english", "chinese"}) {
		t.Fatal("fixture did not preserve current matrix order")
	}
	return catalog, authorities
}
