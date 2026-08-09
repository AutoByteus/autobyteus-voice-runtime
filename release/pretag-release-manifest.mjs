#!/usr/bin/env node
import path from "node:path";
import { parsePairs } from "../build/lib/files.mjs";
import {
  compareNames,
  ordinaryFileIdentity,
  readValidated,
  RELEASE_TAG,
  RELEASE_VERSION,
  writeArtifact,
} from "./release-contract.mjs";

export async function assemblePreTagReleaseManifest({
  finalMainCommit,
  releaseEvidence,
  catalog,
  hostArchives,
  modelManifests,
  notices,
  output,
}) {
  const evidence = await readValidated(
      releaseEvidence,
      "contracts/release/release-qualification-evidence-v4.schema.json",
      "Release Qualification Evidence 4",
    ),
    catalogValue = await readValidated(
      catalog,
      "contracts/catalog/voice-runtime-catalog-v4.schema.json",
      "Catalog 4",
    );
  if (
    evidence.decision !== "pass" ||
    evidence.finalMainCommit !== finalMainCommit ||
    evidence.releaseTag !== RELEASE_TAG ||
    evidence.runtimeVersion !== RELEASE_VERSION ||
    catalogValue.releaseVersion !== RELEASE_VERSION
  )
    throw new Error("Pre-Tag Manifest 4 input chain mismatch.");
  const payloads = [];
  for (const file of [...hostArchives, ...modelManifests, notices])
    payloads.push(await ordinaryFileIdentity(file));
  payloads.sort((left, right) => compareNames(left.fileName, right.fileName));
  if (
    payloads.length !== 5 ||
    evidence.profiles.some(
      (profile) =>
        !payloads.some(
          (item) =>
            item.sha256 === profile.hostArchive.sha256 &&
            item.fileName === profile.hostArchive.fileName,
        ) ||
        !payloads.some(
          (item) =>
            item.sha256 === profile.modelManifest.sha256 &&
            item.fileName === profile.modelManifest.fileName,
        ),
    )
  )
    throw new Error("Pre-Tag Manifest 4 payload closure mismatch.");
  return writeArtifact(
    output,
    {
      schemaVersion: 4,
      artifactKind: "pretag-release-manifest",
      runtimeVersion: RELEASE_VERSION,
      releaseTag: RELEASE_TAG,
      finalMainCommit,
      releaseEvidence: await ordinaryFileIdentity(
        releaseEvidence,
        "release-qualification-evidence-v4.json",
      ),
      catalog: await ordinaryFileIdentity(
        catalog,
        "voice-runtime-catalog-v4.json",
      ),
      payloads,
    },
    "contracts/release/pretag-release-manifest-v4.schema.json",
    "Pre-Tag Release Manifest 4",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "final-main-commit",
    "release-evidence",
    "catalog",
    "english-host",
    "chinese-host",
    "english-model-manifest",
    "chinese-model-manifest",
    "notices",
    "output",
  ]);
  await assemblePreTagReleaseManifest({
    finalMainCommit: args["final-main-commit"],
    releaseEvidence: args["release-evidence"],
    catalog: args.catalog,
    hostArchives: [args["english-host"], args["chinese-host"]],
    modelManifests: [
      args["english-model-manifest"],
      args["chinese-model-manifest"],
    ],
    notices: args.notices,
    output: args.output,
  });
}
