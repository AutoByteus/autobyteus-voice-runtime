import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  changedSourcePaths,
  classifySourcePath,
  loadSourceClosurePolicy,
  sourceClosureDecision,
} from "../../release/source-closure.mjs";

const run = promisify(execFile);

test("Relevant Source Closure 2 classifies every governed path at its strictest impact", async () => {
  const { value: policy } = await loadSourceClosurePolicy();
  assert.equal(
    classifySourcePath("providers/english-mlx/recognizer.py", policy),
    "profile-qualification-required",
  );
  assert.equal(
    classifySourcePath("modelmanager/internal/service.go", policy),
    "focused-qualification-required",
  );
  assert.equal(
    classifySourcePath("tests/release/host-release-contracts.test.mjs", policy),
    "aggregate-api-renewal-required",
  );
  assert.equal(
    classifySourcePath("release/verify-published-assets.mjs", policy),
    "release-pipeline-only",
  );
  assert.equal(
    classifySourcePath("README.md", policy),
    "documentation-record-only",
  );
  assert.equal(
    classifySourcePath("unknown/new-owner.txt", policy),
    "api-impact-review-required",
  );
  assert.throws(() => classifySourcePath("../escape", policy), /Noncanonical/);
});

test("complete A/M/D/R inventory classifies both rename subjects and only safe release transitions reuse", async () => {
  const repository = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-source-closure-v2-"),
  );
  try {
    await run("git", ["init", "-q"], { cwd: repository });
    await run("git", ["config", "user.email", "test@example.invalid"], {
      cwd: repository,
    });
    await run("git", ["config", "user.name", "Test"], { cwd: repository });
    await write(repository, "README.md", "base\n");
    await write(repository, "release/old.mjs", "export const old = true;\n");
    await write(repository, "release/delete.mjs", "delete me\n");
    await run("git", ["add", "."], { cwd: repository });
    await run("git", ["commit", "-q", "-m", "base"], { cwd: repository });
    const from = await rev(repository);
    await write(repository, "README.md", "modified\n");
    await write(
      repository,
      "release/added.mjs",
      "export const added = true;\n",
    );
    await fs.rm(path.join(repository, "release/delete.mjs"));
    await fs.mkdir(path.join(repository, "modelmanager"));
    await run("git", ["mv", "release/old.mjs", "modelmanager/old.go"], {
      cwd: repository,
    });
    await run("git", ["add", "-A"], { cwd: repository });
    await run("git", ["commit", "-q", "-m", "transition"], { cwd: repository });
    const to = await rev(repository),
      { value: policy } = await loadSourceClosurePolicy(),
      changes = await changedSourcePaths({ repository, from, to, policy });
    assert.deepEqual(changes.map((row) => row.status).sort(), [
      "A",
      "D",
      "M",
      "R",
    ]);
    const renamed = changes.find((row) => row.status === "R");
    assert.deepEqual(
      [renamed.oldPath, renamed.newPath, renamed.classification],
      [
        "release/old.mjs",
        "modelmanager/old.go",
        "focused-qualification-required",
      ],
    );
    assert.equal(
      sourceClosureDecision(changes),
      "focused-qualification-required",
    );
    assert.equal(
      sourceClosureDecision([
        {
          status: "M",
          path: "release/a.mjs",
          classification: "release-pipeline-only",
        },
        {
          status: "M",
          path: "README.md",
          classification: "documentation-record-only",
        },
      ]),
      "reuse-permitted",
    );
    assert.equal(
      sourceClosureDecision([
        {
          status: "M",
          path: "tests/release/a.test.mjs",
          classification: "aggregate-api-renewal-required",
        },
      ]),
      "api-impact-review-required",
    );
  } finally {
    await fs.rm(repository, { recursive: true, force: true });
  }
});

async function write(root, relative, value) {
  const target = path.join(root, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, value);
}
async function rev(repository) {
  return (
    await run("git", ["rev-parse", "HEAD"], { cwd: repository })
  ).stdout.trim();
}
