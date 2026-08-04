import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  QualificationAttemptRecorder,
  classifyQualificationFailure,
} from "../../benchmark/qualification-attempts.mjs";
import {
  assertPassingProfileQualification,
  writeProfileQualificationEvidence,
} from "../../benchmark/profile-qualification-evidence.mjs";
import { verifyPerformanceAssessment } from "../../benchmark/performance-assessment.mjs";
import { qualificationSetDecision } from "../../release/evidence/qualification-set.mjs";
import { readJson, shaFile, writeJson } from "../../build/lib/files.mjs";
import { passingDarwinPreflightFixture } from "../fixtures/passing-darwin-preflight.mjs";
import { resolveProfileResourcePolicy } from "../../benchmark/profile-resource-policy.mjs";

test("a started timeout is durable before and after failure", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "voice-attempt-test-"));
  try {
    const file = path.join(temp, "qualification-attempts-v1.json"),
      recorder = await new QualificationAttemptRecorder({
        output: file,
        packageId: "voice.english.fixture.darwin-arm64",
        profileId: "english",
        target: "darwin-arm64",
      }).initialize(),
      sequence = await recorder.start({
        phase: "warm-request",
        index: 4,
        performanceCounted: true,
        qualityCounted: true,
        audioSha256: "a".repeat(64),
      });
    assert.equal((await readJson(file)).attempts[0].status, "started");
    assert.equal(
      classifyQualificationFailure(new Error("RESULT_TIMEOUT")),
      "timeout",
    );
    await recorder.fail(sequence, new Error("RESULT_TIMEOUT"), {
      requestMs: 30000,
    });
    await recorder.finalize("fail", "timeout");
    const result = await readJson(file);
    assert.equal(result.decision, "fail");
    assert.deepEqual(recorder.counts(), {
      started: 1,
      completed: 0,
      failed: 1,
      timeouts: 1,
    });
    assert.equal(result.attempts[0].timeout, true);
    assert.equal(result.attempts[0].audioSha256, "a".repeat(64));
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("production-shaped process loss retains ledger, Summary, and Assessment before terminal failure", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-failure-evidence-"),
  );
  try {
    const files = {};
    for (const name of [
      "build-report.json",
      "reproducibility-proof-v1.json",
      "native-build-environment-v1.json",
      "package-compliance-v1.json",
      "baseline-evidence.json",
    ]) {
      files[name] = path.join(temp, name);
      await writeJson(files[name], { fixture: name });
    }
    const tool = path.join(temp, "tool");
    await fs.writeFile(tool, "fixture tool\n", { mode: 0o755 });
    await writeJson(
      path.join(temp, "darwin-arm64-preflight-v2.json"),
      await passingDarwinPreflightFixture(temp, tool),
    );
    await fs.writeFile(path.join(temp, "fixture.zip"), "fixture archive\n");
    const recorder = await new QualificationAttemptRecorder({
        output: path.join(temp, "qualification-attempts-v1.json"),
        packageId: "voice.english.fixture.darwin-arm64",
        profileId: "english",
        target: "darwin-arm64",
      }).initialize(),
      sequence = await recorder.start({
        phase: "cold",
        index: 0,
        performanceCounted: true,
        qualityCounted: false,
        audioSha256: "a".repeat(64),
      });
    await recorder.fail(sequence, new Error("PROVIDER_STDOUT_CLOSED"));
    const { summary, assessment } = await writeProfileQualificationEvidence({
      output: temp,
      build: buildFixture(),
      conditions: conditionsFixture(),
      corpus: {
        manifest: { metric: "WER" },
        corpusEvidence: {
          id: "fixture-corpus",
          manifestSha256: "d".repeat(64),
          license: "CC-BY-4.0",
          provenanceReference: "fixture",
          consentReferenceDigest: "e".repeat(64),
          limitations: [],
        },
      },
      baseline: {
        baselineId: "fixture-baseline",
        configurationDigest: "f".repeat(64),
        providerId: "fixture-provider",
        modelId: "fixture-model",
        value: 0.1,
        results: [{ errors: 1, units: 10 }],
      },
      baselineTrust: {
        catalogSha256: "1".repeat(64),
        record: {
          promotedResultSha256: "2".repeat(64),
          corpusManifestSha256: "3".repeat(64),
        },
      },
      resourcePolicy: await resolveProfileResourcePolicy(
        "english",
        "darwin-arm64",
      ),
      compliancePath: files["package-compliance-v1.json"],
      archivePath: path.join(temp, "fixture.zip"),
      buildReportPath: files["build-report.json"],
      reproducibilityProofPath: files["reproducibility-proof-v1.json"],
      nativeBuildEnvironmentPath: files["native-build-environment-v1.json"],
      normalizationFixtures: true,
      recorder,
      cacheExecutions: [{ index: 0, completed: true }],
      cold: [],
      warmPreparation: [],
      warm: [],
      raw: [],
      rss: [],
      decision: "fail",
      failureCategory: "process-loss",
    });
    const ledger = await readJson(
      path.join(temp, "qualification-attempts-v1.json"),
    );
    assert.equal(ledger.decision, "fail");
    assert.equal(ledger.failureCategory, "process-loss");
    assert.equal(ledger.attempts[0].failureCategory, "process-loss");
    assert.equal(summary.functionalDecision, "fail");
    assert.equal(summary.failureCategory, "process-loss");
    assert.equal(summary.attempts.started, 1);
    assert.equal(summary.attempts.failed, 1);
    assert.equal(summary.attempts.timedOut, 0);
    assert.equal(assessment.attempts.failed, 1);
    assert.equal(assessment.attempts.timedOut, 0);
    assert.equal(assessment.assessment, "controlled-miss");
    assert.deepEqual(summary.archive, {
      fileName: "fixture.zip",
      sha256: "a".repeat(64),
      compressedSizeBytes: 1,
      extractedSizeBytes: 1,
      entryCount: 1,
    });
    assert.equal(Object.hasOwn(summary.archive, "schemaVersion"), false);
    assert.equal(
      assessment.qualificationSummary.sha256,
      await shaFile(path.join(temp, "qualification-summary-v2.json")),
    );
    assert.equal(Object.hasOwn(summary, "performanceAssessment"), false);
    assert.throws(
      () => assertPassingProfileQualification({ summary, assessment }),
      /Profile qualification decision: fail\/process-loss/,
    );
    await verifyPerformanceAssessment({
      summaryPath: path.join(temp, "qualification-summary-v2.json"),
      assessmentPath: path.join(temp, "performance-assessment-v1.json"),
      preflightPath: path.join(temp, "darwin-arm64-preflight-v2.json"),
      performanceSamplesPath: path.join(temp, "performance-samples-v1.json"),
      qualificationAttemptsPath: path.join(
        temp,
        "qualification-attempts-v1.json",
      ),
    });
    const changedSummary = { ...summary, maxRssBytes: 1 };
    await writeJson(
      path.join(temp, "qualification-summary-v2.json"),
      changedSummary,
    );
    await assert.rejects(
      verifyPerformanceAssessment({
        summaryPath: path.join(temp, "qualification-summary-v2.json"),
        assessmentPath: path.join(temp, "performance-assessment-v1.json"),
        preflightPath: path.join(temp, "darwin-arm64-preflight-v2.json"),
        performanceSamplesPath: path.join(temp, "performance-samples-v1.json"),
        qualificationAttemptsPath: path.join(
          temp,
          "qualification-attempts-v1.json",
        ),
      }),
      /does not recompute|Summary raw\/preflight identities|Performance Assessment/,
    );
    assert.equal(summary.quality.failedCount, 0);
    for (const name of [
      "raw-results.json",
      "result-index.json",
      "performance-samples-v1.json",
      "qualification-attempts-v1.json",
      "qualification-summary-v2.json",
      "performance-assessment-v1.json",
    ])
      await fs.access(path.join(temp, name));
    assert.equal(
      qualificationSetDecision([
        { functionalDecision: "pass" },
        { functionalDecision: "fail" },
      ]),
      "fail",
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

function buildFixture() {
  const sha = "a".repeat(64);
  return {
    schemaVersion: 1,
    sourceCommit: "a".repeat(40),
    packageVersion: "1.0.0",
    buildInputManifestSha256: sha,
    buildInputProvenanceSha256: sha,
    buildInputRecipeSha256: sha,
    releaseMatrixId: "voice-runtime-darwin-arm64-v1",
    releaseMatrixSha256: sha,
    repositoryBuildLockSha256: sha,
    goToolchainHost: { platform: "darwin", architecture: "arm64" },
    goToolchainArchiveSha256: sha,
    goToolchainRootManifestSha256: sha,
    goToolchainRootTreeSha256: sha,
    goToolchainRootFileCount: 1,
    goToolchainRootSizeBytes: 1,
    packageId: "voice.english.fixture.darwin-arm64",
    providerId: "fixture-provider",
    modelId: "fixture-model",
    profileId: "english",
    languageMode: "en",
    target: { platform: "darwin", architecture: "arm64" },
    archive: {
      schemaVersion: 1,
      sha256: sha,
      compressedSizeBytes: 1,
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

function conditionsFixture() {
  return {
    runnerCommit: "a".repeat(40),
    preflight: { sha256: "b".repeat(64) },
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
