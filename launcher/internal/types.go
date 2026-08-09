package launcher

import (
	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
)

type Target = modelcontract.Target

type Invocation struct {
	Kind       string `json:"kind"`
	Executable string `json:"executable"`
	Worker     string `json:"worker,omitempty"`
}

type LauncherPlan struct {
	SchemaVersion int        `json:"schemaVersion"`
	HostPackageID string     `json:"hostPackageId"`
	Target        Target     `json:"target"`
	Invocation    Invocation `json:"invocation"`
}

type SessionExpected struct {
	HostPackageID            string `json:"hostPackageId"`
	ProviderID               string `json:"providerId"`
	ModelID                  string `json:"modelId"`
	LanguageMode             string `json:"languageMode"`
	Platform                 string `json:"platform"`
	Architecture             string `json:"architecture"`
	DescriptorSHA256         string `json:"descriptorSha256"`
	FileManifestSHA256       string `json:"fileManifestSha256"`
	HostSourceClosureSHA256  string `json:"hostSourceClosureSha256"`
	ModelAdmissionRootSHA256 string `json:"modelAdmissionRootSha256"`
	ModelManifestSHA256      string `json:"modelManifestSha256"`
	ModelTreeSHA256          string `json:"modelTreeSha256"`
	CompatibilityPairSHA256  string `json:"compatibilityPairSha256"`
	CapabilityDigest         string `json:"capabilityDigest"`
}

type SessionConfig struct {
	SchemaVersion    int             `json:"schemaVersion"`
	ProtocolVersion  int             `json:"protocolVersion"`
	SessionID        string          `json:"sessionId"`
	ProfileID        string          `json:"profileId"`
	InstallationRoot string          `json:"installationRoot"`
	InstallationID   string          `json:"installationId"`
	ActivationSHA256 string          `json:"activationSha256"`
	Expected         SessionExpected `json:"expected"`
}

type BoundSession struct {
	Config         SessionConfig
	Activation     installcontract.ActivationRecord
	ActivationPath string
	ModelRoot      string
	LeaseFD        uintptr
}
