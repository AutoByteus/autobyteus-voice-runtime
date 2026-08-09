package catalogcontract

import modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"

type FileIdentity struct {
	FileName  string `json:"fileName"`
	SizeBytes int64  `json:"sizeBytes"`
	SHA256    string `json:"sha256"`
}

type LocatedFileIdentity struct {
	FileIdentity
	URL string `json:"url"`
}

type Entry struct {
	ProfileID        string               `json:"profileId"`
	LanguageMode     string               `json:"languageMode"`
	Target           modelcontract.Target `json:"target"`
	ProviderID       string               `json:"providerId"`
	ModelID          string               `json:"modelId"`
	CapabilityDigest string               `json:"capabilityDigest"`
	Host             struct {
		Archive                        LocatedFileIdentity `json:"archive"`
		HostPackageID                  string              `json:"hostPackageId"`
		DescriptorSHA256               string              `json:"descriptorSha256"`
		FileManifestSHA256             string              `json:"fileManifestSha256"`
		CompatibilityRequirementSHA256 string              `json:"compatibilityRequirementSha256"`
		LauncherPath                   string              `json:"launcherPath"`
		ModelManagerPath               string              `json:"modelManagerPath"`
	} `json:"host"`
	HostAuthority struct {
		HostSourceClosure  FileIdentity `json:"hostSourceClosure"`
		ModelAdmissionRoot FileIdentity `json:"modelAdmissionRoot"`
	} `json:"hostAuthority"`
	Model struct {
		Manifest        LocatedFileIdentity `json:"manifest"`
		ModelAssetID    string              `json:"modelAssetId"`
		Revision        string              `json:"revision"`
		LayoutID        string              `json:"layoutId"`
		ModelTreeSHA256 string              `json:"modelTreeSha256"`
		TotalSizeBytes  int64               `json:"totalSizeBytes"`
	} `json:"model"`
	CompatibilityPairSHA256 string `json:"compatibilityPairSha256"`
	SupportStatement        string `json:"supportStatement"`
}

type Catalog struct {
	SchemaVersion  int     `json:"schemaVersion"`
	CatalogID      string  `json:"catalogId"`
	ReleaseVersion string  `json:"releaseVersion"`
	Entries        []Entry `json:"entries"`
}
