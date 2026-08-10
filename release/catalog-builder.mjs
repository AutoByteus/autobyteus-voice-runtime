#!/usr/bin/env node
import path from "node:path";
import { parsePairs, ROOT, sha256 } from "../build/lib/files.mjs";
import { loadCurrentReleaseMatrix } from "./current-release-matrix.mjs";
import {
  ordinaryFileIdentity,
  readValidated,
  RELEASE_VERSION,
  writeArtifact,
} from "./release-contract.mjs";

export async function buildReleaseCatalog({
  releaseEvidence,
  baseUrl,
  output,
}) {
  if (!/^https:\/\/[^?#]+$/.test(baseUrl))
    throw new Error(
      "Catalog base URL must be fixed HTTPS without query/fragment.",
    );
  const evidence = await readValidated(
      releaseEvidence,
      "contracts/release/release-qualification-evidence-v4.schema.json",
      "Release Qualification Evidence 4",
    ),
    matrix = await loadCurrentReleaseMatrix(),
    entries = [];
  if (
    evidence.decision !== "pass" ||
    evidence.runtimeVersion !== RELEASE_VERSION
  )
    throw new Error("Catalog 4 requires passing exact release evidence.");
  for (const matrixEntry of matrix.value.entries) {
    const profile = evidence.profiles.find(
      (item) => item.profileId === matrixEntry.profileId,
    );
    if (
      !profile ||
      profile.modelManifest.sha256 !== matrixEntry.modelManifest.sha256 ||
      profile.modelAdmissionRootSha256 !== matrixEntry.modelAdmissionRoot.sha256
    )
      throw new Error("Catalog 4 matrix/evidence profile mismatch.");
    const manifestPath = path.join(
        ROOT,
        "release/model-manifests",
        matrixEntry.modelManifest.fileName,
      ),
      admissionPath = path.join(
        ROOT,
        "contracts/model/admission",
        matrixEntry.modelAdmissionRoot.fileName,
      ),
      compatibilityPath = path.join(
        ROOT,
        "contracts/model/compatibility",
        `${matrixEntry.profileId}-darwin-arm64-v1.json`,
      ),
      manifest = await readValidated(
        manifestPath,
        "contracts/model/model-asset-manifest-v1.schema.json",
        "Model Asset Manifest 1",
      ),
      admission = await readValidated(
        admissionPath,
        "contracts/model/model-admission-root-v1.schema.json",
        "Model Admission Root 1",
      ),
      compatibility = await readValidated(
        compatibilityPath,
        "contracts/model/model-compatibility-requirement-v1.schema.json",
        "Model Compatibility Requirement 1",
      ),
      manifestIdentity = await ordinaryFileIdentity(manifestPath),
      admissionIdentity = await ordinaryFileIdentity(
        admissionPath,
        "model-admission-root-v1.json",
      ),
      compatibilityIdentity = await ordinaryFileIdentity(
        compatibilityPath,
        "model-compatibility-requirement-v1.json",
      ),
      admittedModel = admission.admittedModels[0],
      pair = {
        hostPackageId: matrixEntry.hostPackageId,
        descriptorSha256: profile.hostDescriptorSha256,
        compatibilityRequirementSha256:
          matrixEntry.compatibilityRequirementSha256,
        modelManifestSha256: profile.modelManifest.sha256,
        capabilityDigest: matrixEntry.capabilityDigest,
      },
      pairSha256 = sha256(Buffer.from(`${JSON.stringify(pair, null, 2)}\n`));
    if (
      admissionIdentity.sha256 !== profile.modelAdmissionRootSha256 ||
      admissionIdentity.sha256 !== matrixEntry.modelAdmissionRoot.sha256 ||
      manifestIdentity.sha256 !== matrixEntry.modelManifest.sha256 ||
      compatibilityIdentity.sha256 !==
        matrixEntry.compatibilityRequirementSha256 ||
      admission.profileId !== matrixEntry.profileId ||
      admission.languageMode !== matrixEntry.languageMode ||
      admission.providerId !== matrixEntry.providerId ||
      admission.hostPackageId !== matrixEntry.hostPackageId ||
      admission.capabilityDigest !== matrixEntry.capabilityDigest ||
      admission.compatibilityRequirement.sha256 !==
        compatibilityIdentity.sha256 ||
      admission.admittedModels.length !== 1 ||
      admittedModel.manifestFileName !== manifestIdentity.fileName ||
      admittedModel.sizeBytes !== manifestIdentity.sizeBytes ||
      admittedModel.sha256 !== manifestIdentity.sha256 ||
      admittedModel.modelAssetId !== matrixEntry.modelAssetId ||
      admittedModel.revision !== manifest.revision ||
      admittedModel.layoutId !== manifest.layoutId ||
      admittedModel.modelTreeSha256 !== manifest.modelTreeSha256 ||
      admittedModel.totalSizeBytes !== manifest.totalSizeBytes ||
      compatibility.profileId !== matrixEntry.profileId ||
      compatibility.providerId !== matrixEntry.providerId ||
      compatibility.model.modelId !== matrixEntry.modelId ||
      compatibility.capabilityDigest !== matrixEntry.capabilityDigest ||
      manifest.modelId !== matrixEntry.modelId ||
      manifest.modelAssetId !== matrixEntry.modelAssetId ||
      profile.compatibilityPairSha256 !== pairSha256
    )
      throw new Error("Catalog 4 host/model authority mismatch.");
    entries.push({
      profileId: matrixEntry.profileId,
      languageMode: matrixEntry.languageMode,
      target: { platform: "darwin", architecture: "arm64" },
      providerId: matrixEntry.providerId,
      modelId: matrixEntry.modelId,
      capabilityDigest: matrixEntry.capabilityDigest,
      host: {
        archive: {
          ...profile.hostArchive,
          url: `${baseUrl.replace(/\/$/, "")}/v${RELEASE_VERSION}/${profile.hostArchive.fileName}`,
        },
        hostPackageId: matrixEntry.hostPackageId,
        descriptorSha256: profile.hostDescriptorSha256,
        fileManifestSha256: profile.hostFileManifestSha256,
        compatibilityRequirementSha256:
          matrixEntry.compatibilityRequirementSha256,
        launcherPath: "bin/voice-provider",
        modelManagerPath: "bin/voice-model-manager",
      },
      hostAuthority: {
        hostSourceClosure: {
          fileName: "host-source-closure-v1.json",
          sizeBytes: profile.hostSourceClosureSizeBytes,
          sha256: profile.hostSourceClosureSha256,
        },
        modelAdmissionRoot: admissionIdentity,
      },
      model: {
        manifest: {
          ...profile.modelManifest,
          url: `${baseUrl.replace(/\/$/, "")}/v${RELEASE_VERSION}/${profile.modelManifest.fileName}`,
        },
        modelAssetId: manifest.modelAssetId,
        revision: manifest.revision,
        layoutId: manifest.layoutId,
        modelTreeSha256: manifest.modelTreeSha256,
        totalSizeBytes: manifest.totalSizeBytes,
      },
      compatibilityPairSha256: pairSha256,
      supportStatement: "macOS Apple Silicon only",
    });
  }
  return writeArtifact(
    output,
    {
      schemaVersion: 4,
      catalogId: "voice-runtime-catalog-v4",
      releaseVersion: RELEASE_VERSION,
      entries,
    },
    "contracts/catalog/voice-runtime-catalog-v4.schema.json",
    "Voice Runtime Catalog 4",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "release-evidence",
    "base-url",
    "output",
  ]);
  await buildReleaseCatalog({
    releaseEvidence: args["release-evidence"],
    baseUrl: args["base-url"],
    output: args.output,
  });
}
