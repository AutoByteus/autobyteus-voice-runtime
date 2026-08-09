#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parsePairs, readJson, shaFile } from "../build/lib/files.mjs";
import {
  assertExactNames,
  ordinaryFileIdentity,
  parseAndVerifyChecksums,
  PUBLISHED_ASSET_NAMES,
  readValidated,
  writeArtifact,
} from "./release-contract.mjs";

export async function verifyPublishedAssets({
  seal,
  downloads,
  assetMetadata,
  repository,
  releaseTag,
  output,
}) {
  const sealValue = await readValidated(
      seal,
      "contracts/release/prepublication-seal-v1.schema.json",
      "Prepublication Seal 1",
    ),
    metadata = await readJson(assetMetadata),
    root = path.resolve(downloads),
    actualNames = await fs.readdir(root).catch(() => []),
    metadataNames = Array.isArray(metadata.assets)
      ? metadata.assets.map((item) => item.name)
      : [],
    exactAssetSet =
      exactNames(actualNames) &&
      exactNames(metadataNames) &&
      sealValue.expectedPublishedAssetNames.join("\0") ===
        PUBLISHED_ASSET_NAMES.join("\0"),
    expectations = new Map(
      sealValue.coveredAssets.map((item) => [item.fileName, item]),
    );
  expectations.set(
    sealValue.checksumManifest.fileName,
    sealValue.checksumManifest,
  );
  const assets = [];
  for (const fileName of PUBLISHED_ASSET_NAMES) {
    const expected = expectations.get(fileName),
      metadataRow = metadata.assets?.find((item) => item.name === fileName),
      observed = await observe(path.join(root, fileName)),
      status = !observed
        ? "missing"
        : observed.sizeBytes !== expected?.sizeBytes
          ? "size-mismatch"
          : observed.sha256 !== expected?.sha256
            ? "digest-mismatch"
            : "match";
    assets.push({
      fileName,
      assetId: Number.isSafeInteger(metadataRow?.id) ? metadataRow.id : null,
      expectedSizeBytes: expected?.sizeBytes ?? 1,
      observedSizeBytes: observed?.sizeBytes ?? null,
      expectedSha256: expected?.sha256 ?? "0".repeat(64),
      observedSha256: observed?.sha256 ?? null,
      status,
    });
  }
  let failureCategory = "none";
  if (!exactAssetSet)
    failureCategory =
      actualNames.some((item) => !PUBLISHED_ASSET_NAMES.includes(item)) ||
      metadataNames.some((item) => !PUBLISHED_ASSET_NAMES.includes(item))
        ? "unexpected-asset"
        : "missing-asset";
  else if (assets.some((item) => item.status === "missing"))
    failureCategory = "missing-asset";
  else if (assets.some((item) => item.status === "size-mismatch"))
    failureCategory = "size-mismatch";
  else if (assets.some((item) => item.status === "digest-mismatch"))
    failureCategory = "digest-mismatch";
  const result = {
    schemaVersion: 2,
    artifactKind: "published-asset-verification",
    repository,
    releaseTag,
    releaseId: metadata.releaseId,
    prepublicationSealSha256: await shaFile(seal),
    preTagManifest: sealValue.preTagManifest,
    checksumManifest: sealValue.checksumManifest,
    assets,
    exactAssetSet,
    decision: failureCategory === "none" ? "pass" : "fail",
    failureCategory,
  };
  await writeArtifact(
    output,
    result,
    "contracts/release/published-asset-verification-v2.schema.json",
    "Published Asset Verification 2",
  );
  if (result.decision !== "pass") {
    const error = new Error("Published assets differ from sealed bytes.");
    error.code = "PUBLISHED_ASSET_MISMATCH";
    throw error;
  }
  await parseAndVerifyChecksums(
    root,
    path.join(root, "release-SHA256SUMS.txt"),
  );
  return result;
}

function exactNames(names) {
  try {
    assertExactNames(names, PUBLISHED_ASSET_NAMES, "Published assets");
    return true;
  } catch {
    return false;
  }
}
async function observe(file) {
  try {
    return await ordinaryFileIdentity(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "seal",
    "downloads",
    "asset-metadata",
    "repository",
    "release-tag",
    "output",
  ]);
  await verifyPublishedAssets({
    seal: args.seal,
    downloads: args.downloads,
    assetMetadata: args["asset-metadata"],
    repository: args.repository,
    releaseTag: args["release-tag"],
    output: args.output,
  });
}
