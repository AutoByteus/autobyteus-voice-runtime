package modelcontract

import (
	_ "embed"
	"encoding/json"
	"errors"
)

//go:embed admission/english-darwin-arm64-v1.json
var englishAdmissionBytes []byte

//go:embed admission/chinese-darwin-arm64-v1.json
var chineseAdmissionBytes []byte

func CurrentAdmission(profile string) (AdmissionRoot, []byte, error) {
	var source []byte
	switch profile {
	case "english":
		source = englishAdmissionBytes
	case "chinese":
		source = chineseAdmissionBytes
	default:
		return AdmissionRoot{}, nil, errors.New("invalid current profile")
	}
	var admission AdmissionRoot
	if err := json.Unmarshal(source, &admission); err != nil {
		return AdmissionRoot{}, nil, err
	}
	if admission.SchemaVersion != 1 || admission.AuthorityVersion != 1 || admission.ProfileID != profile || len(admission.AdmittedModels) != 1 {
		return AdmissionRoot{}, nil, errors.New("invalid embedded model admission")
	}
	return admission, append([]byte(nil), source...), nil
}
