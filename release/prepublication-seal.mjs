#!/usr/bin/env node
import path from "node:path";
import { parsePairs } from "../build/lib/files.mjs";
import {
  assertExactNames,
  CHECKSUM_COVERED_NAMES,
  ordinaryFileIdentity,
  parseAndVerifyChecksums,
  PUBLISHED_ASSET_NAMES,
  readValidated,
  writeArtifact,
} from "./release-contract.mjs";

export async function sealPrepublicationBundle({ directory, output }) {
  const root = path.resolve(directory),
    manifestPath = path.join(root, "pretag-release-manifest-v4.json"),
    checksumPath = path.join(root, "release-SHA256SUMS.txt"),
    manifest = await readValidated(
      manifestPath,
      "contracts/release/pretag-release-manifest-v4.schema.json",
      "Pre-Tag Release Manifest 4",
    ),
    coveredAssets = await parseAndVerifyChecksums(root, checksumPath);
  assertExactNames(
    coveredAssets.map((item) => item.fileName),
    CHECKSUM_COVERED_NAMES,
    "Prepublication covered assets",
  );
  const expectedFromManifest = [
    manifest.releaseEvidence,
    manifest.catalog,
    ...manifest.payloads,
    await ordinaryFileIdentity(manifestPath),
  ];
  for (const expected of expectedFromManifest) {
    const observed = coveredAssets.find(
      (item) => item.fileName === expected.fileName,
    );
    if (
      !observed ||
      observed.sizeBytes !== expected.sizeBytes ||
      observed.sha256 !== expected.sha256
    )
      throw new Error("Prepublication checksum chain mismatch.");
  }
  return writeArtifact(
    output,
    {
      schemaVersion: 1,
      artifactKind: "prepublication-seal",
      preTagManifest: await ordinaryFileIdentity(manifestPath),
      checksumManifest: await ordinaryFileIdentity(checksumPath),
      coveredAssets,
      expectedPublishedAssetNames: [...PUBLISHED_ASSET_NAMES],
      decision: "pass",
    },
    "contracts/release/prepublication-seal-v1.schema.json",
    "Prepublication Seal 1",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), ["directory", "output"]);
  await sealPrepublicationBundle({
    directory: args.directory,
    output: args.output,
  });
}
