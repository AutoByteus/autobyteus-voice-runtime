import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, ROOT, shaFile, writeJson } from "../build/lib/files.mjs";
import { assertPassingDarwinArm64Preflight } from "./darwin-arm64-preflight-contract.mjs";
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
    assessment = classifyPerformanceAssessment(performanceEnvironment, metrics);
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
    performanceEnvironment,
    attempts: attemptCounts,
    hardDeadlines: summary.hardDeadlines,
    metrics,
    peakProcessTreeRssBytes: summary.maxRssBytes,
    extractedSizeBytes: summary.extractedSizeBytes,
    assessment,
  };
}

function assertValid(validate, value, label) {
  if (!validate(value))
    throw new Error(`${label} invalid: ${JSON.stringify(validate.errors)}`);
}
