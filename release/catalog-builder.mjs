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
const args = parsePairs(process.argv.slice(2), [
  "qualifications",
  "release-tag",
  "base-url",
  "output",
]);
if (
  !/^v\d+\.\d+\.\d+$/.test(args["release-tag"]) ||
  !args["base-url"].startsWith("https://")
)
  throw new Error("Invalid prepublication identity.");
const summaries = [];
for (const file of await find(
  path.resolve(args.qualifications),
  "qualification-summary.json",
))
  summaries.push({ file, value: await readJson(file) });
if (summaries.length < 8)
  throw new Error("Required qualification matrix incomplete.");
const sourceCommits = new Set(summaries.map((item) => item.value.sourceCommit)),
  versions = new Set(summaries.map((item) => item.value.packageVersion));
if (sourceCommits.size !== 1 || versions.size !== 1)
  throw new Error("Qualification source/version mismatch.");
const entries = [];
for (const { file, value: q } of summaries) {
  const launcher =
    q.target.platform === "win32"
      ? "bin/voice-provider.exe"
      : "bin/voice-provider";
  entries.push({
    profileId: q.profileId,
    languageMode: q.languageMode,
    platform: q.target.platform,
    architecture: q.target.architecture,
    packageId: q.packageId,
    providerId: q.providerId,
    modelId: q.modelId,
    archive: {
      format: "zip",
      formatVersion: 1,
      compression: "deflate",
      canonicalization: "autobyteus-provider-zip-v1",
      rootDirectory: "package",
      fileName: q.archive.fileName,
      url: `${args["base-url"].replace(/\/$/, "")}/${q.archive.fileName}`,
      sha256: q.archive.sha256,
      compressedSizeBytes: q.archive.compressedSizeBytes,
      extractedSizeBytes: q.archive.extractedSizeBytes,
      entryCount: q.archive.entryCount,
    },
    launcher,
    packageDescriptor: {
      path: "provider/provider-package-v1.json",
      sha256: q.descriptorSha256,
    },
    fileManifest: {
      path: "provider/package-files-v1.json",
      sha256: q.fileManifestSha256,
    },
    protocolVersion: 1,
    sessionConfigVersion: 1,
    capabilityDigest: q.capabilityDigest,
    noticeInventoryDigest: q.noticeInventorySha256,
    qualificationEvidenceDigest: await shaFile(file),
    decision: q.profileId === "english" ? "preserve" : "select",
  });
}
entries.sort((a, b) =>
  `${a.profileId}/${a.platform}/${a.architecture}`.localeCompare(
    `${b.profileId}/${b.platform}/${b.architecture}`,
  ),
);
const catalog = {
  schemaVersion: 3,
  runtimeId: "voice-input",
  runtimeVersion: [...versions][0],
  sourceCommit: [...sourceCommits][0],
  releaseTag: args["release-tag"],
  entries,
};
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const schema = await readJson(
  path.join(ROOT, "contracts/catalog/voice-runtime-catalog-v3.schema.json"),
);
if (!ajv.validate(schema, catalog)) throw new Error(ajv.errorsText());
await writeJson(path.resolve(args.output), catalog);
async function find(root, name) {
  const result = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await find(target, name)));
    else if (entry.name === name) result.push(target);
  }
  return result.sort();
}
