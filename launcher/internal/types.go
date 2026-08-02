package launcher

type Target struct {
	Platform     string `json:"platform"`
	Architecture string `json:"architecture"`
}

type Invocation struct {
	Kind       string `json:"kind"`
	Executable string `json:"executable"`
	Worker     string `json:"worker,omitempty"`
}

type LauncherPlan struct {
	SchemaVersion int        `json:"schemaVersion"`
	PackageID     string     `json:"packageId"`
	Target        Target     `json:"target"`
	Invocation    Invocation `json:"invocation"`
}

type SessionExpected struct {
	PackageID          string `json:"packageId"`
	ProviderID         string `json:"providerId"`
	ModelID            string `json:"modelId"`
	LanguageMode       string `json:"languageMode"`
	Platform           string `json:"platform"`
	Architecture       string `json:"architecture"`
	DescriptorSHA256   string `json:"descriptorSha256"`
	FileManifestSHA256 string `json:"fileManifestSha256"`
	CapabilityDigest   string `json:"capabilityDigest"`
}

type SessionConfig struct {
	SchemaVersion   int             `json:"schemaVersion"`
	ProtocolVersion int             `json:"protocolVersion"`
	SessionID       string          `json:"sessionId"`
	ProfileID       string          `json:"profileId"`
	Expected        SessionExpected `json:"expected"`
}

type FileRecord struct {
	Path      string `json:"path"`
	SHA256    string `json:"sha256"`
	SizeBytes int64  `json:"sizeBytes"`
	Mode      string `json:"mode"`
}

type FileManifest struct {
	SchemaVersion int          `json:"schemaVersion"`
	PackageID     string       `json:"packageId"`
	Files         []FileRecord `json:"files"`
}
