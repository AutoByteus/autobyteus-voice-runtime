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
  !/^[a-f0-9]{64}$/.test(first.buildInputProvenanceSha256) ||
  !/^[a-f0-9]{64}$/.test(first.buildInputRecipeSha256) ||
  !/^[a-f0-9]{64}$/.test(first.releaseMatrixSha256) ||
  !/^[a-f0-9]{64}$/.test(first.nativeBuildEnvironmentSha256) ||
  firstArchiveSha256 !== secondArchiveSha256 ||
  firstBuildReportSha256 !== secondBuildReportSha256 ||
  firstArchiveSha256 !== first.archive?.sha256 ||
  secondArchiveSha256 !== second.archive?.sha256 ||
  first.sourceCommit !== second.sourceCommit ||
  first.packageId !== second.packageId ||
  first.buildInputManifestSha256 !== second.buildInputManifestSha256 ||
  first.buildInputProvenanceSha256 !== second.buildInputProvenanceSha256 ||
  first.buildInputRecipeSha256 !== second.buildInputRecipeSha256 ||
  first.releaseMatrixSha256 !== second.releaseMatrixSha256 ||
  first.nativeBuildEnvironmentSha256 !== second.nativeBuildEnvironmentSha256
)
  throw new Error("Locked-input rebuild is not byte-identical.");
await writeJson(path.resolve(args.output), {
  schemaVersion: 1,
  passed: true,
  sourceCommit: first.sourceCommit,
  packageId: first.packageId,
  buildInputManifestSha256: first.buildInputManifestSha256,
  buildInputProvenanceSha256: first.buildInputProvenanceSha256,
  buildInputRecipeSha256: first.buildInputRecipeSha256,
  releaseMatrixSha256: first.releaseMatrixSha256,
  nativeBuildEnvironmentSha256: first.nativeBuildEnvironmentSha256,
  archiveSha256: firstArchiveSha256,
  firstBuildReportSha256,
  secondBuildReportSha256,
});
