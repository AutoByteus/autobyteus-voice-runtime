package modelcontract

type Target struct {
	Platform     string `json:"platform"`
	Architecture string `json:"architecture"`
}

type FileIdentity struct {
	Path      string `json:"path"`
	Role      string `json:"role"`
	SizeBytes int64  `json:"sizeBytes"`
	SHA256    string `json:"sha256"`
	Mode      string `json:"mode"`
}

type RequiredFile struct {
	Path string `json:"path"`
	Role string `json:"role"`
}

type CompatibilityRequirement struct {
	SchemaVersion                      int            `json:"schemaVersion"`
	ProviderID                         string         `json:"providerId"`
	ProfileID                          string         `json:"profileId"`
	LanguageMode                       string         `json:"languageMode"`
	Target                             Target         `json:"target"`
	Engine                             EngineIdentity `json:"engine"`
	AcceptedModelManifestSchemaVersion int            `json:"acceptedModelManifestSchemaVersion"`
	Model                              ModelIdentity  `json:"model"`
	RequiredFiles                      []RequiredFile `json:"requiredFiles"`
	CapabilityDigest                   string         `json:"capabilityDigest"`
	ModelTreeAlgorithm                 string         `json:"modelTreeAlgorithm"`
}

type EngineIdentity struct {
	Kind                string `json:"kind"`
	Version             string `json:"version"`
	ConfigurationSHA256 string `json:"configurationSha256"`
}

type ModelIdentity struct {
	ModelID   string `json:"modelId"`
	Family    string `json:"family"`
	Size      string `json:"size"`
	Precision string `json:"precision"`
	LayoutID  string `json:"layoutId"`
}

type ManifestFile struct {
	Path      string `json:"path"`
	Role      string `json:"role"`
	URL       string `json:"url"`
	SizeBytes int64  `json:"sizeBytes"`
	SHA256    string `json:"sha256"`
	Mode      string `json:"mode"`
	Revision  string `json:"revision"`
}

type CompatibleHost struct {
	ProviderID                     string `json:"providerId"`
	Platform                       string `json:"platform"`
	Architecture                   string `json:"architecture"`
	EngineKind                     string `json:"engineKind"`
	EngineVersion                  string `json:"engineVersion"`
	EngineConfigurationSHA256      string `json:"engineConfigurationSha256"`
	CompatibilityRequirementSHA256 string `json:"compatibilityRequirementSha256"`
}

type DownloadPolicy struct {
	InitialOrigin              string `json:"initialOrigin"`
	HTTPSOnly                  bool   `json:"httpsOnly"`
	PublicNetworkRedirectsOnly bool   `json:"publicNetworkRedirectsOnly"`
	MaxRedirects               int    `json:"maxRedirects"`
	ConnectTimeoutMS           int    `json:"connectTimeoutMs"`
	ReadIdleTimeoutMS          int    `json:"readIdleTimeoutMs"`
	OverallFileTimeoutMS       int    `json:"overallFileTimeoutMs"`
	Resume                     string `json:"resume"`
}

type NoticeIdentity struct {
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
}

type LicenseIdentity struct {
	Repository string `json:"repository"`
	Revision   string `json:"revision"`
	Identity   string `json:"identity"`
}

type AssetManifest struct {
	SchemaVersion   int              `json:"schemaVersion"`
	ModelAssetID    string           `json:"modelAssetId"`
	ModelID         string           `json:"modelId"`
	Family          string           `json:"family"`
	Size            string           `json:"size"`
	Precision       string           `json:"precision"`
	Revision        string           `json:"revision"`
	LayoutID        string           `json:"layoutId"`
	Files           []ManifestFile   `json:"files"`
	TotalSizeBytes  int64            `json:"totalSizeBytes"`
	ModelTreeSHA256 string           `json:"modelTreeSha256"`
	CompatibleHosts []CompatibleHost `json:"compatibleHosts"`
	DownloadPolicy  DownloadPolicy   `json:"downloadPolicy"`
	Notice          NoticeIdentity   `json:"notice"`
	License         LicenseIdentity  `json:"license"`
}

type AdmissionFile struct {
	ManifestFileName string `json:"manifestFileName"`
	SizeBytes        int64  `json:"sizeBytes"`
	SHA256           string `json:"sha256"`
	ModelAssetID     string `json:"modelAssetId"`
	Revision         string `json:"revision"`
	LayoutID         string `json:"layoutId"`
	ModelTreeSHA256  string `json:"modelTreeSha256"`
	TotalSizeBytes   int64  `json:"totalSizeBytes"`
}

type AdmissionRoot struct {
	SchemaVersion            int    `json:"schemaVersion"`
	AuthorityVersion         int    `json:"authorityVersion"`
	ProfileID                string `json:"profileId"`
	LanguageMode             string `json:"languageMode"`
	Target                   Target `json:"target"`
	ProviderID               string `json:"providerId"`
	EngineKind               string `json:"engineKind"`
	CapabilityDigest         string `json:"capabilityDigest"`
	HostPackageID            string `json:"hostPackageId"`
	CompatibilityRequirement struct {
		FileName string `json:"fileName"`
		SHA256   string `json:"sha256"`
	} `json:"compatibilityRequirement"`
	AdmittedModels []AdmissionFile `json:"admittedModels"`
	Notice         struct {
		FileName  string `json:"fileName"`
		SizeBytes int64  `json:"sizeBytes"`
		SHA256    string `json:"sha256"`
	} `json:"notice"`
	UpdatePolicy string `json:"updatePolicy"`
}
