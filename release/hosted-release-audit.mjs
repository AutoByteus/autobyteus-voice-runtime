#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parsePairs } from "../build/lib/files.mjs";

export const HOSTED_RELEASE_PHASES = Object.freeze([
  "checkout",
  "setup-node",
  "setup-go",
  "source-admission",
  "hosted-toolchain",
  "input-hydration",
  "host-construction",
  "release-composition",
  "publication",
  "postpublication-verification",
  "quarantine",
]);
const PRIMARY_PHASES = HOSTED_RELEASE_PHASES.slice(0, -1),
  GITHUB_OUTCOMES = new Set(["success", "failure", "cancelled", "skipped"]),
  AUDIT_OUTCOMES = new Set([
    "pending",
    "succeeded",
    "failed",
    "cancelled",
    "unattempted",
  ]);

export async function initializeHostedReleaseAudit({
  output,
  repository,
  workflowRunId,
  workflowRunAttempt,
  workflowCheckoutCommit,
  runnerLabel,
  releaseTag,
  runtimeVersion,
}) {
  const record = {
    schemaVersion: 1,
    artifactKind: "hosted-release-audit",
    repository,
    workflowRunId,
    workflowRunAttempt,
    workflowCheckoutCommit,
    runnerLabel,
    releaseTag,
    runtimeVersion,
    phases: HOSTED_RELEASE_PHASES.map((phase) => ({
      phase,
      outcome: phase === "checkout" ? "succeeded" : "pending",
    })),
    decision: "in-progress",
    failureCategory: null,
  };
  validateAudit(record);
  await writeAtomic(output, record);
  return record;
}

export async function finalizeHostedReleaseAudit({ input, output, outcomes }) {
  const record = JSON.parse(await fs.readFile(input, "utf8"));
  validateAudit(record);
  assertExactOutcomes(outcomes);
  record.phases = HOSTED_RELEASE_PHASES.map((phase) => ({
    phase,
    outcome: translateOutcome(outcomes[phase]),
  }));
  const incomplete = record.phases.find(
    ({ phase, outcome }) =>
      PRIMARY_PHASES.includes(phase) && outcome !== "succeeded",
  );
  record.decision = incomplete ? "fail" : "pass";
  record.failureCategory = incomplete
    ? `${incomplete.phase}-${failureSuffix(incomplete.outcome)}`
    : null;
  validateAudit(record);
  await writeAtomic(output, record);
  return record;
}

function assertExactOutcomes(outcomes) {
  if (
    Object.keys(outcomes).sort().join("\n") !==
    [...HOSTED_RELEASE_PHASES].sort().join("\n")
  )
    throw new Error("Hosted release audit phase set is not exact.");
  for (const outcome of Object.values(outcomes))
    if (!GITHUB_OUTCOMES.has(outcome))
      throw new Error("Hosted release audit received an invalid step outcome.");
}

function translateOutcome(outcome) {
  return {
    success: "succeeded",
    failure: "failed",
    cancelled: "cancelled",
    skipped: "unattempted",
  }[outcome];
}

function failureSuffix(outcome) {
  return {
    failed: "failed",
    cancelled: "cancelled",
    unattempted: "unattempted",
  }[outcome];
}

function validateAudit(record) {
  if (
    record.schemaVersion !== 1 ||
    record.artifactKind !== "hosted-release-audit" ||
    record.repository !== "AutoByteus/autobyteus-voice-runtime" ||
    !/^\d+$/.test(record.workflowRunId) ||
    !/^\d+$/.test(record.workflowRunAttempt) ||
    !/^[a-f0-9]{40}$/.test(record.workflowCheckoutCommit) ||
    record.runnerLabel !== "macos-26" ||
    record.releaseTag !== "v1.0.0" ||
    record.runtimeVersion !== "1.0.0" ||
    !Array.isArray(record.phases) ||
    record.phases.length !== HOSTED_RELEASE_PHASES.length ||
    !["in-progress", "fail", "pass"].includes(record.decision)
  )
    throw new Error("Hosted Release Audit 1 identity is invalid.");
  for (let index = 0; index < HOSTED_RELEASE_PHASES.length; index += 1) {
    const row = record.phases[index];
    if (
      row?.phase !== HOSTED_RELEASE_PHASES[index] ||
      Object.keys(row).sort().join("/") !== "outcome/phase" ||
      !AUDIT_OUTCOMES.has(row.outcome)
    )
      throw new Error("Hosted Release Audit 1 phase projection is invalid.");
  }
  const incomplete = record.phases.find(
      ({ phase, outcome }) =>
        PRIMARY_PHASES.includes(phase) && outcome !== "succeeded",
    ),
    initial = record.phases.every(
      ({ phase, outcome }) =>
        outcome === (phase === "checkout" ? "succeeded" : "pending"),
    ),
    expectedFailure =
      incomplete && incomplete.outcome !== "pending"
        ? `${incomplete.phase}-${failureSuffix(incomplete.outcome)}`
        : null;
  if (
    (record.decision === "in-progress" &&
      (!initial || record.failureCategory !== null)) ||
    (record.decision === "pass" &&
      (incomplete ||
        record.failureCategory !== null ||
        record.phases.at(-1).outcome !== "unattempted")) ||
    (record.decision === "fail" &&
      (!expectedFailure || record.failureCategory !== expectedFailure))
  )
    throw new Error("Hosted Release Audit 1 terminal outcome is invalid.");
}

async function writeAtomic(output, record) {
  const target = path.resolve(output),
    temporary = `${target}.tmp-${process.pid}`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, {
    flag: "wx",
  });
  await fs.rename(temporary, target);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [operation, ...values] = process.argv.slice(2);
  if (operation === "initialize") {
    const args = parsePairs(values, [
      "output",
      "repository",
      "workflow-run-id",
      "workflow-run-attempt",
      "workflow-checkout-commit",
      "runner-label",
      "release-tag",
      "runtime-version",
    ]);
    await initializeHostedReleaseAudit({
      output: args.output,
      repository: args.repository,
      workflowRunId: args["workflow-run-id"],
      workflowRunAttempt: args["workflow-run-attempt"],
      workflowCheckoutCommit: args["workflow-checkout-commit"],
      runnerLabel: args["runner-label"],
      releaseTag: args["release-tag"],
      runtimeVersion: args["runtime-version"],
    });
  } else if (operation === "finalize") {
    const args = parsePairs(values, [
      "input",
      "output",
      ...HOSTED_RELEASE_PHASES,
    ]);
    await finalizeHostedReleaseAudit({
      input: path.resolve(args.input),
      output: path.resolve(args.output),
      outcomes: Object.fromEntries(
        HOSTED_RELEASE_PHASES.map((phase) => [phase, args[phase]]),
      ),
    });
  } else throw new Error("Operation must be initialize or finalize.");
}
