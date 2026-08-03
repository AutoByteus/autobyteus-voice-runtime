import path from "node:path";
import { aggregateErrorRate } from "./scoring/error-rate.mjs";
import { pairedBootstrap } from "./baseline/qualification-baseline.mjs";
import { shaFile, writeJson } from "../build/lib/files.mjs";

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
    performancePath = path.join(output, "performance-samples-v1.json");
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
    attemptPath = path.join(output, "qualification-attempts-v1.json"),
    counts = recorder.counts(),
    quality = aggregateErrorRate(raw),
    completeQuality = raw.length === baseline.results.length,
    paired = completeQuality ? pairedBootstrap(raw, baseline.results) : null;
  const summary = {
    schemaVersion: 1,
    decision,
    failureCategory,
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
    performanceSamplesSha256: await shaFile(performancePath),
    qualificationAttemptsSha256: await shaFile(attemptPath),
    attempts: {
      started: counts.started,
      completed: counts.completed,
      failed: counts.failed,
      timeouts: counts.timeouts,
    },
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
    preflightSha256: conditions.preflight.sha256,
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
      rawResultsSha256: await shaFile(rawPath),
      resultIndexSha256: await shaFile(indexPath),
    },
    handshake: latency(
      cold.map((item) => item.handshakeMs),
      failures(recorder, "cold", "handshakeMs"),
    ),
    coldPreparation: latency(
      cold.map((item) => item.preparationMs),
      failures(recorder, "cold", "preparationMs"),
    ),
    warmPreparation: latency(
      warmPreparation.map((item) => item.preparationMs),
      failures(recorder, "warm-preparation"),
    ),
    coldResult: latency(
      cold.map((item) => item.coldResultMs),
      failures(recorder, "cold"),
    ),
    warmRequest: latency(
      warm.map((item) => item.requestMs),
      failures(recorder, "warm-request"),
    ),
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
  await writeJson(path.join(output, "qualification-summary.json"), summary);
  return summary;
}

function failures(recorder, phase, missingTiming = null) {
  return recorder
    .failuresFor(phase)
    .filter(
      (attempt) =>
        !missingTiming || attempt.timings[missingTiming] === undefined,
    );
}

function latency(values, failed) {
  const sorted = [...values].sort((left, right) => left - right),
    pick = (quantile) =>
      sorted[Math.max(0, Math.ceil(quantile * sorted.length) - 1)] ?? 0;
  return {
    count: sorted.length,
    failures: failed.length,
    timeouts: failed.filter((item) => item.timeout).length,
    p50Ms: pick(0.5),
    p95Ms: pick(0.95),
    maxMs: sorted.at(-1) ?? 0,
  };
}
