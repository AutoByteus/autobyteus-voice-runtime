import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { QualificationAttemptRecorder } from "../../benchmark/qualification-attempts.mjs";
import {
  assertPassingProfileQualification,
  writeProfileQualificationEvidence,
} from "../../benchmark/profile-qualification-evidence.mjs";
import {
  assembleQualificationSet,
  assertPassingQualificationSet,
} from "../../release/evidence/qualification-set.mjs";
import { loadCurrentReleaseMatrix } from "../../release/current-release-matrix.mjs";
import { readJson, shaFile, writeJson } from "../../build/lib/files.mjs";
import { passingDarwinPreflightFixture } from "../fixtures/passing-darwin-preflight.mjs";

const commit = "a".repeat(40);

test("a post-attempt functional breach controls ledger, profile exit, and retained QSet", async () => {
  const temp = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-functional-gate-retention-"),
    ),
    qualifications = path.join(temp, "qualifications"),
    assets = path.join(temp, "assets"),
    qsetPath = path.join(temp, "qualification-set-v2.json");
  try {
    await fs.mkdir(qualifications);
    await fs.mkdir(assets);
    const matrix = await loadCurrentReleaseMatrix(),
      profileResults = [];
    for (const entry of matrix.value.entries)
      profileResults.push(
        await writeQualityFailureFixture({
          directory: path.join(qualifications, entry.profileId),
          assets,
          entry,
          matrix,
        }),
      );

    for (const { directory, evidence } of profileResults) {
      const ledger = await readJson(
        path.join(directory, "qualification-attempts-v1.json"),
      );
      assert.equal(evidence.summary.functionalDecision, "fail");
      assert.equal(evidence.summary.failureCategory, "functional-gate-failed");
      assert.equal(ledger.decision, evidence.summary.functionalDecision);
      assert.equal(ledger.failureCategory, evidence.summary.failureCategory);
      assert.equal(evidence.assessment.assessment, "controlled-pass");
      assert.ok(
        ledger.attempts.every((attempt) => attempt.status === "succeeded"),
      );
      assert.throws(
        () => assertPassingProfileQualification(evidence),
        /Profile qualification decision: fail\/functional-gate-failed/,
      );
    }

    const qset = await assembleQualificationSet({
      qualifications,
      assets,
      sourceCommit: commit,
      runnerCommit: commit,
      testCommit: commit,
      output: qsetPath,
    });
    assert.equal(qset.functionalDecision, "fail");
    assert.equal(qset.performanceAssessment, "controlled-pass");
    assert.ok(
      qset.profiles.every(
        (profile) =>
          profile.functionalDecision === "fail" &&
          profile.failureCategory === "functional-gate-failed",
      ),
    );
    assert.deepEqual(await readJson(qsetPath), qset);
    assert.throws(
      () => assertPassingQualificationSet(qset),
      /Qualification Set decision: fail/,
    );
    assert.deepEqual(await readJson(qsetPath), qset);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

async function writeQualityFailureFixture({
  directory,
  assets,
  entry,
  matrix,
}) {
  await fs.mkdir(directory, { recursive: true });
  const toolPath = path.join(directory, "tool");
  await fs.writeFile(toolPath, "fixture tool\n", { mode: 0o755 });
  await writeJson(
    path.join(directory, "darwin-arm64-preflight-v2.json"),
    await passingDarwinPreflightFixture(directory, toolPath),
  );

  const archivePath = path.join(
      assets,
      `voice-${entry.profileId}-darwin-arm64-1.0.0.zip`,
    ),
    nativeEnvironmentPath = path.join(
      directory,
      "native-build-environment-v1.json",
    ),
    buildReportPath = path.join(directory, "build-report.json"),
    reproducibilityPath = path.join(directory, "reproducibility-proof-v1.json"),
    compliancePath = path.join(directory, "package-compliance-v1.json"),
    baselinePath = path.join(directory, "baseline-evidence.json");
  await fs.writeFile(archivePath, `${entry.profileId} archive bytes\n`);
  await writeJson(nativeEnvironmentPath, { fixture: "native-environment" });
  await writeJson(reproducibilityPath, { fixture: "reproducibility" });
  await writeJson(compliancePath, { decision: "pass" });
  await writeJson(path.join(directory, "input-provenance-v1.json"), {
    repository: { sourceCommit: commit },
  });

  const sampleCount = entry.profileId === "english" ? 49 : 200,
    baselineResults = Array.from({ length: sampleCount }, (_, index) => ({
      clipId: `clip-${index}`,
      audioSha256: index.toString(16).padStart(64, "0"),
      errors: 0,
      units: 10,
    })),
    baseline = {
      baselineId: `${entry.profileId}-fixture-baseline`,
      configurationDigest: "f".repeat(64),
      providerId: entry.providerId,
      modelId: entry.modelId,
      value: 0,
      results: baselineResults,
    };
  await writeJson(baselinePath, baseline);

  const build = await buildFixture({
    entry,
    matrix,
    archivePath,
    nativeEnvironmentPath,
    provenancePath: path.join(directory, "input-provenance-v1.json"),
  });
  await writeJson(buildReportPath, build);
  const recorder = await completedRecorder({ directory, entry, sampleCount }),
    performance = completePerformanceSamples(),
    raw = baselineResults.map((item) => ({
      ...item,
      reference: "approved reference",
      rawText: "wrong",
      normalizedText: "wrong",
      outcome: "transcript",
      detectedLanguage: entry.languageMode,
      errors: 1,
      units: 1,
    })),
    evidence = await writeProfileQualificationEvidence({
      output: directory,
      build,
      conditions: conditionsFixture(entry),
      corpus: {
        manifest: { metric: entry.profileId === "english" ? "WER" : "CER" },
        corpusEvidence: {
          id: `${entry.profileId}-fixture-corpus`,
          manifestSha256: "d".repeat(64),
          license: "CC-BY-4.0",
          provenanceReference: "fixture",
          consentReferenceDigest: "e".repeat(64),
          limitations: [],
        },
      },
      baseline,
      baselineTrust: {
        catalogSha256: "1".repeat(64),
        record: {
          promotedResultSha256: "2".repeat(64),
          corpusManifestSha256: "3".repeat(64),
        },
      },
      compliancePath,
      archivePath,
      buildReportPath,
      reproducibilityProofPath: reproducibilityPath,
      nativeBuildEnvironmentPath: nativeEnvironmentPath,
      normalizationFixtures: true,
      recorder,
      cacheExecutions: Array.from({ length: 30 }, (_, index) => ({
        index,
        completed: true,
      })),
      ...performance,
      raw,
      rss: [1024],
      decision: "pass",
      failureCategory: null,
      noPackageMutation: true,
      recovery: true,
    });
  return { directory, evidence };
}

async function buildFixture({
  entry,
  matrix,
  archivePath,
  nativeEnvironmentPath,
  provenancePath,
}) {
  const sha = "b".repeat(64),
    archive = await fs.stat(archivePath);
  return {
    schemaVersion: 1,
    sourceCommit: commit,
    packageVersion: "1.0.0",
    buildInputManifestSha256: sha,
    buildInputProvenanceSha256: await shaFile(provenancePath),
    buildInputRecipeSha256: sha,
    nativeBuildEnvironmentSha256: await shaFile(nativeEnvironmentPath),
    releaseMatrixId: matrix.value.matrixId,
    releaseMatrixSha256: matrix.sha256,
    repositoryBuildLockSha256: sha,
    goToolchainHost: { platform: "darwin", architecture: "arm64" },
    goToolchainArchiveSha256: sha,
    goToolchainRootManifestSha256: sha,
    goToolchainRootTreeSha256: sha,
    goToolchainRootFileCount: 1,
    goToolchainRootSizeBytes: 1,
    packageId: entry.packageId,
    providerId: entry.providerId,
    modelId: entry.modelId,
    profileId: entry.profileId,
    languageMode: entry.languageMode,
    target: { platform: entry.platform, architecture: entry.architecture },
    archive: {
      sha256: await shaFile(archivePath),
      compressedSizeBytes: archive.size,
      extractedSizeBytes: 1,
      entryCount: 1,
    },
    capabilityDigest: sha,
    descriptorSha256: sha,
    fileManifestSha256: sha,
    launcherSha256: sha,
    launcherPlanSha256: sha,
    hostSha256: sha,
    engineConfigurationSha256: sha,
    modelSha256: sha,
    normalizerSha256: sha,
    protocolSha256: sha,
    noticeInventorySha256: sha,
  };
}

async function completedRecorder({ directory, entry, sampleCount }) {
  const recorder = await new QualificationAttemptRecorder({
    output: path.join(directory, "qualification-attempts-v1.json"),
    packageId: entry.packageId,
    profileId: entry.profileId,
    target: "darwin-arm64",
  }).initialize();
  recorder.record.attempts = [
    ...attemptsForPhase("cold", 30, true, false),
    ...attemptsForPhase("warm-preparation", 30, true, false),
    ...attemptsForPhase("warm-request", Math.max(100, sampleCount), true, true),
  ].map((attempt, sequence) => ({ ...attempt, sequence }));
  await recorder.write();
  return recorder;
}

function attemptsForPhase(phase, count, performance, quality) {
  return Array.from({ length: count }, (_, index) => ({
    sequence: 0,
    phase,
    index,
    performanceCounted: performance && index < 100,
    qualityCounted: quality,
    audioSha256:
      phase === "warm-preparation"
        ? null
        : index.toString(16).padStart(64, "0"),
    status: "succeeded",
    outcome: phase === "warm-preparation" ? null : "transcript",
    failureCategory: null,
    timeout: false,
    timings:
      phase === "cold"
        ? { handshakeMs: 1, preparationMs: 1, resultMs: 1, requestMs: 1 }
        : phase === "warm-preparation"
          ? { preparationMs: 1 }
          : { requestMs: 1 },
  }));
}

function completePerformanceSamples() {
  return {
    cold: Array.from({ length: 30 }, () => ({
      handshakeMs: 1,
      preparationMs: 1,
      coldResultMs: 1,
      requestMs: 1,
    })),
    warmPreparation: Array.from({ length: 30 }, () => ({
      preparationMs: 1,
    })),
    warm: Array.from({ length: 100 }, () => ({ requestMs: 1 })),
  };
}

function conditionsFixture(entry) {
  return {
    runnerCommit: commit,
    profileId: entry.profileId,
    target: "darwin-arm64",
    preflight: { sha256: "c".repeat(64) },
    executionEnvironment: {
      sandbox: { profileSha256: "c".repeat(64), networkDenied: true },
      filesystemCacheProcedure: {
        id: "fixture-cache",
        required: true,
        sha256: "d".repeat(64),
      },
    },
  };
}
