import path from "node:path";
import { TextDecoder } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import { ProcessTreeRssTimeline } from "./rss-sampler.mjs";
import { readJson, ROOT, shaFile, writeJson } from "../build/lib/files.mjs";

const CONTRACT_PATH = path.join(
    ROOT,
    "contracts/diagnostics/preparation-diagnostics-v1.json",
  ),
  SCHEMA_PATH = path.join(
    ROOT,
    "contracts/qualification/preparation-stage-evidence-v1.schema.json",
  ),
  contract = await readJson(CONTRACT_PATH),
  schema = await readJson(SCHEMA_PATH),
  validateArtifact = new Ajv2020({ allErrors: true, strict: true }).compile(
    schema,
  ),
  prefix = Buffer.from(contract.prefix, "ascii"),
  expected = contract.stages.flatMap((stage, index) => [
    { stage, event: "start", sequence: index * 2 },
    { stage, event: "complete", sequence: index * 2 + 1 },
  ]);

export const PREPARATION_EVIDENCE_AUTHORITIES = Object.freeze({
  diagnosticContract: Object.freeze({
    contractId: contract.contractId,
    fileName: path.basename(CONTRACT_PATH),
    sha256: await shaFile(CONTRACT_PATH),
  }),
  stageEvidenceSchema: Object.freeze({
    fileName: path.basename(SCHEMA_PATH),
    sha256: await shaFile(SCHEMA_PATH),
  }),
  qualificationClock: "qualification-attempt-monotonic-v1",
});

export class PreparationEvidenceCollector {
  constructor({
    attemptSequence,
    pid,
    nowNs = () => process.hrtime.bigint(),
    observeRss,
    onRssObservation = () => {},
    samplingIntervalMs = 10,
  }) {
    if (!Number.isSafeInteger(attemptSequence) || attemptSequence < 0)
      throw new TypeError("Preparation attempt identity is invalid.");
    this.attemptSequence = attemptSequence;
    this.nowNs = nowNs;
    this.originNs = nowNs();
    if (typeof this.originNs !== "bigint")
      throw new TypeError("Preparation monotonic clock must return bigint.");
    this.samplingIntervalMs = samplingIntervalMs;
    this.receivedRecords = [];
    this.failureCodes = [];
    this.redactedLineCount = 0;
    this.privacyDecision = "pass";
    this.buffer = [];
    this.mode = "undecided";
    this.finalized = null;
    this.timeline = new ProcessTreeRssTimeline({
      pid,
      nowUs: () => this.offsetUs(),
      observe: observeRss,
      onObservation: onRssObservation,
    });
  }

  childSpawned() {
    this.timeline.startPeriodic(this.samplingIntervalMs);
  }

  acceptStderrChunk(value) {
    if (this.finalized) return;
    const bytes = Buffer.from(value);
    for (const byte of bytes) {
      if (byte === 0x0a) {
        this.consumeLine(this.offsetUs());
        continue;
      }
      this.acceptByte(byte);
    }
  }

  stderrClosed() {
    this.finishPendingLine();
  }

  async finalize(outcome) {
    if (this.finalized) return this.finalized;
    if (!new Set(["success", "failure"]).has(outcome))
      throw new TypeError("Preparation outcome is invalid.");
    this.finishPendingLine();
    const timeline = await this.timeline.finalize();
    this.failureCodes.push(...timeline.failures);
    let completedStages = [],
      partialStage = null;
    try {
      ({ completedStages, partialStage } = derivePreparationStages({
        attemptSequence: this.attemptSequence,
        receivedRecords: this.receivedRecords,
        rssObservations: timeline.observations,
      }));
    } catch (error) {
      this.fail(classifyEvidenceError(error));
    }
    if (
      outcome === "success" &&
      (this.receivedRecords.length !== 10 ||
        completedStages.length !== 5 ||
        partialStage !== null ||
        completedStages.some((stage) => stage.rssCoverage === "unavailable"))
    )
      this.fail("successful-preparation-evidence-incomplete");
    const failures = [...new Set(this.failureCodes)].sort();
    const attempt = {
      attemptSequence: this.attemptSequence,
      outcome,
      diagnosticValidation: failures.length === 0 ? "pass" : "fail",
      privacyDecision: this.privacyDecision,
      redactedLineCount: this.redactedLineCount,
      failureCodes: failures,
      receivedRecords: structuredClone(this.receivedRecords),
      rssObservations: timeline.observations,
      completedStages,
      partialStage,
      maxRssBytes: Math.max(
        0,
        ...timeline.observations.map((item) => item.rssBytes),
      ),
    };
    assertValidAttemptArtifact(attempt);
    this.finalized = Object.freeze(structuredClone(attempt));
    return this.finalized;
  }

  offsetUs() {
    const current = this.nowNs();
    if (typeof current !== "bigint" || current < this.originNs) {
      this.fail("qualification-clock-regression");
      return 0;
    }
    const value = Number((current - this.originNs) / 1000n);
    if (!Number.isSafeInteger(value)) {
      this.fail("qualification-clock-overflow");
      return Number.MAX_SAFE_INTEGER;
    }
    return value;
  }

  acceptByte(byte) {
    if (this.mode === "redacted" || this.mode === "invalid-prefixed") return;
    this.buffer.push(byte);
    const current = Buffer.from(this.buffer);
    if (
      current.length <= prefix.length &&
      prefix.subarray(0, current.length).equals(current)
    )
      return;
    if (
      current.length >= prefix.length &&
      current.subarray(0, prefix.length).equals(prefix)
    ) {
      this.mode = "prefixed";
      if (current.length > contract.maxLineBytes) {
        this.fail("diagnostic-line-oversized");
        this.buffer = [];
        this.mode = "invalid-prefixed";
      }
      return;
    }
    this.buffer = [];
    this.mode = "redacted";
  }

  consumeLine(receivedAtUs) {
    if (this.mode === "redacted") this.redactLine();
    else if (this.mode !== "invalid-prefixed")
      this.consumePrefixedOrRedacted(Buffer.from(this.buffer), receivedAtUs);
    this.buffer = [];
    this.mode = "undecided";
  }

  consumePrefixedOrRedacted(line, receivedAtUs) {
    if (!line.subarray(0, prefix.length).equals(prefix)) {
      this.redactLine();
      return;
    }
    if (line.length > contract.maxLineBytes) {
      this.fail("diagnostic-line-oversized");
      return;
    }
    if ([...line].some((byte) => byte > 0x7f)) {
      this.fail("diagnostic-utf8-invalid");
      return;
    }
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(
          line.subarray(prefix.length),
        ),
        record = JSON.parse(text),
        canonical = JSON.stringify({
          elapsedUs: record.elapsedUs,
          event: record.event,
          sequence: record.sequence,
          stage: record.stage,
        }),
        expectedRecord = expected[this.receivedRecords.length],
        prior = this.receivedRecords.at(-1);
      if (
        text !== canonical ||
        Object.keys(record).join(",") !== "elapsedUs,event,sequence,stage" ||
        !Number.isSafeInteger(record.elapsedUs) ||
        record.elapsedUs < 0 ||
        !expectedRecord ||
        record.stage !== expectedRecord.stage ||
        record.event !== expectedRecord.event ||
        record.sequence !== expectedRecord.sequence ||
        (prior && prior.record.elapsedUs > record.elapsedUs) ||
        (prior && prior.receivedAtUs > receivedAtUs)
      )
        throw new Error("diagnostic-record-noncanonical");
      this.receivedRecords.push({ record, receivedAtUs });
      this.timeline.ensureObservationAtBoundary(receivedAtUs);
    } catch (error) {
      this.fail(classifyDiagnosticError(error));
    }
  }

  finishPendingLine() {
    if (this.buffer.length === 0 && this.mode === "undecided") return;
    if (this.mode === "redacted") this.redactLine();
    else if (this.mode !== "invalid-prefixed") {
      const current = Buffer.from(this.buffer);
      if (
        current.length > 0 &&
        (prefix
          .subarray(0, Math.min(prefix.length, current.length))
          .equals(
            current.subarray(0, Math.min(prefix.length, current.length)),
          ) ||
          current.subarray(0, prefix.length).equals(prefix))
      )
        this.fail("diagnostic-line-truncated");
      else this.redactLine();
    }
    this.buffer = [];
    this.mode = "undecided";
  }

  redactLine() {
    if (this.redactedLineCount < 1024) this.redactedLineCount += 1;
    else {
      this.privacyDecision = "fail";
      this.fail("redacted-line-limit-exceeded");
    }
  }

  fail(code) {
    this.failureCodes.push(code);
  }
}

export function derivePreparationStages({
  attemptSequence,
  receivedRecords,
  rssObservations,
}) {
  validateTimeline(attemptSequence, receivedRecords, rssObservations);
  const completedStages = [];
  let partialStage = null;
  for (let index = 0; index < receivedRecords.length; index += 2) {
    const start = receivedRecords[index],
      complete = receivedRecords[index + 1];
    if (!complete) {
      partialStage = buildPartial(start, rssObservations);
      break;
    }
    completedStages.push(buildCompleted(start, complete, rssObservations));
  }
  return { completedStages, partialStage };
}

export async function writePreparationStageEvidence(output, attempts) {
  const artifact = {
    schemaVersion: 1,
    artifactKind: "preparation-stage-evidence",
    ...PREPARATION_EVIDENCE_AUTHORITIES,
    attempts,
  };
  assertValidArtifact(artifact);
  await writeJson(path.resolve(output), artifact);
  return artifact;
}

export async function verifyPreparationStageEvidence(file) {
  const artifact = await readJson(file);
  assertValidArtifact(artifact);
  if (
    JSON.stringify({
      diagnosticContract: artifact.diagnosticContract,
      stageEvidenceSchema: artifact.stageEvidenceSchema,
      qualificationClock: artifact.qualificationClock,
    }) !== JSON.stringify(PREPARATION_EVIDENCE_AUTHORITIES)
  )
    throw new Error("Preparation evidence authority mismatch.");
  for (const attempt of artifact.attempts) {
    const derived = derivePreparationStages(attempt);
    if (
      JSON.stringify(derived.completedStages) !==
        JSON.stringify(attempt.completedStages) ||
      JSON.stringify(derived.partialStage) !==
        JSON.stringify(attempt.partialStage)
    )
      throw new Error("Preparation stage evidence does not recompute.");
    if (
      attempt.outcome === "success" &&
      (attempt.diagnosticValidation !== "pass" ||
        attempt.privacyDecision !== "pass" ||
        attempt.completedStages.length !== 5 ||
        attempt.partialStage !== null ||
        attempt.completedStages.some(
          (item) => item.rssCoverage === "unavailable",
        ))
    )
      throw new Error("Successful preparation evidence is incomplete.");
  }
  return artifact;
}

function validateTimeline(attemptSequence, records, observations) {
  if (!Number.isSafeInteger(attemptSequence) || attemptSequence < 0)
    throw new Error("attempt-identity-invalid");
  for (let index = 0; index < records.length; index++) {
    const item = records[index],
      wanted = expected[index],
      prior = records[index - 1];
    if (
      !wanted ||
      item.record.sequence !== index ||
      item.record.stage !== wanted.stage ||
      item.record.event !== wanted.event ||
      !validOffset(item.record.elapsedUs) ||
      !validOffset(item.receivedAtUs) ||
      (prior && prior.record.elapsedUs > item.record.elapsedUs) ||
      (prior && prior.receivedAtUs > item.receivedAtUs)
    )
      throw new Error("diagnostic-timeline-invalid");
  }
  for (let index = 0; index < observations.length; index++) {
    const item = observations[index],
      prior = observations[index - 1];
    if (
      item.sequence !== index ||
      !validOffset(item.startedAtUs) ||
      !validOffset(item.completedAtUs) ||
      item.completedAtUs < item.startedAtUs ||
      !Number.isSafeInteger(item.rssBytes) ||
      item.rssBytes <= 0 ||
      (prior && prior.sequence >= item.sequence)
    )
      throw new Error("rss-timeline-invalid");
  }
}

function buildCompleted(start, complete, observations) {
  if (
    start.record.event !== "start" ||
    complete.record.event !== "complete" ||
    start.record.stage !== complete.record.stage ||
    complete.record.elapsedUs < start.record.elapsedUs ||
    complete.receivedAtUs < start.receivedAtUs
  )
    throw new Error("stage-pair-invalid");
  const overlap = observations.filter(
    (item) =>
      item.startedAtUs <= complete.receivedAtUs &&
      item.completedAtUs >= start.receivedAtUs,
  );
  const contained = overlap.some(
    (item) =>
      item.startedAtUs >= start.receivedAtUs &&
      item.completedAtUs <= complete.receivedAtUs,
  );
  return {
    stage: start.record.stage,
    workerStartElapsedUs: start.record.elapsedUs,
    workerCompleteElapsedUs: complete.record.elapsedUs,
    workerDurationUs: complete.record.elapsedUs - start.record.elapsedUs,
    receivedStartAtUs: start.receivedAtUs,
    receivedCompleteAtUs: complete.receivedAtUs,
    receiptSpanUs: complete.receivedAtUs - start.receivedAtUs,
    rssCoverage: overlap.length
      ? contained
        ? "contained"
        : "boundary-overlap"
      : "unavailable",
    overlappingRssSampleSequences: overlap.map((item) => item.sequence),
    maxOverlappingRssBytes: Math.max(
      0,
      ...overlap.map((item) => item.rssBytes),
    ),
  };
}

function buildPartial(start, observations) {
  const overlap = observations.filter(
    (item) => item.completedAtUs >= start.receivedAtUs,
  );
  return {
    stage: start.record.stage,
    workerStartElapsedUs: start.record.elapsedUs,
    receivedStartAtUs: start.receivedAtUs,
    rssCoverage: overlap.length ? "boundary-overlap" : "unavailable",
    overlappingRssSampleSequences: overlap.map((item) => item.sequence),
    maxOverlappingRssBytes: Math.max(
      0,
      ...overlap.map((item) => item.rssBytes),
    ),
  };
}

function assertValidAttemptArtifact(attempt) {
  assertValidArtifact({
    schemaVersion: 1,
    artifactKind: "preparation-stage-evidence",
    ...PREPARATION_EVIDENCE_AUTHORITIES,
    attempts: [attempt],
  });
}

function assertValidArtifact(value) {
  if (!validateArtifact(value))
    throw new Error(
      `Preparation Stage Evidence invalid: ${JSON.stringify(validateArtifact.errors)}`,
    );
}

function validOffset(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function classifyDiagnosticError(error) {
  return String(error?.message).includes("JSON")
    ? "diagnostic-json-invalid"
    : String(error?.message).includes("noncanonical")
      ? "diagnostic-record-noncanonical"
      : "diagnostic-record-invalid";
}

function classifyEvidenceError(error) {
  return String(error?.message ?? "evidence-invalid")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
