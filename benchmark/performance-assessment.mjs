import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, ROOT, shaFile, writeJson } from "../build/lib/files.mjs";
import { assertPassingDarwinArm64Preflight } from "./darwin-arm64-preflight-contract.mjs";
import { verifyPreparationStageEvidence } from "./preparation-diagnostics.mjs";
import {
  assertCompletePerformanceSamples,
  buildPerformanceMetrics,
  classifyPerformanceAssessment,
} from "./performance-observation.mjs";

const assessmentSchema = await readJson(
    path.join(
      ROOT,
      "contracts/qualification/performance-assessment-v1.schema.json",
    ),
  ),
  summarySchema = await readJson(
    path.join(
      ROOT,
      "contracts/qualification/profile-qualification-summary-v2.schema.json",
    ),
  ),
  ajv = new Ajv2020({ allErrors: true, strict: true }),
  validateAssessment = ajv.compile(assessmentSchema),
  validateSummary = ajv.compile(summarySchema);

export async function writePerformanceAssessment({
  output,
  summaryPath,
  preflightPath,
  performanceSamplesPath,
  qualificationAttemptsPath,
}) {
  const summary = await readJson(summaryPath),
    preflight = await readJson(preflightPath),
    samples = await readJson(performanceSamplesPath),
    attempts = await readJson(qualificationAttemptsPath),
    assessment = await buildPerformanceAssessment({
      summary,
      summaryPath,
      preflight,
      preflightPath,
      samples,
      attempts,
      performanceSamplesPath,
      qualificationAttemptsPath,
    });
  assertValid(validateAssessment, assessment, "Performance Assessment");
  await writeJson(path.resolve(output), assessment);
  return assessment;
}

export async function verifyPerformanceAssessment({
  summaryPath,
  assessmentPath,
  preflightPath,
  performanceSamplesPath,
  qualificationAttemptsPath,
}) {
  const summary = await readJson(summaryPath),
    assessment = await readJson(assessmentPath),
    preflight = await readJson(preflightPath),
    samples = await readJson(performanceSamplesPath);
  const attempts = await readJson(qualificationAttemptsPath);
  assertValid(validateSummary, summary, "Qualification Summary");
  assertValid(validateAssessment, assessment, "Performance Assessment");
  await assertPassingDarwinArm64Preflight(preflight);
  const expected = await buildPerformanceAssessment({
    summary,
    summaryPath,
    preflight,
    preflightPath,
    samples,
    attempts,
    performanceSamplesPath,
    qualificationAttemptsPath,
  });
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-assessment-"));
  try {
    const expectedPath = path.join(work, "performance-assessment-v1.json");
    await writeJson(expectedPath, expected);
    if (
      !Buffer.from(await fs.readFile(assessmentPath)).equals(
        await fs.readFile(expectedPath),
      )
    )
      throw new Error("Performance Assessment does not recompute.");
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
  return { summary, assessment, preflight, samples };
}

async function buildPerformanceAssessment({
  summary,
  summaryPath,
  preflight,
  preflightPath,
  samples,
  attempts,
  performanceSamplesPath,
  qualificationAttemptsPath,
}) {
  assertValid(validateSummary, summary, "Qualification Summary");
  await assertPassingDarwinArm64Preflight(preflight);
  if (
    summary.preflight.fileName !== path.basename(preflightPath) ||
    summary.preflight.sha256 !== (await shaFile(preflightPath)) ||
    summary.rawEvidence.performanceSamples.fileName !==
      path.basename(performanceSamplesPath) ||
    summary.rawEvidence.performanceSamples.sha256 !==
      (await shaFile(performanceSamplesPath)) ||
    summary.rawEvidence.qualificationAttempts.fileName !==
      path.basename(qualificationAttemptsPath) ||
    summary.rawEvidence.qualificationAttempts.sha256 !==
      (await shaFile(qualificationAttemptsPath))
  )
    throw new Error("Summary raw/preflight identities do not match inputs.");
  await verifyPreparationBinding(summary, summaryPath, attempts);
  const attemptCounts = {
    started: attempts.attempts.length,
    succeeded: attempts.attempts.filter((item) => item.status === "succeeded")
      .length,
    failed: attempts.attempts.filter((item) => item.status === "failed").length,
    timedOut: attempts.attempts.filter((item) => item.timeout).length,
    excluded: 0,
  };
  if (JSON.stringify(attemptCounts) !== JSON.stringify(summary.attempts))
    throw new Error("Assessment attempt identities do not match Summary.");
  if (summary.functionalDecision === "pass")
    assertCompletePerformanceSamples(samples);
  const metrics = buildPerformanceMetrics(samples),
    performanceEnvironment = preflight.performanceEnvironment.classification,
    assessment = classifyPerformanceAssessment(performanceEnvironment, metrics),
    resourceOptimization = buildResourceOptimization(
      summary.resourcePolicy,
      summary.maxRssBytes,
    );
  return {
    schemaVersion: 1,
    artifactKind: "performance-assessment",
    packageId: summary.packageId,
    profileId: summary.profileId,
    target: `${summary.target.platform}-${summary.target.architecture}`,
    qualificationSummary: {
      fileName: path.basename(summaryPath),
      sha256: await shaFile(summaryPath),
    },
    preflight: summary.preflight,
    performanceSamples: summary.rawEvidence.performanceSamples,
    qualificationAttempts: summary.rawEvidence.qualificationAttempts,
    preparationStageEvidence: summary.rawEvidence.preparationStageEvidence,
    preparationEvidence: summary.preparationEvidence,
    performanceEnvironment,
    attempts: attemptCounts,
    hardDeadlines: summary.hardDeadlines,
    resourcePolicy: summary.resourcePolicy,
    resourceOptimization,
    metrics,
    peakProcessTreeRssBytes: summary.maxRssBytes,
    extractedSizeBytes: summary.extractedSizeBytes,
    assessment,
  };
}

export async function verifyPreparationBinding(summary, summaryPath, attempts) {
  const identity = summary.rawEvidence.preparationStageEvidence;
  if (summary.profileId === "english") {
    if (identity !== null || summary.preparationEvidence !== null)
      throw new Error(
        "English qualification must not bind Chinese diagnostics.",
      );
    return;
  }
  if (!identity || !summary.preparationEvidence)
    throw new Error("Chinese preparation evidence binding is missing.");
  const file = path.join(path.dirname(summaryPath), identity.fileName),
    evidence = await verifyPreparationStageEvidence(file),
    preparationAttempts = attempts.attempts.filter(
      (item) => item.phase !== "warm-request",
    );
  if (
    (await shaFile(file)) !== identity.sha256 ||
    JSON.stringify(evidence.diagnosticContract) !==
      JSON.stringify(summary.preparationEvidence.diagnosticContract) ||
    JSON.stringify(evidence.stageEvidenceSchema) !==
      JSON.stringify(summary.preparationEvidence.stageEvidenceSchema) ||
    evidence.qualificationClock !==
      summary.preparationEvidence.qualificationClock ||
    evidence.attempts.length !== summary.preparationEvidence.attemptCount ||
    evidence.attempts.length !== preparationAttempts.length ||
    evidence.attempts.some((item, index) => {
      const ledgerAttempt = preparationAttempts[index];
      return (
        item.attemptSequence !== ledgerAttempt.sequence ||
        (item.outcome === "failure" && ledgerAttempt.status !== "failed") ||
        (item.outcome === "success" &&
          !Number.isFinite(ledgerAttempt.timings?.preparationMs))
      );
    }) ||
    evidence.attempts.filter((item) => item.diagnosticValidation === "pass")
      .length !== summary.preparationEvidence.validAttemptCount ||
    (evidence.attempts.every((item) => item.privacyDecision === "pass")
      ? "pass"
      : "fail") !== summary.preparationEvidence.privacyDecision
  )
    throw new Error("Chinese preparation evidence binding mismatch.");
}

export function buildResourceOptimization(resourcePolicy, observedBytes) {
  const targetBytes = resourcePolicy?.row?.assessmentOptimizationTargetBytes;
  if (
    !Number.isSafeInteger(targetBytes) ||
    targetBytes <= 0 ||
    !Number.isSafeInteger(observedBytes) ||
    observedBytes < 0
  )
    throw new Error("Resource optimization observation is invalid.");
  return {
    targetBytes,
    observedPeakProcessTreeRssBytes: observedBytes,
    targetMet: observedBytes > 0 && observedBytes <= targetBytes,
  };
}

function assertValid(validate, value, label) {
  if (!validate(value))
    throw new Error(`${label} invalid: ${JSON.stringify(validate.errors)}`);
}
