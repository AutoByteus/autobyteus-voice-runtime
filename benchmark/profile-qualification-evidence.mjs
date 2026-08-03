import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { aggregateErrorRate } from "./scoring/error-rate.mjs";
import { pairedBootstrap } from "./baseline/qualification-baseline.mjs";
import { DEADLINES } from "./provider-process-session.mjs";
import { writePerformanceAssessment } from "./performance-assessment.mjs";
import { assertCompletePerformanceSamples } from "./performance-observation.mjs";
import { readJson, ROOT, shaFile, writeJson } from "../build/lib/files.mjs";

const summarySchema = await readJson(
    path.join(
      ROOT,
      "contracts/qualification/profile-qualification-summary-v2.schema.json",
    ),
  ),
  validateSummary = new Ajv2020({ allErrors: true, strict: true }).compile(
    summarySchema,
  );

export async function writeProfileQualificationEvidence({
  output,
  build,
  conditions,
  corpus,
  baseline,
  baselineTrust,
  compliancePath,
  archivePath,
  buildReportPath,
  reproducibilityProofPath,
  nativeBuildEnvironmentPath,
  normalizationFixtures,
  recorder,
  cacheExecutions,
  cold,
  warmPreparation,
  warm,
  raw,
  rss,
  conformancePath = null,
  decision,
  failureCategory = null,
  noPackageMutation = false,
  recovery = false,
}) {
  const rawPath = path.join(output, "raw-results.json"),
    indexPath = path.join(output, "result-index.json"),
    performancePath = path.join(output, "performance-samples-v1.json"),
    attemptPath = path.join(output, "qualification-attempts-v1.json"),
    preflightPath = path.join(output, "darwin-arm64-preflight-v2.json"),
    summaryPath = path.join(output, "qualification-summary-v2.json"),
    assessmentPath = path.join(output, "performance-assessment-v1.json");
  await writeJson(rawPath, {
    schemaVersion: 1,
    packageId: build.packageId,
    results: raw,
  });
  await writeJson(indexPath, {
    schemaVersion: 1,
    results: raw.map((item) => ({
      clipId: item.clipId,
      audioSha256: item.audioSha256,
      outcome: item.outcome,
      errors: item.errors,
      units: item.units,
    })),
  });
  await writeJson(performancePath, {
    schemaVersion: 1,
    cacheProcedure: conditions.executionEnvironment.filesystemCacheProcedure,
    cacheExecutions,
    cold,
    warmPreparation,
    warm,
  });
  const attempts = await recorder.finalize(decision, failureCategory),
    counts = recorder.counts(),
    quality = aggregateErrorRate(raw),
    completeQuality = raw.length === baseline.results.length,
    paired = completeQuality ? pairedBootstrap(raw, baseline.results) : null,
    functional = functionalOutcome({
      requestedDecision: decision,
      failureCategory,
      build,
      baseline,
      attempts,
      counts,
      cacheExecutions,
      cold,
      warmPreparation,
      warm,
      raw,
      rss,
      quality,
      corpusMetric: corpus.manifest.metric,
      maxRssBytes: Math.max(0, ...rss),
      normalizationFixtures,
      noPackageMutation,
      recovery,
      offline: conditions.executionEnvironment.sandbox.networkDenied === true,
    });
  const summary = {
    schemaVersion: 2,
    artifactKind: "profile-qualification-summary",
    functionalDecision: functional.decision,
    failureCategory: functional.failureCategory,
    sourceCommit: build.sourceCommit,
    runnerCommit: conditions.runnerCommit,
    packageVersion: build.packageVersion,
    buildReportSha256: await shaFile(buildReportPath),
    buildInputManifestSha256: build.buildInputManifestSha256,
    buildInputProvenanceSha256: build.buildInputProvenanceSha256,
    buildInputRecipeSha256: build.buildInputRecipeSha256,
    nativeBuildEnvironmentSha256: await shaFile(nativeBuildEnvironmentPath),
    releaseMatrixId: build.releaseMatrixId,
    releaseMatrixSha256: build.releaseMatrixSha256,
    repositoryBuildLockSha256: build.repositoryBuildLockSha256,
    goToolchainHost: build.goToolchainHost,
    goToolchainArchiveSha256: build.goToolchainArchiveSha256,
    goToolchainRootManifestSha256: build.goToolchainRootManifestSha256,
    goToolchainRootTreeSha256: build.goToolchainRootTreeSha256,
    goToolchainRootFileCount: build.goToolchainRootFileCount,
    goToolchainRootSizeBytes: build.goToolchainRootSizeBytes,
    reproducibilityProofSha256: await shaFile(reproducibilityProofPath),
    runtimeConformanceSha256: conformancePath
      ? await shaFile(conformancePath)
      : null,
    preflight: {
      fileName: path.basename(preflightPath),
      sha256: await shaFile(preflightPath),
    },
    rawEvidence: {
      performanceSamples: await fileIdentity(performancePath),
      qualificationAttempts: await fileIdentity(attemptPath),
      rawResults: await fileIdentity(rawPath),
      resultIndex: await fileIdentity(indexPath),
    },
    attempts: {
      started: counts.started,
      succeeded: counts.completed,
      failed: counts.failed,
      timedOut: counts.timeouts,
      excluded: 0,
    },
    hardDeadlines: { ...DEADLINES, violations: counts.timeouts },
    packageId: build.packageId,
    providerId: build.providerId,
    modelId: build.modelId,
    profileId: build.profileId,
    languageMode: build.languageMode,
    target: build.target,
    archive: { ...build.archive, fileName: path.basename(archivePath) },
    capabilityDigest: build.capabilityDigest,
    descriptorSha256: build.descriptorSha256,
    fileManifestSha256: build.fileManifestSha256,
    launcherSha256: build.launcherSha256,
    launcherPlanSha256: build.launcherPlanSha256,
    hostSha256: build.hostSha256,
    engineConfigurationSha256: build.engineConfigurationSha256,
    modelSha256: build.modelSha256,
    normalizerSha256: build.normalizerSha256,
    protocolSha256: build.protocolSha256,
    noticeInventorySha256: build.noticeInventorySha256,
    generatedComplianceSha256: await shaFile(compliancePath),
    sandboxProfileSha256: conditions.executionEnvironment.sandbox.profileSha256,
    conditions,
    corpus: corpus.corpusEvidence,
    quality: {
      metric: corpus.manifest.metric,
      value: quality.value,
      baseline: {
        id: baseline.baselineId,
        evidenceSha256: await shaFile(
          path.join(output, "baseline-evidence.json"),
        ),
        configurationDigest: baseline.configurationDigest,
        providerId: baseline.providerId,
        modelId: baseline.modelId,
        value: baseline.value,
        sampleCount: baseline.results.length,
        trustedCatalogSha256: baselineTrust.catalogSha256,
        promotedResultSha256: baselineTrust.record.promotedResultSha256,
        corpusManifestSha256: baselineTrust.record.corpusManifestSha256,
      },
      pairedUncertainty: paired,
      sampleCount: raw.length,
      emptyCount: raw.filter((item) => item.outcome === "no-speech").length,
      failedCount: attempts.attempts.filter(
        (item) => item.qualityCounted && item.status === "failed",
      ).length,
    },
    maxRssBytes: Math.max(0, ...rss),
    extractedSizeBytes: build.archive.extractedSizeBytes,
    packageRuns: attempts.attempts.filter(
      (item) => item.phase !== "warm-request",
    ).length,
    actualPlatform: true,
    normalizationFixtures,
    relocation: true,
    offline: conditions.executionEnvironment.sandbox.networkDenied === true,
    noPackageMutation,
    recovery,
    licenseApproved: true,
  };
  assertValidSummary(summary);
  await writeJson(summaryPath, summary);
  const assessment = await writePerformanceAssessment({
    output: assessmentPath,
    summaryPath,
    preflightPath,
    performanceSamplesPath: performancePath,
    qualificationAttemptsPath: attemptPath,
  });
  return { summary, assessment };
}

function functionalOutcome({
  requestedDecision,
  failureCategory,
  build,
  baseline,
  attempts,
  counts,
  cacheExecutions,
  cold,
  warmPreparation,
  warm,
  raw,
  rss,
  quality,
  corpusMetric,
  maxRssBytes,
  normalizationFixtures,
  noPackageMutation,
  recovery,
  offline,
}) {
  if (requestedDecision !== "pass")
    return { decision: requestedDecision, failureCategory };
  const qualityLimit = build.profileId === "english" ? 0.08 : 0.07,
    expectedAttemptCount = 60 + Math.max(100, baseline.results.length),
    expectedMetric = build.profileId === "english" ? "WER" : "CER";
  if (
    counts.failed !== 0 ||
    counts.timeouts !== 0 ||
    counts.started !== expectedAttemptCount ||
    counts.completed !== expectedAttemptCount ||
    attempts.attempts.some((item) => item.status !== "succeeded") ||
    cacheExecutions.length !== 30 ||
    cacheExecutions.some(
      (item, index) => item.index !== index || item.completed !== true,
    ) ||
    cold.length !== 30 ||
    warmPreparation.length !== 30 ||
    warm.length !== 100 ||
    raw.length !== baseline.results.length ||
    raw.some((item) => item.outcome === "no-speech") ||
    quality.value > qualityLimit ||
    quality.value - baseline.value > 0.005000000001 ||
    maxRssBytes > 2684354560 ||
    build.archive.extractedSizeBytes > 1342177280 ||
    !normalizationFixtures ||
    !noPackageMutation ||
    !recovery ||
    !offline ||
    !hasCompletePerformanceSamples({ cold, warmPreparation, warm }) ||
    rss.length === 0 ||
    rss.some((value) => !Number.isFinite(value) || value <= 0) ||
    corpusMetric !== expectedMetric
  )
    return { decision: "fail", failureCategory: "functional-gate-failed" };
  return { decision: "pass", failureCategory: null };
}

function hasCompletePerformanceSamples(samples) {
  try {
    assertCompletePerformanceSamples(samples);
    return true;
  } catch {
    return false;
  }
}

async function fileIdentity(file) {
  return { fileName: path.basename(file), sha256: await shaFile(file) };
}

function assertValidSummary(summary) {
  if (!validateSummary(summary))
    throw new Error(
      `Qualification Summary invalid: ${JSON.stringify(validateSummary.errors)}`,
    );
}
