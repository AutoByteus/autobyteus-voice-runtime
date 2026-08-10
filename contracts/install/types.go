package installcontract

import modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"

type ActivationRecord struct {
	SchemaVersion           int                  `json:"schemaVersion"`
	InstallationID          string               `json:"installationId"`
	ProfileID               string               `json:"profileId"`
	LanguageMode            string               `json:"languageMode"`
	Target                  modelcontract.Target `json:"target"`
	Catalog                 CatalogIdentity      `json:"catalog"`
	Host                    HostIdentity         `json:"host"`
	Model                   ActivatedModel       `json:"model"`
	CompatibilityPairSHA256 string               `json:"compatibilityPairSha256"`
	CapabilityDigest        string               `json:"capabilityDigest"`
	Decision                string               `json:"decision"`
	CreatedAt               string               `json:"createdAt"`
}

type CatalogIdentity struct {
	FileName string `json:"fileName"`
	SHA256   string `json:"sha256"`
}
type HostIdentity struct {
	HostPackageID                  string `json:"hostPackageId"`
	ProviderID                     string `json:"providerId"`
	DescriptorSHA256               string `json:"descriptorSha256"`
	FileManifestSHA256             string `json:"fileManifestSha256"`
	HostSourceClosureSHA256        string `json:"hostSourceClosureSha256"`
	ModelAdmissionRootSHA256       string `json:"modelAdmissionRootSha256"`
	CompatibilityRequirementSHA256 string `json:"compatibilityRequirementSha256"`
}
type ActivatedModel struct {
	ModelAssetID   string                       `json:"modelAssetId"`
	ModelID        string                       `json:"modelId"`
	ManifestSHA256 string                       `json:"manifestSha256"`
	Revision       string                       `json:"revision"`
	LayoutID       string                       `json:"layoutId"`
	TreeSHA256     string                       `json:"treeSha256"`
	Files          []modelcontract.FileIdentity `json:"files"`
}

type ActivePointer struct {
	SchemaVersion           int                  `json:"schemaVersion"`
	ProfileID               string               `json:"profileId"`
	Target                  modelcontract.Target `json:"target"`
	InstallationID          string               `json:"installationId"`
	SelectorGeneration      string               `json:"selectorGeneration"`
	ActivationRelativePath  string               `json:"activationRelativePath"`
	ActivationSHA256        string               `json:"activationSha256"`
	CompatibilityPairSHA256 string               `json:"compatibilityPairSha256"`
	UpdatedAt               string               `json:"updatedAt"`
}

type PartialDownloadRecord struct {
	SchemaVersion  int         `json:"schemaVersion"`
	CatalogSHA256  string      `json:"catalogSha256"`
	ManifestSHA256 string      `json:"manifestSha256"`
	ModelAssetID   string      `json:"modelAssetId"`
	Revision       string      `json:"revision"`
	File           PartialFile `json:"file"`
}
type PartialFile struct {
	Path            string `json:"path"`
	SizeBytes       int64  `json:"sizeBytes"`
	SHA256          string `json:"sha256"`
	URL             string `json:"url"`
	BytesPresent    int64  `json:"bytesPresent"`
	EntityValidator string `json:"entityValidator,omitempty"`
}
