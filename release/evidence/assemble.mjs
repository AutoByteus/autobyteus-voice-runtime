#!/usr/bin/env node
import path from "node:path";
import { parsePairs, readJson, ROOT } from "../../build/lib/files.mjs";
import { loadCurrentReleaseMatrix } from "../current-release-matrix.mjs";
import {
  ordinaryFileIdentity,
  PUBLISHED_ASSET_NAMES,
  readValidated,
  RELEASE_TAG,
  RELEASE_VERSION,
  writeArtifact,
} from "../release-contract.mjs";

export async function assembleReleaseEvidence({
  sourceAdmission,
  hostConstruction,
  modelManifestAdmission,
  branchProjection,
  finalMainCommit,
  output,
}) {
  const admission = await readValidated(
      sourceAdmission,
      "contracts/release/release-source-admission-v3.schema.json",
      "Release Source Admission 3",
    ),
    construction = await readValidated(
      hostConstruction,
      "contracts/release/hosted-host-construction-result-v2.schema.json",
      "Hosted Host Construction Result 2",
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
  if (
    admission.decision !== "reuse-permitted" ||
    construction.decision !== "pass" ||
    modelAdmission.decision !== "pass" ||
    projection.decision !== "pass" ||
    admission.finalMainCommit !== finalMainCommit ||
    construction.finalMainCommit !== finalMainCommit
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
      host.details.hostedHostSourceClosureSha256 !==
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
      releaseSourceAdmission: await ordinaryFileIdentity(sourceAdmission),
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
    "host-construction",
    "model-manifest-admission",
    "branch-projection",
    "final-main-commit",
    "output",
  ]);
  await assembleReleaseEvidence({
    sourceAdmission: args["source-admission"],
    hostConstruction: args["host-construction"],
    modelManifestAdmission: args["model-manifest-admission"],
    branchProjection: args["branch-projection"],
    finalMainCommit: args["final-main-commit"],
    output: args.output,
  });
}
