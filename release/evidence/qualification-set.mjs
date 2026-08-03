#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";
import {
  assertExactMatrixRows,
  loadCurrentReleaseMatrix,
  matrixEntryKey,
} from "../current-release-matrix.mjs";
import { verifyProfileQualificationEvidence } from "./profile-qualification-verifier.mjs";
import { verifyExactProviderArchiveSet } from "../provider-archive-set.mjs";

export async function assembleQualificationSet({
  qualifications,
  assets,
  sourceCommit,
  runnerCommit,
  testCommit,
  output,
}) {
  for (const value of [sourceCommit, runnerCommit, testCommit])
    if (!/^(?!0{40})[a-f0-9]{40}$/.test(value))
      throw new Error("Qualification Set commit identity invalid.");
  const matrix = await loadCurrentReleaseMatrix(),
    files = await find(
      path.resolve(qualifications),
      "qualification-summary.json",
    ),
    summaries = await Promise.all(
      files.map(async (file) => ({ file, value: await readJson(file) })),
    ),
    rows = summaries.map(({ value }) => ({
      ...value,
      platform: value.target.platform,
      architecture: value.target.architecture,
      decision: value.profileId === "english" ? "preserve" : "select",
    }));
  assertExactMatrixRows(matrix.value, rows);
  const packageVersions = new Set(rows.map((item) => item.packageVersion));
  if (packageVersions.size !== 1)
    throw new Error("Qualification Set package version mismatch.");
  const profiles = [];
  for (const entry of matrix.value.entries) {
    const item = summaries.find(
      ({ value }) =>
        matrixEntryKey({ ...value, ...value.target }) === matrixEntryKey(entry),
    );
    profiles.push(
      await verifyProfile(
        entry,
        item,
        path.resolve(assets),
        sourceCommit,
        runnerCommit,
      ),
    );
  }
  await verifyExactProviderArchiveSet(
    assets,
    profiles.map((profile) => profile.archive),
  );
  const decision = qualificationSetDecision(profiles);
  const result = {
    schemaVersion: 1,
    artifactKind: "qualification-set",
    sourceCommit,
    runnerCommit,
    testCommit,
    packageVersion: [...packageVersions][0],
    releaseMatrix: {
      matrixId: matrix.value.matrixId,
      sha256: matrix.sha256,
    },
    profiles,
    decision,
  };
  await validate(result);
  await writeJson(path.resolve(output), result);
  return result;
}

async function verifyProfile(entry, item, assets, sourceCommit, runnerCommit) {
  if (!item) throw new Error(`Qualification missing: ${matrixEntryKey(entry)}`);
  const q = item.value,
    directory = path.dirname(item.file),
    file = (name) => path.join(directory, name),
    build = await readJson(file("build-report.json")),
    provenance = await readJson(file("input-provenance-v1.json")),
    compliance = await readJson(file("package-compliance-v1.json")),
    performance = await readJson(file("performance-samples-v1.json")),
    preflight = await readJson(file("darwin-arm64-preflight-v1.json"));
  if (
    q.sourceCommit !== sourceCommit ||
    q.runnerCommit !== runnerCommit ||
    q.releaseMatrixId !== "voice-runtime-darwin-arm64-v1" ||
    q.packageId !== entry.packageId ||
    q.providerId !== entry.providerId ||
    q.modelId !== entry.modelId ||
    q.languageMode !== entry.languageMode ||
    q.buildReportSha256 !== (await shaFile(file("build-report.json"))) ||
    q.buildInputProvenanceSha256 !==
      (await shaFile(file("input-provenance-v1.json"))) ||
    q.nativeBuildEnvironmentSha256 !==
      (await shaFile(file("native-build-environment-v1.json"))) ||
    q.generatedComplianceSha256 !==
      (await shaFile(file("package-compliance-v1.json"))) ||
    q.performanceSamplesSha256 !==
      (await shaFile(file("performance-samples-v1.json"))) ||
    q.qualificationAttemptsSha256 !==
      (await shaFile(file("qualification-attempts-v1.json"))) ||
    q.preflightSha256 !==
      (await shaFile(file("darwin-arm64-preflight-v1.json"))) ||
    provenance.repository.sourceCommit !== sourceCommit ||
    compliance.decision !== "pass" ||
    preflight.status !== "pass" ||
    build.nativeBuildEnvironmentSha256 !== q.nativeBuildEnvironmentSha256
  )
    throw new Error(
      `Qualification identity/evidence mismatch: ${entry.profileId}`,
    );
  if (q.decision !== "pass")
    return verifyReportedNonPass({
      entry,
      item,
      assets,
      performance,
      sourceCommit,
      runnerCommit,
    });
  try {
    await verifyProfileQualificationEvidence(q, directory);
    enforceThresholds(q, performance);
    return passingProfile(entry, item, assets, performance);
  } catch {
    return nonPassingProfile({
      entry,
      item,
      assets,
      performance,
      decision: "fail",
      failureCategory: "qualification-verification-failed",
    });
  }
}

async function verifyReportedNonPass({
  entry,
  item,
  assets,
  performance,
  sourceCommit,
  runnerCommit,
}) {
  const q = item.value,
    directory = path.dirname(item.file),
    attemptsPath = path.join(directory, "qualification-attempts-v1.json"),
    rawPath = path.join(directory, "raw-results.json"),
    indexPath = path.join(directory, "result-index.json"),
    performancePath = path.join(directory, "performance-samples-v1.json"),
    attempts = await readJson(attemptsPath),
    counts = {
      started: attempts.attempts.length,
      completed: attempts.attempts.filter(
        (attempt) => attempt.status === "succeeded",
      ).length,
      failed: attempts.attempts.filter((attempt) => attempt.status === "failed")
        .length,
      timeouts: attempts.attempts.filter((attempt) => attempt.timeout).length,
    };
  if (
    q.sourceCommit !== sourceCommit ||
    q.runnerCommit !== runnerCommit ||
    !["fail", "blocked"].includes(q.decision) ||
    !/^[a-z0-9-]+$/.test(q.failureCategory) ||
    attempts.decision !== q.decision ||
    attempts.failureCategory !== q.failureCategory ||
    attempts.attempts.some((attempt) => attempt.status === "started") ||
    JSON.stringify(counts) !== JSON.stringify(q.attempts) ||
    q.qualificationAttemptsSha256 !== (await shaFile(attemptsPath)) ||
    q.performanceSamplesSha256 !== (await shaFile(performancePath)) ||
    q.quality.rawResultsSha256 !== (await shaFile(rawPath)) ||
    q.quality.resultIndexSha256 !== (await shaFile(indexPath))
  )
    throw new Error(
      `Non-pass qualification evidence invalid: ${entry.profileId}`,
    );
  return nonPassingProfile({
    entry,
    item,
    assets,
    performance,
    decision: q.decision,
    failureCategory: q.failureCategory,
  });
}

async function passingProfile(entry, item, assets, performance) {
  const q = item.value,
    archive = await archiveIdentity(assets, q, entry.profileId);
  return {
    profileId: entry.profileId,
    languageMode: entry.languageMode,
    platform: entry.platform,
    architecture: entry.architecture,
    packageId: entry.packageId,
    providerId: entry.providerId,
    modelId: entry.modelId,
    candidateDecision: entry.decision,
    recipeSha256: q.buildInputRecipeSha256,
    provenanceSha256: q.buildInputProvenanceSha256,
    nativeBuildEnvironmentSha256: q.nativeBuildEnvironmentSha256,
    repositoryBuildLockSha256: q.repositoryBuildLockSha256,
    goToolchainRootTreeSha256: q.goToolchainRootTreeSha256,
    buildReportSha256: q.buildReportSha256,
    reproducibilityProofSha256: q.reproducibilityProofSha256,
    archive,
    descriptorSha256: q.descriptorSha256,
    fileManifestSha256: q.fileManifestSha256,
    launcherSha256: q.launcherSha256,
    launcherPlanSha256: q.launcherPlanSha256,
    hostSha256: q.hostSha256,
    engineConfigurationSha256: q.engineConfigurationSha256,
    modelSha256: q.modelSha256,
    normalizerSha256: q.normalizerSha256,
    protocolSha256: q.protocolSha256,
    capabilityDigest: q.capabilityDigest,
    noticeInventorySha256: q.noticeInventorySha256,
    generatedComplianceSha256: q.generatedComplianceSha256,
    preflightSha256: q.preflightSha256,
    sandboxProfileSha256: q.sandboxProfileSha256,
    corpusManifestSha256: q.corpus.manifestSha256,
    baselineSha256: q.quality.baseline.evidenceSha256,
    rawResultsSha256: q.quality.rawResultsSha256,
    resultIndexSha256: q.quality.resultIndexSha256,
    qualificationSummarySha256: await shaFile(item.file),
    runtimeConformanceSha256: q.runtimeConformanceSha256,
    qualificationAttemptsSha256: q.qualificationAttemptsSha256,
    attempts: q.attempts,
    performance: performanceView(q, performance),
    quality: q.quality,
    limitations: q.corpus.limitations,
    outcomes: {
      actualPlatform: q.actualPlatform,
      normalizationFixtures: q.normalizationFixtures,
      relocation: q.relocation,
      offline: q.offline,
      noPackageMutation: q.noPackageMutation,
      recovery: q.recovery,
      licenseApproved: q.licenseApproved,
    },
    decision: "pass",
  };
}

async function nonPassingProfile({
  entry,
  item,
  assets,
  performance,
  decision,
  failureCategory,
}) {
  const q = item.value;
  return {
    profileId: entry.profileId,
    languageMode: entry.languageMode,
    platform: entry.platform,
    architecture: entry.architecture,
    packageId: entry.packageId,
    providerId: entry.providerId,
    modelId: entry.modelId,
    candidateDecision: entry.decision,
    buildReportSha256: q.buildReportSha256,
    nativeBuildEnvironmentSha256: q.nativeBuildEnvironmentSha256,
    preflightSha256: q.preflightSha256,
    archive: await archiveIdentity(assets, q, entry.profileId),
    qualificationSummarySha256: await shaFile(item.file),
    qualificationAttemptsSha256: q.qualificationAttemptsSha256,
    performanceSamplesSha256: q.performanceSamplesSha256,
    rawResultsSha256: q.quality.rawResultsSha256,
    resultIndexSha256: q.quality.resultIndexSha256,
    attempts: q.attempts,
    performance: performanceView(q, performance),
    failureCategory,
    decision,
  };
}

async function archiveIdentity(assets, q, profileId) {
  const archivePath = path.join(assets, q.archive.fileName),
    archiveStat = await fs.stat(archivePath);
  if ((await shaFile(archivePath)) !== q.archive.sha256)
    throw new Error(`Qualified archive mismatch: ${profileId}`);
  return {
    fileName: q.archive.fileName,
    sizeBytes: archiveStat.size,
    sha256: q.archive.sha256,
    extractedSizeBytes: q.archive.extractedSizeBytes,
    entryCount: q.archive.entryCount,
  };
}

function performanceView(q, performance) {
  return {
    coldCount: performance.cold.length,
    warmPreparationCount: performance.warmPreparation.length,
    warmRequestCount: performance.warm.length,
    failures: q.attempts.failed,
    timeouts: q.attempts.timeouts,
    samplesSha256: q.performanceSamplesSha256,
  };
}

export function enforceThresholds(q, performance) {
  if (
    performance.cacheExecutions.length !== 30 ||
    performance.cold.length !== 30 ||
    performance.warmPreparation.length !== 30 ||
    performance.warm.length !== 100
  )
    throw new Error("Qualification must contain exact 30/30/100 trials.");
  for (const metric of [
    q.handshake,
    q.coldPreparation,
    q.warmPreparation,
    q.coldResult,
    q.warmRequest,
  ])
    if (metric.failures || metric.timeouts)
      throw new Error("Qualification contains failed or excluded trials.");
  if (
    q.handshake.count !== 30 ||
    q.coldPreparation.count !== 30 ||
    q.warmPreparation.count !== 30 ||
    q.coldResult.count !== 30 ||
    q.warmRequest.count !== 100 ||
    q.handshake.p95Ms > 1000 ||
    q.coldPreparation.p95Ms > 20000 ||
    q.warmPreparation.p95Ms > 10000 ||
    q.coldResult.p95Ms > 25000 ||
    q.warmRequest.p95Ms > 10000 ||
    q.maxRssBytes > 2684354560 ||
    q.extractedSizeBytes > 1342177280 ||
    q.quality.failedCount ||
    q.quality.emptyCount ||
    q.quality.sampleCount !== q.quality.baseline.sampleCount
  )
    throw new Error("Qualification threshold/count gate failed.");
  const max = q.profileId === "english" ? 0.08 : 0.07,
    metric = q.profileId === "english" ? "WER" : "CER";
  if (
    q.quality.metric !== metric ||
    q.quality.value > max ||
    q.quality.value - q.quality.baseline.value > 0.005000000001
  )
    throw new Error("Qualification quality/non-regression gate failed.");
}

export function qualificationSetDecision(profiles) {
  return profiles.some((profile) => profile.decision === "fail")
    ? "fail"
    : profiles.some((profile) => profile.decision === "blocked")
      ? "blocked"
      : "pass";
}

async function validate(value) {
  const schema = await readJson(
      path.join(ROOT, "contracts/release/qualification-set-v1.schema.json"),
    ),
    check = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!check(value))
    throw new Error(
      `Qualification Set invalid: ${JSON.stringify(check.errors)}`,
    );
  const expected = qualificationSetDecision(value.profiles);
  if (value.decision !== expected)
    throw new Error("Qualification Set decision does not match profiles.");
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "qualifications",
    "assets",
    "source-commit",
    "runner-commit",
    "test-commit",
    "output",
  ]);
  const result = await assembleQualificationSet({
    qualifications: args.qualifications,
    assets: args.assets,
    sourceCommit: args["source-commit"],
    runnerCommit: args["runner-commit"],
    testCommit: args["test-commit"],
    output: args.output,
  });
  if (result.decision !== "pass")
    throw new Error(`Qualification Set decision: ${result.decision}`);
}
