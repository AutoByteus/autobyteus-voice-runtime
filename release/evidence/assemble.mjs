#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  parsePairs,
  readJson,
  ROOT,
  sha256,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";
import { assertIntegratedReleaseCommit } from "./main-reachability.mjs";
const run = promisify(execFile);
const args = parsePairs(process.argv.slice(2), [
  "qualifications",
  "catalog",
  "assets",
  "maintained-main-commit",
  "output",
]);
const catalog = await readJson(args.catalog),
  history = await readJson(
    path.join(ROOT, "release/evidence/candidate-history-v1.json"),
  ),
  summaries = [];
for (const file of await find(
  path.resolve(args.qualifications),
  "qualification-summary.json",
))
  summaries.push({ file, value: await readJson(file) });
if (!/^(?!0{40})[a-f0-9]{40}$/.test(args["maintained-main-commit"]))
  throw new Error("Invalid maintained-main identity.");
for (const candidate of history.candidates) {
  const source = path.join(
    ROOT,
    "evidence/selection-study",
    candidate.resultPath,
  );
  if ((await shaFile(source)) !== candidate.resultDigest)
    throw new Error(`Candidate evidence mismatch: ${candidate.candidateId}`);
}
if (
  !history.candidates.some(
    (item) =>
      item.candidateId === "paraformer-control-rejected" &&
      item.outcome === "rejected",
  ) ||
  !history.candidates.some(
    (item) =>
      item.candidateId === "funasr-selected" && item.outcome === "selected",
  )
)
  throw new Error("Approved candidate order/history incomplete.");
if (summaries.length < 8) throw new Error("Qualification matrix incomplete.");
const sourceCommit = catalog.sourceCommit,
  runnerCommit = summaries[0].value.runnerCommit;
if (
  summaries.some(
    (item) =>
      item.value.sourceCommit !== sourceCommit ||
      item.value.runnerCommit !== runnerCommit,
  )
)
  throw new Error("Qualification source/runner mismatch.");
const archiveAssets = [];
for (const { value } of summaries) {
  const asset = path.join(path.resolve(args.assets), value.archive.fileName);
  if ((await shaFile(asset)) !== value.archive.sha256)
    throw new Error(`Release asset mismatch: ${value.archive.fileName}`);
  archiveAssets.push([value.archive.fileName, value.archive.sha256]);
}
archiveAssets.sort((a, b) => a[0].localeCompare(b[0]));
const assetSetSha256 = sha256(
  Buffer.from(`${JSON.stringify(archiveAssets)}\n`),
);
let tagExists = true;
try {
  await run(
    "git",
    ["rev-parse", "--verify", `refs/tags/${catalog.releaseTag}`],
    { cwd: ROOT },
  );
} catch {
  tagExists = false;
}
if (tagExists)
  throw new Error(
    "Pre-tag qualification cannot begin after the release tag exists.",
  );
await assertIntegratedReleaseCommit({
  repository: ROOT,
  releaseCommit: sourceCommit,
  maintainedMainCommit: args["maintained-main-commit"],
});
const corpora = [];
for (const item of summaries) {
  if (!corpora.some((value) => value.id === item.value.corpus.id))
    corpora.push(item.value.corpus);
}
const evidence = {
  schemaVersion: 1,
  sourceCommit,
  runnerCommit,
  selectionStudy: {
    id: history.selectionStudyId,
    sha256: await shaFile(
      path.join(ROOT, "evidence/selection-study/SHA256SUMS.txt"),
    ),
  },
  catalog: {
    id: path.basename(args.catalog),
    sha256: await shaFile(args.catalog),
  },
  corpora,
  candidateHistory: history.candidates.map(
    ({ resultPath, ...candidate }) => candidate,
  ),
  profileQualifications: await Promise.all(
    summaries.map(async (item) =>
      project(item.value, await shaFile(item.file)),
    ),
  ),
  mainReachability: {
    maintainedMainCommit: args["maintained-main-commit"],
    releaseCommit: sourceCommit,
    reachable: true,
  },
  preTagQualification: {
    qualifiedCommit: sourceCommit,
    catalogSha256: await shaFile(args.catalog),
    assetSetSha256,
    completedBeforeTag: true,
  },
};
await writeJson(path.resolve(args.output), evidence);
function project(q, qualificationSummarySha256) {
  return {
    profileId: q.profileId,
    languageMode: q.languageMode,
    platform: q.target.platform,
    architecture: q.target.architecture,
    decision: q.profileId === "english" ? "preserve" : "select",
    packageId: q.packageId,
    providerId: q.providerId,
    modelId: q.modelId,
    buildReportSha256: q.buildReportSha256,
    buildInputManifestSha256: q.buildInputManifestSha256,
    repositoryBuildLockSha256: q.repositoryBuildLockSha256,
    goToolchainArchiveSha256: q.goToolchainArchiveSha256,
    goToolchainRootManifestSha256: q.goToolchainRootManifestSha256,
    goToolchainRootTreeSha256: q.goToolchainRootTreeSha256,
    goToolchainRootFileCount: q.goToolchainRootFileCount,
    goToolchainRootSizeBytes: q.goToolchainRootSizeBytes,
    reproducibilityProofSha256: q.reproducibilityProofSha256,
    runtimeConformanceSha256: q.runtimeConformanceSha256,
    performanceSamplesSha256: q.performanceSamplesSha256,
    qualificationSummarySha256,
    archiveSha256: q.archive.sha256,
    descriptorSha256: q.descriptorSha256,
    fileManifestSha256: q.fileManifestSha256,
    launcherSha256: q.launcherSha256,
    launcherPlanSha256: q.launcherPlanSha256,
    hostSha256: q.hostSha256,
    engineConfigurationSha256: q.engineConfigurationSha256,
    modelSha256: q.modelSha256,
    normalizerSha256: q.normalizerSha256,
    protocolSha256: q.protocolSha256,
    noticeInventorySha256: q.noticeInventorySha256,
    quality: q.quality,
    handshake: q.handshake,
    coldPreparation: q.coldPreparation,
    warmPreparation: q.warmPreparation,
    coldResult: q.coldResult,
    warmRequest: q.warmRequest,
    maxRssBytes: q.maxRssBytes,
    extractedSizeBytes: q.extractedSizeBytes,
    packageRuns: q.packageRuns,
    actualPlatform: q.actualPlatform,
    normalizationFixtures: q.normalizationFixtures,
    relocation: q.relocation,
    offline: q.offline,
    noPackageMutation: q.noPackageMutation,
    recovery: q.recovery,
    licenseApproved: q.licenseApproved,
  };
}
async function find(root, name) {
  const result = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await find(target, name)));
    else if (entry.name === name) result.push(target);
  }
  return result.sort();
}
