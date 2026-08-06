import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  CANDIDATE_MEMBERS,
  assembleQualifiedCandidate,
  verifyQualifiedCandidate,
  writeCandidatePromotionRecord,
} from "../../release/qualified-release-candidate.mjs";
import { qualifiedCandidateFixture } from "./qualified-candidate-fixture.mjs";

test("candidate assembler closes exactly 19 members and independently rehashes them", async () => {
  const fixture = await qualifiedCandidateFixture();
  try {
    const manifest = await assembleQualifiedCandidate({
      candidate: fixture.candidate,
      promotionInput: fixture.promotionInput,
      authority: fixture.authority,
    });
    assert.equal(CANDIDATE_MEMBERS.length, 19);
    assert.equal(manifest.archiveRecovery.rawEvidence.items.length, 8);
    assert.equal(manifest.apiEvidenceManifests.length, 3);
    assert.equal(manifest.providerArchives.items.length, 2);
    assert.equal(manifest.archiveRecovery.result.decision, "pass");
    assert.equal(manifest.archiveRecovery.evidenceManifest.entryCount, 8);
    assert.equal(
      manifest.archiveRecovery.evidenceManifest.coverage,
      "raw-recovery-evidence-only",
    );
    await verifyQualifiedCandidate(fixture.candidate, {
      authority: fixture.authority,
    });
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

test("candidate verifier rejects raw, manifest, Result, archive, and member drift", async (t) => {
  for (const [name, mutate, expected] of [
    [
      "raw byte drift",
      (fixture) =>
        fs.appendFile(
          path.join(fixture.candidate, "recovery/english-build.log"),
          "tamper\n",
        ),
      /does not close|recomputation/,
    ],
    [
      "extra recovery member",
      (fixture) =>
        fs.writeFile(
          path.join(fixture.candidate, "recovery/unexpected.json"),
          "{}\n",
        ),
      /absent or extra recovery member|member closure/,
    ],
    [
      "archive byte drift",
      (fixture) =>
        fs.appendFile(
          path.join(
            fixture.candidate,
            `assets/${fixture.authority.archives[0].fileName}`,
          ),
          "tamper\n",
        ),
      /member identity mismatch/,
    ],
  ])
    await t.test(name, async () => {
      const fixture = await qualifiedCandidateFixture();
      try {
        await assembleQualifiedCandidate({
          candidate: fixture.candidate,
          promotionInput: fixture.promotionInput,
          authority: fixture.authority,
        });
        await mutate(fixture);
        await assert.rejects(
          verifyQualifiedCandidate(fixture.candidate, {
            authority: fixture.authority,
          }),
          expected,
        );
      } finally {
        await fs.rm(fixture.temp, { recursive: true, force: true });
      }
    });
});

test("candidate rejects recovery workflow/Result and same-source disagreement", async () => {
  const fixture = await qualifiedCandidateFixture();
  try {
    fixture.promotionInput.archiveRecoveryWorkflow.headSha = "c".repeat(40);
    await assert.rejects(
      assembleQualifiedCandidate({
        candidate: fixture.candidate,
        promotionInput: fixture.promotionInput,
        authority: fixture.authority,
      }),
      /workflow head/,
    );
    fixture.promotionInput.archiveRecoveryWorkflow.headSha = "a".repeat(40);
    const resultPath = path.join(
        fixture.candidate,
        "recovery/qualified-archive-recovery-result-v1.json",
      ),
      result = JSON.parse(await fs.readFile(resultPath, "utf8"));
    result.qualifiedAuthority.sourceCommit = "d".repeat(40);
    await fs.writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
    await assert.rejects(
      assembleQualifiedCandidate({
        candidate: fixture.candidate,
        promotionInput: fixture.promotionInput,
        authority: fixture.authority,
      }),
      /source|Recovery Result archive mismatch|lineage/i,
    );
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

test("promotion record is an exact immutable pointer without candidate copying", async () => {
  const fixture = await qualifiedCandidateFixture();
  try {
    const manifest = await assembleQualifiedCandidate({
        candidate: fixture.candidate,
        promotionInput: fixture.promotionInput,
        authority: fixture.authority,
      }),
      output = path.join(fixture.temp, "v1.0.0.json"),
      record = await writeCandidatePromotionRecord({
        candidate: fixture.candidate,
        authority: fixture.authority,
        output,
        recordInput: {
          workflow: {
            path: ".github/workflows/promote-qualified-voice-candidate.yml",
            runId: 999,
            headSha: manifest.approval.apiApprovalCommit,
            conclusion: "success",
          },
          artifact: {
            id: 1000,
            name: `qualified-release-candidate-v1.0.0-${manifest.approval.apiApprovalCommit}`,
            expiresAt: "2099-01-01T00:00:00.000Z",
          },
        },
      });
    assert.deepEqual(Object.keys(record).sort(), [
      "artifact",
      "candidateManifest",
      "packageVersion",
      "repository",
      "schemaVersion",
      "workflow",
    ]);
    assert.equal(JSON.stringify(record).includes("latest"), false);
    assert.equal(JSON.stringify(record).includes("providerArchives"), false);
    await assert.rejects(
      writeCandidatePromotionRecord({
        candidate: fixture.candidate,
        authority: fixture.authority,
        output: path.join(fixture.temp, "wrong-head.json"),
        recordInput: {
          ...record,
          workflow: { ...record.workflow, headSha: "e".repeat(40) },
        },
      }),
      /lineage mismatch/,
    );
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});
