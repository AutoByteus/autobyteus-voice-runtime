#!/usr/bin/env node
import path from "node:path";
import { parsePairs, readJson, ROOT, shaFile } from "../build/lib/files.mjs";
import { loadCurrentReleaseMatrix } from "./current-release-matrix.mjs";
import {
  compareNames,
  ordinaryFileIdentity,
  readValidated,
  writeArtifact,
} from "./release-contract.mjs";

export async function admitModelManifests({
  sourceAdmission,
  branchProjection,
  executionClosures,
  output,
}) {
  const admission = await readValidated(
      sourceAdmission,
      "contracts/release/release-source-admission-v3.schema.json",
      "Release Source Admission 3",
    ),
    projection = await readValidated(
      branchProjection,
      "contracts/catalog/branch-catalog-projection-v3.schema.json",
      "Branch Catalog Projection 3",
    ),
    matrix = await loadCurrentReleaseMatrix();
  if (
    admission.decision !== "reuse-permitted" ||
    projection.decision !== "pass"
  )
    throw new Error(
      "Model manifest admission requires accepted source/projection.",
    );
  const profiles = [];
  for (const matrixEntry of matrix.value.entries) {
    const projected = projection.profiles.find(
        (item) => item.profileId === matrixEntry.profileId,
      ),
      manifestPath = path.join(
        ROOT,
        "release",
        "model-manifests",
        matrixEntry.modelManifest.fileName,
      ),
      rootPath = path.join(
        ROOT,
        "contracts/model/admission",
        matrixEntry.modelAdmissionRoot.fileName,
      ),
      root = await readJson(rootPath),
      manifest = await readJson(manifestPath),
      manifestIdentity = await ordinaryFileIdentity(manifestPath),
      closurePath = executionClosures[matrixEntry.profileId],
      closure = await readValidated(
        closurePath,
        "contracts/qualification/profile-execution-closure-v2.schema.json",
        "Profile Execution Closure 2",
      );
    if (
      !projected ||
      closure.profileId !== matrixEntry.profileId ||
      closure.decision !== "reuse-permitted" ||
      manifestIdentity.sha256 !== matrixEntry.modelManifest.sha256 ||
      projected.modelManifest.sha256 !== manifestIdentity.sha256 ||
      (await shaFile(rootPath)) !== matrixEntry.modelAdmissionRoot.sha256 ||
      root.admittedModels.length !== 1 ||
      root.admittedModels[0].sha256 !== manifestIdentity.sha256 ||
      root.admittedModels[0].modelAssetId !== manifest.modelAssetId
    )
      throw new Error("Model manifest is outside Host Admission Root 1.");
    profiles.push({
      profileId: matrixEntry.profileId,
      manifest: manifestIdentity,
      modelAdmissionRootSha256: matrixEntry.modelAdmissionRoot.sha256,
      executionClosureVerification: await ordinaryFileIdentity(closurePath),
      branchProjectionSha256: await shaFile(branchProjection),
      decision: "admitted",
    });
  }
  profiles.sort((left, right) => compareNames(left.profileId, right.profileId));
  return writeArtifact(
    output,
    {
      schemaVersion: 1,
      artifactKind: "model-manifest-admission",
      sourceAdmission: await ordinaryFileIdentity(sourceAdmission),
      profiles,
      decision: "pass",
    },
    "contracts/release/model-manifest-admission-v1.schema.json",
    "Model Manifest Admission 1",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "source-admission",
    "branch-projection",
    "english-execution-closure",
    "chinese-execution-closure",
    "output",
  ]);
  await admitModelManifests({
    sourceAdmission: args["source-admission"],
    branchProjection: args["branch-projection"],
    executionClosures: {
      english: args["english-execution-closure"],
      chinese: args["chinese-execution-closure"],
    },
    output: args.output,
  });
}
