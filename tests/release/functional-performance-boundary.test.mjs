import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  classifyPerformanceEnvironment,
  parseCpuIdleSample,
} from "../../benchmark/darwin-performance-environment.mjs";
import {
  assertCompletePerformanceSamples,
  classifyPerformanceAssessment,
} from "../../benchmark/performance-observation.mjs";
import { assertPassingDarwinArm64Preflight } from "../../benchmark/darwin-arm64-preflight-contract.mjs";

const root = path.resolve(import.meta.dirname, "../..");

test("functional preflight retains the true six-sample average and only classifies load", () => {
  const controlled = classifyPerformanceEnvironment({
    cpuIdleSamples: [79, 80, 81, 80, 80, 80],
    taskOwnedCompetingProcessNames: [],
    topConsumerProcessNames: ["WindowServer"],
  });
  assert.equal(controlled.averageIdlePercent, 80);
  assert.equal(controlled.classification, "controlled");

  const loaded = classifyPerformanceEnvironment({
    cpuIdleSamples: [100, 100, 100, 100, 100, 99],
    taskOwnedCompetingProcessNames: ["voice-provider"],
    topConsumerProcessNames: [],
  });
  assert.equal(loaded.averageIdlePercent, 599 / 6);
  assert.equal(loaded.classification, "loaded-host");
  assert.equal(loaded.taskOwnedCompetingProcesses.detected, true);
  assert.throws(
    () =>
      classifyPerformanceEnvironment({
        cpuIdleSamples: [90, 90, 90, 90, 90],
        taskOwnedCompetingProcessNames: [],
        topConsumerProcessNames: [],
      }),
    /Exactly six/,
  );
  assert.equal(
    parseCpuIdleSample(
      "CPU usage: 10.0% user, 5.0% sys, 85.0% idle\nCPU usage: 5.0% user, 4.0% sys, 91.0% idle",
    ),
    91,
  );
});

test("latency reference status cannot change functional authority", () => {
  const met = { referenceMet: true },
    missed = { referenceMet: false };
  assert.equal(
    classifyPerformanceAssessment("controlled", { handshake: met }),
    "controlled-pass",
  );
  assert.equal(
    classifyPerformanceAssessment("controlled", {
      handshake: met,
      warmRequest: missed,
    }),
    "controlled-miss",
  );
  assert.equal(
    classifyPerformanceAssessment("loaded-host", { handshake: missed }),
    "loaded-host-observation",
  );
});

test("missing timing observations cannot enter a passing functional chain", () => {
  const samples = {
    cold: Array.from({ length: 30 }, () => ({
      handshakeMs: 1,
      preparationMs: 2,
      coldResultMs: 3,
      requestMs: 1,
    })),
    warmPreparation: Array.from({ length: 30 }, () => ({ preparationMs: 1 })),
    warm: Array.from({ length: 100 }, () => ({ requestMs: 1 })),
  };
  assert.doesNotThrow(() => assertCompletePerformanceSamples(samples));
  delete samples.cold[0].handshakeMs;
  assert.throws(
    () => assertCompletePerformanceSamples(samples),
    /observations are incomplete/,
  );
});

test("a failed prerequisite is durable Blocked evidence, not a load classification", async () => {
  const schema = JSON.parse(
      await fs.readFile(
        path.join(
          root,
          "contracts/qualification/darwin-arm64-preflight-v2.schema.json",
        ),
      ),
    ),
    ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema),
    blocked = {
      schemaVersion: 2,
      target: "darwin-arm64",
      status: "blocked",
      checkedAt: "2026-08-03T00:00:00.000Z",
      host: {},
      power: {},
      performanceEnvironment: {},
      tools: {},
      sandbox: {},
      purge: {},
      failureCategory: "runner-power-or-pressure",
    };
  assert.equal(validate(blocked), true, JSON.stringify(validate.errors));
  await assert.rejects(
    assertPassingDarwinArm64Preflight(blocked),
    /Passing M1 preflight required/,
  );
});

test("Summary 2 forbids a reverse Assessment edge and Assessment 1 has no functional decision", async () => {
  const summarySchema = JSON.parse(
      await fs.readFile(
        path.join(
          root,
          "contracts/qualification/profile-qualification-summary-v2.schema.json",
        ),
      ),
    ),
    assessmentSchema = JSON.parse(
      await fs.readFile(
        path.join(
          root,
          "contracts/qualification/performance-assessment-v1.schema.json",
        ),
      ),
    ),
    ajv = new Ajv2020({ allErrors: true, strict: true }),
    validateSummary = ajv.compile(summarySchema),
    validateAssessment = ajv.compile(assessmentSchema);
  assert.equal(
    validateSummary({
      performanceAssessment: {
        fileName: "performance-assessment-v1.json",
        sha256: "a".repeat(64),
      },
    }),
    false,
  );
  assert.ok(
    validateSummary.errors.some(
      (item) =>
        item.keyword === "additionalProperties" &&
        item.params.additionalProperty === "performanceAssessment",
    ),
  );
  assert.equal(validateAssessment({ functionalDecision: "pass" }), false);
  assert.ok(
    validateAssessment.errors.some(
      (item) =>
        item.keyword === "additionalProperties" &&
        item.params.additionalProperty === "functionalDecision",
    ),
  );
});
