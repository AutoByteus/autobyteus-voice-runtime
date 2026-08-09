package catalogcontract

import (
	_ "embed"
	"encoding/json"
	"errors"
)

type MatrixFileIdentity struct {
	FileName string `json:"fileName"`
	SHA256   string `json:"sha256"`
}

type MatrixEntry struct {
	ProfileID                      string             `json:"profileId"`
	LanguageMode                   string             `json:"languageMode"`
	Platform                       string             `json:"platform"`
	Architecture                   string             `json:"architecture"`
	ProviderID                     string             `json:"providerId"`
	ModelID                        string             `json:"modelId"`
	CandidateDecision              string             `json:"candidateDecision"`
	HostPackageID                  string             `json:"hostPackageId"`
	HostRecipeFileName             string             `json:"hostRecipeFileName"`
	ModelAdmissionRoot             MatrixFileIdentity `json:"modelAdmissionRoot"`
	ModelAssetID                   string             `json:"modelAssetId"`
	ModelManifest                  MatrixFileIdentity `json:"modelManifest"`
	CompatibilityRequirementSHA256 string             `json:"compatibilityRequirementSha256"`
	CapabilityDigest               string             `json:"capabilityDigest"`
}

type CurrentReleaseMatrix struct {
	SchemaVersion         int           `json:"schemaVersion"`
	MatrixID              string        `json:"matrixId"`
	SupportStatement      string        `json:"supportStatement"`
	Entries               []MatrixEntry `json:"entries"`
	ProfileResourcePolicy struct {
		PolicyID string `json:"policyId"`
		FileName string `json:"fileName"`
		SHA256   string `json:"sha256"`
	} `json:"profileResourcePolicy"`
}

//go:embed current-release-matrix-v2.json
var currentReleaseMatrixBytes []byte

func CurrentMatrix() (CurrentReleaseMatrix, error) {
	var matrix CurrentReleaseMatrix
	if err := json.Unmarshal(currentReleaseMatrixBytes, &matrix); err != nil {
		return CurrentReleaseMatrix{}, err
	}
	if matrix.SchemaVersion != 2 || matrix.MatrixID != "voice-runtime-darwin-arm64-v2" || matrix.SupportStatement != "macOS Apple Silicon only" || len(matrix.Entries) != 2 || matrix.Entries[0].ProfileID != "english" || matrix.Entries[1].ProfileID != "chinese" {
		return CurrentReleaseMatrix{}, errors.New("invalid embedded current matrix")
	}
	return matrix, nil
}
