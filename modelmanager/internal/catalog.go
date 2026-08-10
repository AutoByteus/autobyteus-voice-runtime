package modelmanager

import (
	"errors"
	"os"
	"path/filepath"

	catalogcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/catalog"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
	"github.com/AutoByteus/autobyteus-voice-runtime/integrity"
	"github.com/AutoByteus/autobyteus-voice-runtime/internal/contractjson"
)

type ResolvedProfile struct {
	Catalog                 catalogcontract.Catalog
	CatalogFileName         string
	CatalogSHA256           string
	Entry                   catalogcontract.Entry
	Manifest                modelcontract.AssetManifest
	ManifestBytes           []byte
	ManifestSHA256          string
	NoticeBytes             []byte
	CompatibilityPairSHA256 string
}
type compatibilityPair struct {
	HostPackageID                  string `json:"hostPackageId"`
	DescriptorSHA256               string `json:"descriptorSha256"`
	CompatibilityRequirementSHA256 string `json:"compatibilityRequirementSha256"`
	ModelManifestSHA256            string `json:"modelManifestSha256"`
	CapabilityDigest               string `json:"capabilityDigest"`
}

func ResolveProfile(authority HostAuthority, catalogPath, profile string) (ResolvedProfile, error) {
	if !filepath.IsAbs(catalogPath) {
		return ResolvedProfile{}, errors.New("catalog path must be absolute")
	}
	var catalog catalogcontract.Catalog
	catalogBytes, err := contractjson.Read(catalogPath, &catalog)
	if err != nil {
		return ResolvedProfile{}, errors.New("catalog-invalid")
	}
	entry, err := validateCurrentCatalog(catalog, authority, profile)
	if err != nil {
		return ResolvedProfile{}, err
	}
	admitted := authority.Admission.AdmittedModels[0]
	directory := filepath.Dir(catalogPath)
	manifestPath := filepath.Join(directory, admitted.ManifestFileName)
	noticePath := filepath.Join(directory, authority.Admission.Notice.FileName)
	var manifest modelcontract.AssetManifest
	manifestBytes, err := contractjson.Read(manifestPath, &manifest)
	if err != nil || int64(len(manifestBytes)) != admitted.SizeBytes || contractjson.Digest(manifestBytes) != admitted.SHA256 {
		return ResolvedProfile{}, errors.New("catalog-unadmitted")
	}
	if err := integrity.ValidateManifest(manifest); err != nil {
		return ResolvedProfile{}, errors.New("catalog-invalid")
	}
	if err := integrity.ValidateCompatibility(authority.Compatibility, manifest, authority.CompatibilitySHA256); err != nil {
		return ResolvedProfile{}, errors.New("host-incompatible")
	}
	noticeBytes, err := os.ReadFile(noticePath)
	if err != nil || int64(len(noticeBytes)) != authority.Admission.Notice.SizeBytes || contractjson.Digest(noticeBytes) != authority.Admission.Notice.SHA256 || manifest.Notice.SHA256 != authority.Admission.Notice.SHA256 {
		return ResolvedProfile{}, errors.New("catalog-unadmitted")
	}
	pairBytes, _ := contractjson.Canonical(compatibilityPair{authority.Descriptor.HostPackageID, authority.DescriptorSHA256, authority.CompatibilitySHA256, admitted.SHA256, authority.Admission.CapabilityDigest})
	pairSHA := contractjson.Digest(pairBytes)
	if entry.CompatibilityPairSHA256 != pairSHA {
		return ResolvedProfile{}, errors.New("host-incompatible")
	}
	return ResolvedProfile{Catalog: catalog, CatalogFileName: filepath.Base(catalogPath), CatalogSHA256: contractjson.Digest(catalogBytes), Entry: *entry, Manifest: manifest, ManifestBytes: manifestBytes, ManifestSHA256: admitted.SHA256, NoticeBytes: noticeBytes, CompatibilityPairSHA256: pairSHA}, nil
}
