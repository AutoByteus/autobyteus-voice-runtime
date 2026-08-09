package launcher

import (
	"bytes"
	"errors"
	"reflect"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
	"github.com/AutoByteus/autobyteus-voice-runtime/hostverify"
	"github.com/AutoByteus/autobyteus-voice-runtime/integrity"
	"github.com/AutoByteus/autobyteus-voice-runtime/internal/contractjson"
	"github.com/AutoByteus/autobyteus-voice-runtime/modelstore"
)

var (
	embeddedHostPackageID                  = "UNSET"
	embeddedHostSourceClosureSHA256        = "UNSET"
	embeddedModelAdmissionRootSHA256       = "UNSET"
	embeddedCompatibilityRequirementSHA256 = "UNSET"
)

func bindSession(root string, config SessionConfig, plan LauncherPlan) (BoundSession, *modelstore.Lease, error) {
	expected := hostverify.Expected{HostPackageID: embeddedHostPackageID, HostSourceClosureSHA256: embeddedHostSourceClosureSHA256, ModelAdmissionRootSHA256: embeddedModelAdmissionRootSHA256, CompatibilityRequirementSHA256: embeddedCompatibilityRequirementSHA256}
	authority, err := hostverify.Verify(root, expected)
	if err != nil {
		return BoundSession{}, nil, err
	}
	e := config.Expected
	if plan.HostPackageID != authority.Descriptor.HostPackageID || plan.Target != authority.Descriptor.Target || e.HostPackageID != authority.Descriptor.HostPackageID || e.ProviderID != authority.Descriptor.ProviderID || e.DescriptorSHA256 != authority.DescriptorSHA256 || e.FileManifestSHA256 != authority.FileManifestSHA256 || e.HostSourceClosureSHA256 != authority.Descriptor.HostSourceClosure.SHA256 || e.ModelAdmissionRootSHA256 != authority.AdmissionSHA256 || e.ModelManifestSHA256 != authority.Admission.AdmittedModels[0].SHA256 || e.ModelTreeSHA256 != authority.Admission.AdmittedModels[0].ModelTreeSHA256 || e.CapabilityDigest != authority.Admission.CapabilityDigest || config.ProfileID != authority.Admission.ProfileID || e.ModelID != authority.Compatibility.Model.ModelID {
		return BoundSession{}, nil, errors.New("session host identity mismatch")
	}
	store, err := modelstore.OpenReadOnly(config.InstallationRoot)
	if err != nil {
		return BoundSession{}, nil, err
	}
	first, err := store.Snapshot(config.ProfileID)
	if err != nil || first.State != modelstore.SnapshotActive {
		return BoundSession{}, nil, errors.New("activation unavailable")
	}
	if first.Pointer.InstallationID != config.InstallationID || first.Pointer.ActivationSHA256 != config.ActivationSHA256 || first.Pointer.CompatibilityPairSHA256 != e.CompatibilityPairSHA256 || !activationExpected(first.Activation, config) {
		return BoundSession{}, nil, errors.New("stale activation config")
	}
	lease, err := store.AcquireInstallationShared(config.InstallationID)
	if err != nil {
		return BoundSession{}, nil, errors.New("activation-busy")
	}
	second, err := store.Snapshot(config.ProfileID)
	if err != nil || second.State != modelstore.SnapshotActive || !bytes.Equal(first.PointerBytes, second.PointerBytes) || !bytes.Equal(first.ActivationBytes, second.ActivationBytes) {
		lease.Close()
		return BoundSession{}, nil, errors.New("activation changed")
	}
	if err := store.VerifyModel(second.Activation.Model.ModelAssetID, second.Activation.Model.ManifestSHA256, second.Activation.Model.Files); err != nil {
		lease.Close()
		return BoundSession{}, nil, err
	}
	manifestBytes, noticeBytes, err := store.ReadModelAuthority(second.Activation.Model.ModelAssetID, second.Activation.Model.ManifestSHA256)
	if err != nil || contractjson.Digest(manifestBytes) != e.ModelManifestSHA256 || contractjson.Digest(noticeBytes) != authority.Admission.Notice.SHA256 {
		lease.Close()
		return BoundSession{}, nil, errors.New("model authority mismatch")
	}
	var manifest modelcontract.AssetManifest
	if contractjson.Decode(manifestBytes, &manifest) != nil || integrity.ValidateManifest(manifest) != nil || integrity.ValidateCompatibility(authority.Compatibility, manifest, authority.CompatibilitySHA256) != nil || manifest.ModelTreeSHA256 != e.ModelTreeSHA256 || !reflect.DeepEqual(second.Activation.Model.Files, manifestFiles(manifest)) {
		lease.Close()
		return BoundSession{}, nil, errors.New("model compatibility mismatch")
	}
	modelRoot, err := store.ModelRoot(second.Activation.Model.ModelAssetID, second.Activation.Model.ManifestSHA256)
	if err != nil {
		lease.Close()
		return BoundSession{}, nil, err
	}
	activationPath, err := store.ActivationPath(config.InstallationID)
	if err != nil {
		lease.Close()
		return BoundSession{}, nil, err
	}
	if err := lease.PrepareForExec(); err != nil {
		lease.Close()
		return BoundSession{}, nil, err
	}
	if lease.FD() <= 2 {
		lease.Close()
		return BoundSession{}, nil, errors.New("lease descriptor collision")
	}
	return BoundSession{Config: config, Activation: second.Activation, ActivationPath: activationPath, ModelRoot: modelRoot, LeaseFD: lease.FD()}, lease, nil
}

func manifestFiles(manifest modelcontract.AssetManifest) []modelcontract.FileIdentity {
	files := make([]modelcontract.FileIdentity, len(manifest.Files))
	for index, file := range manifest.Files {
		files[index] = modelcontract.FileIdentity{Path: file.Path, Role: file.Role, SizeBytes: file.SizeBytes, SHA256: file.SHA256, Mode: file.Mode}
	}
	return files
}

func activationExpected(record installcontractActivation, config SessionConfig) bool {
	e := config.Expected
	return record.InstallationID == config.InstallationID && record.ProfileID == config.ProfileID && record.LanguageMode == e.LanguageMode && record.Target.Platform == e.Platform && record.Target.Architecture == e.Architecture && record.Host.HostPackageID == e.HostPackageID && record.Host.ProviderID == e.ProviderID && record.Host.DescriptorSHA256 == e.DescriptorSHA256 && record.Host.FileManifestSHA256 == e.FileManifestSHA256 && record.Host.HostSourceClosureSHA256 == e.HostSourceClosureSHA256 && record.Host.ModelAdmissionRootSHA256 == e.ModelAdmissionRootSHA256 && record.Model.ModelID == e.ModelID && record.Model.ManifestSHA256 == e.ModelManifestSHA256 && record.Model.TreeSHA256 == e.ModelTreeSHA256 && record.CompatibilityPairSHA256 == e.CompatibilityPairSHA256 && record.CapabilityDigest == e.CapabilityDigest
}

type installcontractActivation = installcontract.ActivationRecord
