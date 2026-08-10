package hostcontract

import modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"

type FileRecord struct {
	Path      string `json:"path"`
	SHA256    string `json:"sha256"`
	SizeBytes int64  `json:"sizeBytes"`
	Mode      string `json:"mode"`
}

type FileManifest struct {
	SchemaVersion int          `json:"schemaVersion"`
	HostPackageID string       `json:"hostPackageId"`
	Files         []FileRecord `json:"files"`
}

type Descriptor struct {
	SchemaVersion                  int                  `json:"schemaVersion"`
	HostPackageID                  string               `json:"hostPackageId"`
	PackageVersion                 string               `json:"packageVersion"`
	ProviderID                     string               `json:"providerId"`
	Target                         modelcontract.Target `json:"target"`
	ProtocolVersion                int                  `json:"protocolVersion"`
	SessionConfigVersion           int                  `json:"sessionConfigVersion"`
	ModelInstallationEventsVersion int                  `json:"modelInstallationEventsVersion"`
	Launcher                       string               `json:"launcher"`
	ModelManager                   string               `json:"modelManager"`
	LauncherPlan                   PathIdentity         `json:"launcherPlan"`
	Host                           HostIdentity         `json:"host"`
	Worker                         WorkerIdentity       `json:"worker"`
	Engine                         EngineIdentity       `json:"engine"`
	Profiles                       []ProfileIdentity    `json:"profiles"`
	AudioContract                  string               `json:"audioContract"`
	HostSourceClosure              PathIdentity         `json:"hostSourceClosure"`
	ModelAdmissionRoot             PathIdentity         `json:"modelAdmissionRoot"`
	ModelCompatibilityRequirement  PathIdentity         `json:"modelCompatibilityRequirement"`
	FileManifestPath               string               `json:"fileManifestPath"`
	NoticeInventoryPath            string               `json:"noticeInventoryPath"`
}

type PathIdentity struct {
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
}
type HostIdentity struct {
	Kind       string `json:"kind"`
	Version    string `json:"version"`
	Executable string `json:"executable"`
	SHA256     string `json:"sha256"`
}
type WorkerIdentity struct {
	Entrypoint string `json:"entrypoint"`
	SHA256     string `json:"sha256"`
}
type EngineIdentity struct {
	Kind          string       `json:"kind"`
	Version       string       `json:"version"`
	Configuration PathIdentity `json:"configuration"`
}
type ProfileIdentity struct {
	ProfileID            string `json:"profileId"`
	LanguageMode         string `json:"languageMode"`
	NormalizationProfile string `json:"normalizationProfile"`
	CapabilityDigest     string `json:"capabilityDigest"`
}
