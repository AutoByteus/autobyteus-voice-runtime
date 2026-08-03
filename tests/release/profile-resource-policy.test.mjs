import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  assertResourcePolicyObservation,
  loadProfileResourcePolicy,
  resolveProfileResourcePolicy,
} from "../../benchmark/profile-resource-policy.mjs";
import { enforceFunctionalGates } from "../../release/evidence/qualification-set.mjs";
import { buildResourceOptimization } from "../../benchmark/performance-assessment.mjs";

test("Profile Resource Policy closes the exact matrix without defaults", async () => {
  const policy = await loadProfileResourcePolicy();
  assert.deepEqual(
    policy.value.rows.map(
      (row) => `${row.profileId}/${row.platform}/${row.architecture}`,
    ),
    ["english/darwin/arm64", "chinese/darwin/arm64"],
  );
  await assert.rejects(
    resolveProfileResourcePolicy("chinese", "darwin-x64"),
    /No exact/,
  );
});

test("Chinese 3,949,543,424-byte peak passes hard 4 GiB and misses only optimization", async () => {
  const policy = await resolveProfileResourcePolicy("chinese", "darwin-arm64"),
    observed = assertResourcePolicyObservation(policy, 3949543424);
  assert.equal(observed.hardCeilingMet, true);
  assert.equal(buildResourceOptimization(policy, 3949543424).targetMet, false);
  assert.doesNotThrow(() =>
    enforceFunctionalGates(
      qualificationFixture("chinese", observed),
      performanceFixture(),
    ),
  );
  const above = assertResourcePolicyObservation(policy, 4294967297);
  assert.equal(above.hardCeilingMet, false);
  assert.throws(
    () =>
      enforceFunctionalGates(
        qualificationFixture("chinese", above),
        performanceFixture(),
      ),
    /threshold/,
  );
});

test("English retains the 2.5 GiB hard boundary", async () => {
  const policy = await resolveProfileResourcePolicy("english", "darwin-arm64"),
    atLimit = assertResourcePolicyObservation(policy, 2684354560),
    overLimit = assertResourcePolicyObservation(policy, 2684354561);
  assert.equal(atLimit.hardCeilingMet, true);
  assert.equal(buildResourceOptimization(policy, 2684354560).targetMet, true);
  assert.equal(overLimit.hardCeilingMet, false);
});

test("policy bytes are matrix-bound and cannot be substituted", async () => {
  const source = path.resolve(
      import.meta.dirname,
      "../../contracts/qualification/profile-resource-policy-v1.json",
    ),
    temp = await fs.mkdtemp(path.join(os.tmpdir(), "voice-resource-policy-"));
  try {
    const changed = JSON.parse(await fs.readFile(source, "utf8"));
    changed.rows[1].hardProcessTreeRssCeilingBytes += 1;
    const file = path.join(temp, "profile-resource-policy-v1.json");
    await fs.writeFile(file, `${JSON.stringify(changed, null, 2)}\n`);
    await assert.rejects(loadProfileResourcePolicy(file), /invalid|binding/i);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

function qualificationFixture(profileId, resourcePolicy) {
  const sampleCount = profileId === "english" ? 49 : 200;
  return {
    profileId,
    attempts: {
      started: profileId === "english" ? 160 : 260,
      succeeded: profileId === "english" ? 160 : 260,
      failed: 0,
      timedOut: 0,
      excluded: 0,
    },
    maxRssBytes: resourcePolicy.observedPeakProcessTreeRssBytes,
    resourcePolicy,
    extractedSizeBytes: 1024,
    quality: {
      metric: profileId === "english" ? "WER" : "CER",
      value: 0.05,
      baseline: { value: 0.052127659574468084, sampleCount },
      sampleCount,
      failedCount: 0,
      emptyCount: 0,
    },
  };
}

function performanceFixture() {
  return {
    cacheExecutions: Array.from({ length: 30 }),
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
