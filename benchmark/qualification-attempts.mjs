import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, ROOT } from "../build/lib/files.mjs";

const schema = await readJson(
    path.join(
      ROOT,
      "contracts/qualification/qualification-attempts-v1.schema.json",
    ),
  ),
  validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

export class QualificationAttemptRecorder {
  constructor({ output, packageId, profileId, target }) {
    this.output = path.resolve(output);
    this.record = {
      schemaVersion: 1,
      packageId,
      profileId,
      target,
      decision: "in-progress",
      failureCategory: null,
      attempts: [],
    };
  }

  async initialize() {
    await this.write();
    return this;
  }

  async start({
    phase,
    index,
    performanceCounted,
    qualityCounted,
    audioSha256 = null,
  }) {
    const attempt = {
      sequence: this.record.attempts.length,
      phase,
      index,
      performanceCounted,
      qualityCounted,
      audioSha256,
      status: "started",
      outcome: null,
      failureCategory: null,
      timeout: false,
      timings: {},
    };
    this.record.attempts.push(attempt);
    await this.write();
    return attempt.sequence;
  }

  async succeed(sequence, { outcome = null, timings = {} } = {}) {
    const attempt = this.pending(sequence);
    attempt.status = "succeeded";
    attempt.outcome = outcome;
    attempt.timings = cleanTimings(timings);
    await this.write();
  }

  async fail(sequence, error, timings = {}) {
    const attempt = this.pending(sequence),
      failureCategory = classifyQualificationFailure(error);
    attempt.status = "failed";
    attempt.failureCategory = failureCategory;
    attempt.timeout = failureCategory === "timeout";
    attempt.timings = cleanTimings(timings);
    await this.write();
    return failureCategory;
  }

  async finalize(decision, failureCategory = null) {
    if (!["pass", "fail", "blocked"].includes(decision))
      throw new Error("Qualification decision invalid.");
    if (
      (decision === "pass" && failureCategory !== null) ||
      (decision !== "pass" && !/^[a-z0-9-]+$/.test(failureCategory ?? ""))
    )
      throw new Error("Qualification decision/category mismatch.");
    if (this.record.attempts.some((attempt) => attempt.status === "started"))
      throw new Error("A started qualification attempt has no outcome.");
    this.record.decision = decision;
    this.record.failureCategory = failureCategory;
    await this.write();
    return structuredClone(this.record);
  }

  snapshot() {
    return structuredClone(this.record);
  }

  counts() {
    const attempts = this.record.attempts;
    return {
      started: attempts.length,
      completed: attempts.filter((item) => item.status === "succeeded").length,
      failed: attempts.filter((item) => item.status === "failed").length,
      timeouts: attempts.filter((item) => item.timeout).length,
    };
  }

  failuresFor(phase, performanceOnly = true) {
    return this.record.attempts.filter(
      (item) =>
        item.phase === phase &&
        (!performanceOnly || item.performanceCounted) &&
        item.status === "failed",
    );
  }

  pending(sequence) {
    const attempt = this.record.attempts[sequence];
    if (!attempt || attempt.status !== "started")
      throw new Error("Qualification attempt is not pending.");
    return attempt;
  }

  async write() {
    if (!validate(this.record))
      throw new Error(
        `Qualification attempts invalid: ${JSON.stringify(validate.errors)}`,
      );
    await fs.mkdir(path.dirname(this.output), { recursive: true });
    const temporary = `${this.output}.tmp-${process.pid}`;
    await fs.writeFile(temporary, `${JSON.stringify(this.record, null, 2)}\n`);
    await fs.rename(temporary, this.output);
  }
}

export function classifyQualificationFailure(error) {
  const message = String(error?.message ?? error ?? "").toUpperCase();
  if (message.includes("CACHE_PROCEDURE_FAILED"))
    return "cache-procedure-failed";
  if (message.includes("TIMEOUT")) return "timeout";
  if (
    /UNEXPECTED_PROCESS_EXIT|PROCESS_TREE_DID_NOT_EXIT|PROVIDER_STDOUT_CLOSED|TRUNCATED_FRAME/.test(
      message,
    )
  )
    return "process-loss";
  if (/FRAME|ILLEGAL_|UTF-?8|JSON/.test(message)) return "malformed-frame";
  if (/WRITE|STDIN/.test(message)) return "write-failure";
  return "provider-failure";
}

export function qualificationDecisionForFailure(failureCategory) {
  return failureCategory === "cache-procedure-failed" ? "blocked" : "fail";
}

export function assertSuccessfulQualificationResult(result) {
  if (
    !result ||
    !["transcript", "no-speech"].includes(result.outcome) ||
    result.type === "request-error"
  )
    throw new Error("QUALIFICATION_REQUEST_FAILED");
}

function cleanTimings(timings) {
  return Object.fromEntries(
    Object.entries(timings).filter(
      ([, value]) => Number.isFinite(value) && value >= 0,
    ),
  );
}
