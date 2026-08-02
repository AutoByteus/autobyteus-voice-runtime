#!/usr/bin/env node
import path from "node:path";
import { parsePairs, readJson, shaFile, writeJson } from "./lib/files.mjs";

const args = parsePairs(process.argv.slice(2), [
  "first-archive",
  "first-report",
  "second-archive",
  "second-report",
  "output",
]);
const first = await readJson(args["first-report"]),
  second = await readJson(args["second-report"]);
const firstArchiveSha256 = await shaFile(args["first-archive"]),
  secondArchiveSha256 = await shaFile(args["second-archive"]),
  firstBuildReportSha256 = await shaFile(args["first-report"]),
  secondBuildReportSha256 = await shaFile(args["second-report"]);
if (
  firstArchiveSha256 !== secondArchiveSha256 ||
  firstBuildReportSha256 !== secondBuildReportSha256 ||
  firstArchiveSha256 !== first.archive?.sha256 ||
  secondArchiveSha256 !== second.archive?.sha256 ||
  first.sourceCommit !== second.sourceCommit ||
  first.packageId !== second.packageId ||
  first.buildInputManifestSha256 !== second.buildInputManifestSha256
)
  throw new Error("Locked-input rebuild is not byte-identical.");
await writeJson(path.resolve(args.output), {
  schemaVersion: 1,
  passed: true,
  sourceCommit: first.sourceCommit,
  packageId: first.packageId,
  buildInputManifestSha256: first.buildInputManifestSha256,
  archiveSha256: firstArchiveSha256,
  firstBuildReportSha256,
  secondBuildReportSha256,
});
