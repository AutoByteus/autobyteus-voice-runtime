import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreparationEvidenceCollector,
  PREPARATION_EVIDENCE_AUTHORITIES,
  derivePreparationStages,
  verifyPreparationStageEvidence,
  writePreparationStageEvidence,
} from "../../benchmark/preparation-diagnostics.mjs";
import { verifyPreparationBinding } from "../../benchmark/performance-assessment.mjs";
import { shaFile } from "../../build/lib/files.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const stages = [
  "manifest-verification",
  "encoder-load",
  "language-model-load",
  "context-create",
  "normalizer-load",
];

test("byte framing accepts every split and coalesced canonical records", async () => {
  const records = canonicalLines();
  for (const split of [
    1,
    8,
    29,
    records[0].indexOf("{") + 8,
    records[0].length - 1,
  ]) {
    const collector = createCollector(0);
    collector.childSpawned();
    const bytes = Buffer.from(records.join(""));
    collector.acceptStderrChunk(bytes.subarray(0, split));
    collector.acceptStderrChunk(bytes.subarray(split));
    const evidence = await collector.finalize("success");
    assert.equal(evidence.diagnosticValidation, "pass");
    assert.equal(evidence.receivedRecords.length, 10);
    assert.equal(evidence.completedStages.length, 5);
    assert.ok(
      evidence.completedStages.every(
        (item) => item.rssCoverage === "boundary-overlap",
      ),
    );
  }

  const bytewise = createCollector(1);
  bytewise.childSpawned();
  for (const byte of Buffer.from(records.join("")))
    bytewise.acceptStderrChunk(Buffer.of(byte));
  assert.equal(
    (await bytewise.finalize("success")).diagnosticValidation,
    "pass",
  );
});

test("invalid, oversized, noncanonical, and truncated prefixed lines fail", async () => {
  const cases = [
    Buffer.concat([
      Buffer.from("AUTOBYTEUS_VOICE_PREP_V1 "),
      Buffer.of(0xff),
      Buffer.from("\n"),
    ]),
    Buffer.from(`AUTOBYTEUS_VOICE_PREP_V1 ${"x".repeat(300)}\n`),
    Buffer.from(
      'AUTOBYTEUS_VOICE_PREP_V1 {"event":"start","elapsedUs":0,"sequence":0,"stage":"manifest-verification"}\n',
    ),
    Buffer.from(canonicalLines()[0].slice(0, -1)),
  ];
  for (const value of cases) {
    const collector = createCollector(2);
    collector.acceptStderrChunk(value);
    const evidence = await collector.finalize("failure");
    assert.equal(evidence.diagnosticValidation, "fail");
  }
});

test("worker duration and qualification receipt clocks remain separate", () => {
  const records = received([
      [100, "start", 0, "manifest-verification", 10],
      [300, "complete", 1, "manifest-verification", 1000],
    ]),
    { completedStages } = derivePreparationStages({
      attemptSequence: 4,
      receivedRecords: records,
      rssObservations: [rss(0, 10, 1000, 4096)],
    });
  assert.equal(completedStages[0].workerDurationUs, 200);
  assert.equal(completedStages[0].receiptSpanUs, 990);
});

test("diagnostic receipt time is captured at LF consumption", async () => {
  const readings = [0n, 42_000n];
  let call = 0;
  const collector = new PreparationEvidenceCollector({
    attemptSequence: 5,
    pid: () => 0,
    nowNs: () => readings[call++],
  });
  collector.acceptStderrChunk(Buffer.from(canonicalLines()[0]));
  const evidence = await collector.finalize("failure");
  assert.equal(call, 2);
  assert.equal(evidence.receivedRecords[0].receivedAtUs, 42);
});

test("closed RSS windows retain contained, crossings, touching, and shared samples", () => {
  const records = received([
      [0, "start", 0, "manifest-verification", 10],
      [5, "complete", 1, "manifest-verification", 20],
      [5, "start", 2, "encoder-load", 20],
      [8, "complete", 3, "encoder-load", 30],
    ]),
    observations = [
      rss(0, 12, 18, 100),
      rss(1, 5, 12, 200),
      rss(2, 18, 25, 300),
      rss(3, 20, 30, 400),
    ],
    { completedStages } = derivePreparationStages({
      attemptSequence: 7,
      receivedRecords: records,
      rssObservations: observations,
    });
  assert.deepEqual(
    completedStages[0].overlappingRssSampleSequences,
    [0, 1, 2, 3],
  );
  assert.equal(completedStages[0].rssCoverage, "contained");
  assert.equal(completedStages[0].maxOverlappingRssBytes, 400);
  assert.ok(completedStages[1].overlappingRssSampleSequences.includes(2));
  assert.ok(completedStages[1].overlappingRssSampleSequences.includes(3));

  const short = derivePreparationStages({
    attemptSequence: 8,
    receivedRecords: received([
      [0, "start", 0, "manifest-verification", 50],
      [0, "complete", 1, "manifest-verification", 50],
    ]),
    rssObservations: [rss(0, 50, 51, 500)],
  }).completedStages[0];
  assert.equal(short.rssCoverage, "boundary-overlap");
});

test("invalid windows, ordering, and worker regression fail closed", () => {
  const valid = received([
    [10, "start", 0, "manifest-verification", 10],
    [20, "complete", 1, "manifest-verification", 20],
  ]);
  for (const observations of [
    [rss(0, 20, 10, 1)],
    [{ ...rss(0, 10, 20, 1), startedAtUs: -1 }],
    [rss(1, 10, 20, 1)],
    [rss(0, 10, 20, 1), rss(0, 20, 30, 1)],
  ])
    assert.throws(() =>
      derivePreparationStages({
        attemptSequence: 1,
        receivedRecords: valid,
        rssObservations: observations,
      }),
    );
  const regressed = structuredClone(valid);
  regressed[1].record.elapsedUs = 9;
  assert.throws(() =>
    derivePreparationStages({
      attemptSequence: 1,
      receivedRecords: regressed,
      rssObservations: [rss(0, 10, 20, 1)],
    }),
  );
  assert.throws(() =>
    derivePreparationStages({
      attemptSequence: -1,
      receivedRecords: valid,
      rssObservations: [],
    }),
  );
});

test("failed partial preparation is retained and unrelated stderr is redacted", async () => {
  const collector = createCollector(9);
  collector.childSpawned();
  collector.acceptStderrChunk(Buffer.from("secret path and transcript\n"));
  collector.acceptStderrChunk(Buffer.from(canonicalLines()[0]));
  const evidence = await collector.finalize("failure");
  assert.equal(evidence.redactedLineCount, 1);
  assert.equal(evidence.partialStage.stage, "manifest-verification");
  assert.equal(JSON.stringify(evidence).includes("secret"), false);
});

test("successful preparation with no RSS coverage fails durable evidence", async () => {
  const collector = createCollector(10, async () => {
    throw new Error("sampler unavailable");
  });
  collector.childSpawned();
  collector.acceptStderrChunk(Buffer.from(canonicalLines().join("")));
  const evidence = await collector.finalize("success");
  assert.equal(evidence.diagnosticValidation, "fail");
  assert.ok(
    evidence.completedStages.every(
      (item) => item.rssCoverage === "unavailable",
    ),
  );
});

test("written evidence revalidates and recomputes", async () => {
  const collector = createCollector(11);
  collector.childSpawned();
  collector.acceptStderrChunk(Buffer.from(canonicalLines().join("")));
  const attempt = await collector.finalize("success"),
    root = await fs.mkdtemp(path.join(os.tmpdir(), "voice-preparation-test-")),
    file = path.join(root, "preparation-stage-evidence-v1.json");
  try {
    await writePreparationStageEvidence(file, [attempt]);
    assert.equal(
      (await verifyPreparationStageEvidence(file)).attempts.length,
      1,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("qualification binding rejects evidence from another attempt identity", async () => {
  const collector = createCollector(12);
  collector.childSpawned();
  collector.acceptStderrChunk(Buffer.from(canonicalLines().join("")));
  const attempt = await collector.finalize("success"),
    root = await fs.mkdtemp(path.join(os.tmpdir(), "voice-preparation-bind-")),
    file = path.join(root, "preparation-stage-evidence-v1.json"),
    summaryPath = path.join(root, "qualification-summary-v2.json");
  try {
    await writePreparationStageEvidence(file, [attempt]);
    const summary = {
        profileId: "chinese",
        rawEvidence: {
          preparationStageEvidence: {
            fileName: path.basename(file),
            sha256: await shaFile(file),
          },
        },
        preparationEvidence: {
          ...PREPARATION_EVIDENCE_AUTHORITIES,
          attemptCount: 1,
          validAttemptCount: 1,
          privacyDecision: "pass",
        },
      },
      ledger = {
        attempts: [
          {
            sequence: 12,
            phase: "cold",
            status: "succeeded",
            timings: { preparationMs: 1 },
          },
        ],
      };
    await verifyPreparationBinding(summary, summaryPath, ledger);
    ledger.attempts[0].status = "failed";
    await verifyPreparationBinding(summary, summaryPath, ledger);
    ledger.attempts[0].sequence = 13;
    await assert.rejects(
      verifyPreparationBinding(summary, summaryPath, ledger),
      /binding mismatch/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

function createCollector(attemptSequence, observeRss = async () => 1024) {
  let ticks = 0n;
  return new PreparationEvidenceCollector({
    attemptSequence,
    pid: () => 123,
    nowNs: () => ticks++ * 1000n,
    observeRss,
    samplingIntervalMs: 60_000,
  });
}

function canonicalLines() {
  return stages.flatMap((stage, index) =>
    ["start", "complete"].map(
      (event, offset) =>
        `AUTOBYTEUS_VOICE_PREP_V1 ${JSON.stringify({
          elapsedUs: index * 100 + offset,
          event,
          sequence: index * 2 + offset,
          stage,
        })}\n`,
    ),
  );
}

function received(rows) {
  return rows.map(([elapsedUs, event, sequence, stage, receivedAtUs]) => ({
    record: { elapsedUs, event, sequence, stage },
    receivedAtUs,
  }));
}

function rss(sequence, startedAtUs, completedAtUs, rssBytes) {
  return { sequence, startedAtUs, completedAtUs, rssBytes };
}
