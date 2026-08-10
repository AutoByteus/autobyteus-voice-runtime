#!/usr/bin/env node
import path from "node:path";
import { parsePairs, readJson, ROOT } from "../../build/lib/files.mjs";
import { loadCurrentReleaseMatrix } from "../current-release-matrix.mjs";
import { sameContentIdentity } from "../release-admission-contract.mjs";
import {
  deepEqual,
  ordinaryFileIdentity,
  PUBLISHED_ASSET_NAMES,
  readValidated,
  RELEASE_TAG,
  RELEASE_VERSION,
  writeArtifact,
} from "../release-contract.mjs";

export async function assembleReleaseEvidence({
  sourceAdmission,
  releaseAdmissionVerification,
  hostConstruction,
  modelManifestAdmission,
  branchProjection,
  finalMainCommit,
  output,
}) {
  const admission = await readValidated(
      sourceAdmission,
      "contracts/release/release-source-admission-v4.schema.json",
      "Release Source Admission 4",
    ),
    admissionVerification = await readValidated(
      releaseAdmissionVerification,
      "contracts/release/release-admission-verification-v1.schema.json",
      "Release Admission Verification 1",
    ),
    construction = await readValidated(
      hostConstruction,
      "contracts/release/hosted-host-construction-result-v3.schema.json",
      "Hosted Host Construction Result 3",
    ),
    modelAdmission = await readValidated(
      modelManifestAdmission,
      "contracts/release/model-manifest-admission-v1.schema.json",
      "Model Manifest Admission 1",
    ),
    projection = await readValidated(
      branchProjection,
      "contracts/catalog/branch-catalog-projection-v3.schema.json",
      "Branch Catalog Projection 3",
    ),
    matrix = await loadCurrentReleaseMatrix();
  const sourceAdmissionIdentity = await ordinaryFileIdentity(sourceAdmission),
    admissionVerificationIdentity = await ordinaryFileIdentity(
      releaseAdmissionVerification,
    ),
    projectionIdentity = await ordinaryFileIdentity(branchProjection);
  if (
    admission.decision !== "reuse-permitted" ||
    admissionVerification.decision !== "pass" ||
    construction.decision !== "pass" ||
    modelAdmission.decision !== "pass" ||
    projection.decision !== "pass" ||
    admissionVerification.workflowCheckoutCommit !== finalMainCommit ||
    construction.workflowCheckoutCommit !== finalMainCommit ||
    construction.focusedSourceCommit !== admission.focusedSourceCommit ||
    construction.admittedSourceCommit !== admission.admittedSourceCommit ||
    construction.authorityPromotionCommit !==
      admissionVerification.authorityPromotionCommit ||
    !deepEqual(construction.sourceAdmission, sourceAdmissionIdentity) ||
    !deepEqual(
      construction.releaseAdmissionVerification,
      admissionVerificationIdentity,
    ) ||
    !deepEqual(modelAdmission.sourceAdmission, sourceAdmissionIdentity) ||
    !sameContentIdentity(projectionIdentity, admission.branchCatalogProjection)
  )
    throw new Error("Release Evidence 4 input decision/lineage mismatch.");
  const profiles = projection.profiles.map((profile) => {
    const host = construction.profiles.find(
        (item) => item.profileId === profile.profileId,
      ),
      model = modelAdmission.profiles.find(
        (item) => item.profileId === profile.profileId,
      );
    if (
      !host ||
      host.outcome !== "succeeded" ||
      !host.details ||
      !model ||
      host.details.hostedArchive.sha256 !== profile.hostArchive.sha256 ||
      host.details.workflowHostSourceClosureSha256 !==
        profile.hostSourceClosureSha256 ||
      model.manifest.sha256 !== profile.modelManifest.sha256 ||
      model.modelAdmissionRootSha256 !== profile.modelAdmissionRootSha256
    )
      throw new Error("Release Evidence 4 profile chain mismatch.");
    return {
      profileId: profile.profileId,
      hostArchive: host.details.hostedArchive,
      hostSourceClosureSha256: profile.hostSourceClosureSha256,
      hostSourceClosureSizeBytes: profile.hostSourceClosureSizeBytes,
      hostDescriptorSha256: profile.hostDescriptorSha256,
      hostFileManifestSha256: profile.hostFileManifestSha256,
      modelAdmissionRootSha256: profile.modelAdmissionRootSha256,
      modelManifest: model.manifest,
      compatibilityPairSha256: profile.compatibilityPairSha256,
    };
  });
  return writeArtifact(
    output,
    {
      schemaVersion: 4,
      artifactKind: "release-qualification-evidence",
      runtimeVersion: RELEASE_VERSION,
      releaseTag: RELEASE_TAG,
      finalMainCommit,
      releaseSourceAdmission: sourceAdmissionIdentity,
      releaseAdmissionVerification: admissionVerificationIdentity,
      hostConstruction: await ordinaryFileIdentity(hostConstruction),
      modelManifestAdmission: await ordinaryFileIdentity(
        modelManifestAdmission,
      ),
      matrix: await ordinaryFileIdentity(
        path.join(ROOT, "contracts/catalog/current-release-matrix-v2.json"),
      ),
      profiles,
      expectedAssetNames: [...PUBLISHED_ASSET_NAMES],
      executionCounts: {
        productTests: 0,
        modelDownloads: 0,
        providerLaunches: 0,
      },
      decision: "pass",
    },
    "contracts/release/release-qualification-evidence-v4.schema.json",
    "Release Qualification Evidence 4",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "source-admission",
    "release-admission-verification",
    "host-construction",
    "model-manifest-admission",
    "branch-projection",
    "final-main-commit",
    "output",
  ]);
  await assembleReleaseEvidence({
    sourceAdmission: args["source-admission"],
    releaseAdmissionVerification: args["release-admission-verification"],
    hostConstruction: args["host-construction"],
    modelManifestAdmission: args["model-manifest-admission"],
    branchProjection: args["branch-projection"],
    finalMainCommit: args["final-main-commit"],
    output: args.output,
  });
}
