#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import {
  parsePairs,
  readJson,
  sha256,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
const args = parsePairs(process.argv.slice(2), [
  "catalog",
  "evidence",
  "assets",
  "output",
]);
const catalog = await readJson(args.catalog),
  evidence = await readJson(args.evidence);
const assets = [];
for (const entry of catalog.entries) {
  const file = path.join(path.resolve(args.assets), entry.archive.fileName);
  if ((await shaFile(file)) !== entry.archive.sha256)
    throw new Error(`Published archive mismatch: ${entry.archive.fileName}`);
  assets.push([entry.archive.fileName, entry.archive.sha256]);
}
assets.sort((a, b) => a[0].localeCompare(b[0]));
if (
  sha256(Buffer.from(`${JSON.stringify(assets)}\n`)) !==
  evidence.preTagQualification.assetSetSha256
)
  throw new Error("Published asset set differs from pre-tag qualification.");
for (const file of [path.basename(args.catalog), path.basename(args.evidence)])
  await fs.access(path.join(path.resolve(args.assets), file));
await writeJson(path.resolve(args.output), {
  schemaVersion: 1,
  decision: "published-assets-match-pretag",
  catalogSha256: await shaFile(args.catalog),
  evidenceSha256: await shaFile(args.evidence),
  assetSetSha256: evidence.preTagQualification.assetSetSha256,
});
