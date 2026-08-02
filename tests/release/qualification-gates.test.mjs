import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
const root = path.resolve(import.meta.dirname, "../..");
test("release schema rejects declarative pass records without raw identities and measurements", async () => {
  const schema = JSON.parse(
    await fs.readFile(
      path.join(
        root,
        "contracts/release/release-qualification-evidence-v1.schema.json",
      ),
    ),
  );
  const validate = new Ajv2020({ strict: true }).compile(schema);
  assert.equal(
    validate({
      schemaVersion: 1,
      passed: true,
      sourceCommit: "1".repeat(40),
      runnerCommit: "0".repeat(40),
    }),
    false,
  );
});
test("candidate history retains selected and unsuccessful improvement lanes by exact digest", async () => {
  const history = JSON.parse(
    await fs.readFile(
      path.join(root, "release/evidence/candidate-history-v1.json"),
    ),
  );
  assert.ok(
    history.candidates.some(
      (item) =>
        item.candidateId === "paraformer-control-rejected" &&
        item.outcome === "rejected",
    ),
  );
  assert.ok(
    history.candidates.some(
      (item) =>
        item.candidateId === "funasr-selected" && item.outcome === "selected",
    ),
  );
  for (const item of history.candidates) {
    const bytes = await fs.readFile(
      path.join(root, "evidence/selection-study", item.resultPath),
    );
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      item.resultDigest,
      item.candidateId,
    );
  }
});
test("release workflow qualifies before creating a tag and has no tag trigger", async () => {
  const workflow = await fs.readFile(
    path.join(root, ".github/workflows/release-voice-runtime.yml"),
    "utf8",
  );
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /tags:\s*\n/);
  const qualify = workflow.lastIndexOf("node release/qualify-release.mjs"),
    tag = workflow.lastIndexOf("git tag -a");
  assert.ok(qualify >= 0 && tag > qualify);
  assert.match(
    workflow,
    /node build\/verify-go-toolchain\.mjs --go "\$VOICE_GO"/,
  );
  assert.doesNotMatch(workflow, /\$VOICE_GO version/);
});
