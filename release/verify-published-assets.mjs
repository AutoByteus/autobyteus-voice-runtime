#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";

export async function verifyPublishedAssets({
  manifestPath,
  downloads,
  repository,
  releaseTag,
  output,
}) {
  const manifest = await readJson(manifestPath);
  await validate(
    manifest,
    "contracts/release/pretag-release-manifest-v1.schema.json",
    false,
  );
  if (
    manifest.intendedRelease.releaseTag !== releaseTag ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)
  )
    throw new Error("Published verification release identity mismatch.");
  const expectedManifestSha256 = await shaFile(manifestPath),
    publishedManifest = path.join(
      path.resolve(downloads),
      "pretag-release-manifest-v1.json",
    ),
    manifestObservation = await observeFile(
      publishedManifest,
      (await fs.stat(manifestPath)).size,
      expectedManifestSha256,
    ),
    expected = [
      { role: "catalog", ...manifest.catalog },
      { role: "release-evidence", ...manifest.releaseEvidence },
      ...manifest.providerArchives.items.map((item) => ({
        role: "provider-archive",
        ...item,
      })),
    ],
    expectedFileNames = [
      "pretag-release-manifest-v1.json",
      ...expected.map((item) => item.fileName),
    ].sort(compareName),
    actualFileNames = await publishedNames(path.resolve(downloads)),
    exactPublishedFileSet =
      JSON.stringify(actualFileNames) === JSON.stringify(expectedFileNames),
    observations = [];
  for (const item of expected) {
    const observed = await observeFile(
      path.join(path.resolve(downloads), item.fileName),
      item.sizeBytes,
      item.sha256,
    );
    observations.push({
      role: item.role,
      fileName: item.fileName,
      expectedSizeBytes: item.sizeBytes,
      observedSizeBytes: observed.observedSizeBytes,
      expectedSha256: item.sha256,
      observedSha256: observed.observedSha256,
      status: observed.status,
    });
  }
  const result = {
    schemaVersion: 1,
    decision:
      manifestObservation.status === "match" &&
      exactPublishedFileSet &&
      observations.every((item) => item.status === "match")
        ? "pass"
        : "fail",
    releaseTag,
    repository,
    observedAt: new Date().toISOString(),
    preTagReleaseManifest: {
      expectedSha256: expectedManifestSha256,
      publishedSha256: manifestObservation.observedSha256,
      status: manifestObservation.status,
    },
    expectedPublishedPayloadSetSha256: manifest.publishedPayloadSetSha256,
    observations,
  };
  await validate(
    result,
    "contracts/release/published-asset-verification-v1.schema.json",
    true,
  );
  await writeJson(path.resolve(output), result);
  if (result.decision !== "pass") {
    const error = new Error("Published assets do not match pre-tag bytes.");
    error.code = "PUBLISHED_ASSET_MISMATCH";
    throw error;
  }
  return result;
}

function compareName(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

async function publishedNames(directory) {
  try {
    return (await fs.readdir(directory, { withFileTypes: true }))
      .map((entry) => entry.name)
      .sort(compareName);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function observeFile(file, expectedSizeBytes, expectedSha256) {
  try {
    const info = await fs.lstat(file);
    if (!info.isFile())
      throw Object.assign(new Error("not file"), { code: "ENOENT" });
    const digest = await shaFile(file);
    return {
      observedSizeBytes: info.size,
      observedSha256: digest,
      status:
        info.size !== expectedSizeBytes
          ? "size-mismatch"
          : digest !== expectedSha256
            ? "digest-mismatch"
            : "match",
    };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { observedSizeBytes: null, observedSha256: null, status: "missing" };
  }
}

async function validate(value, schemaPath, formats) {
  const schema = await readJson(path.join(ROOT, schemaPath)),
    ajv = new Ajv2020({ allErrors: true, strict: true });
  if (formats) addFormats(ajv);
  const check = ajv.compile(schema);
  if (!check(value))
    throw new Error(`Artifact invalid: ${JSON.stringify(check.errors)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "manifest",
    "downloads",
    "repository",
    "release-tag",
    "output",
  ]);
  await verifyPublishedAssets({
    manifestPath: path.resolve(args.manifest),
    downloads: path.resolve(args.downloads),
    repository: args.repository,
    releaseTag: args["release-tag"],
    output: path.resolve(args.output),
  });
}
