import test from "node:test";
import assert from "node:assert/strict";
import { cacheProcedureFor } from "../../benchmark/cache-procedure.mjs";
import { verifyPerformanceEvidence } from "../../release/evidence/performance.mjs";

const procedure = await cacheProcedureFor("darwin-arm64");
const cold = Array.from({ length: 30 }, (_, index) => ({
  handshakeMs: index + 1,
  preparationMs: index + 2,
  coldResultMs: index + 3,
  requestMs: index + 1,
}));
const warmPreparation = Array.from({ length: 30 }, (_, index) => ({
  preparationMs: index + 1,
}));
const warm = Array.from({ length: 100 }, (_, index) => ({
  requestMs: index + 1,
}));
const samples = {
  schemaVersion: 1,
  cacheProcedure: procedure,
  cacheExecutions: cold.map((_, index) => ({
    index,
    procedureId: procedure.id,
    procedureSha256: procedure.sha256,
    completed: true,
  })),
  cold,
  warmPreparation,
  warm,
};
const latency = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    failures: 0,
    timeouts: 0,
    p50Ms: sorted[Math.ceil(values.length * 0.5) - 1],
    p95Ms: sorted[Math.ceil(values.length * 0.95) - 1],
    maxMs: sorted.at(-1),
  };
};
const qualification = {
  packageId: "fixture.package",
  profileId: "english",
  platform: "darwin",
  architecture: "arm64",
  handshake: latency(cold.map((x) => x.handshakeMs)),
  coldPreparation: latency(cold.map((x) => x.preparationMs)),
  warmPreparation: latency(warmPreparation.map((x) => x.preparationMs)),
  coldResult: latency(cold.map((x) => x.coldResultMs)),
  warmRequest: latency(warm.map((x) => x.requestMs)),
};
const summary = {
  conditions: { executionEnvironment: { filesystemCacheProcedure: procedure } },
  attempts: {
    started: 160,
    succeeded: 160,
    failed: 0,
    timedOut: 0,
    excluded: 0,
  },
};
const attempts = {
  schemaVersion: 1,
  packageId: qualification.packageId,
  profileId: qualification.profileId,
  target: "darwin-arm64",
  decision: "pass",
  failureCategory: null,
  attempts: [
    ...Array.from({ length: 30 }, (_, index) => attempt("cold", index)),
    ...Array.from({ length: 30 }, (_, index) =>
      attempt("warm-preparation", index),
    ),
    ...Array.from({ length: 100 }, (_, index) =>
      attempt("warm-request", index),
    ),
  ],
};

test("performance evidence requires executed cold resets and meaningful warm samples", async () => {
  await verifyPerformanceEvidence(summary, qualification, samples, attempts);
  for (const changed of [
    { ...samples, cacheProcedure: null },
    { ...samples, cacheExecutions: [] },
    {
      ...samples,
      cacheExecutions: samples.cacheExecutions.map((x) => ({
        ...x,
        completed: false,
      })),
    },
    { ...samples, warmPreparation: warmPreparation.slice(0, 1) },
  ])
    await assert.rejects(
      verifyPerformanceEvidence(summary, qualification, changed, attempts),
      /Raw performance evidence is incomplete|procedure execution evidence is incomplete|samples are insufficient|observations are incomplete/,
    );
});

function attempt(phase, index) {
  return {
    phase,
    index,
    performanceCounted: true,
    status: "succeeded",
    timeout: false,
  };
}
