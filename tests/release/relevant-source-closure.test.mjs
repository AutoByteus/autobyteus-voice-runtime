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
  computeApprovedSourceClosures,
  computeSourceClosure,
  loadSourceClosurePolicy,
  sourceClosureDecision,
  verifyFrozenSourceClosures,
} from "../../release/source-closure.mjs";

const run = promisify(execFile),
  root = path.resolve(import.meta.dirname, "../.."),
  digest = "a".repeat(64);

test("frozen Profile and Qualification Authority closures reproduce exactly", async () => {
  const { value: policy } = await loadSourceClosurePolicy(),
    frozen = await verifyFrozenSourceClosures({ policy });
  assert.equal(frozen.profile.closureId, "profile-closure-v1");
  assert.equal(
    frozen.qualificationAuthority.closureId,
    "qualification-authority-closure-v1",
  );
  const head = (
      await run("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim(),
    current = await computeApprovedSourceClosures({ commit: head, policy });
  assert.deepEqual(current, frozen);
});

test("strictest source category wins and unknown paths fail closed", async () => {
  const { value: policy } = await loadSourceClosurePolicy();
  assert.equal(
    classifySourcePath("providers/chinese-funasr/src/main.cpp", policy),
    "profile-qualification-required",
  );
  assert.equal(
    classifySourcePath("release/evidence/qualification-set.mjs", policy),
    "aggregate-api-renewal-required",
  );
  assert.equal(
    classifySourcePath("release/recover-qualified-voice-archives.mjs", policy),
    "release-pipeline-only",
  );
  assert.equal(
    classifySourcePath("tickets/done/example.md", policy),
    "documentation-or-record-only",
  );
  assert.equal(
    classifySourcePath("unexpected/new-authority.bin", policy),
    "api-impact-review-required",
  );
  const overlap = structuredClone(policy);
  overlap.rules.push({
    category: "documentation-or-record-only",
    prefixes: ["providers/"],
    exact: [],
  });
  assert.equal(
    classifySourcePath("providers/english-mlx/worker.py", overlap),
    "profile-qualification-required",
  );
});

test("add, change, remove, and rename produce complete fail-closed decisions", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "voice-closure-git-"));
  try {
    await run("git", ["init", "-q"], { cwd: temp });
    await run("git", ["config", "user.email", "test@example.invalid"], {
      cwd: temp,
    });
    await run("git", ["config", "user.name", "Closure Test"], { cwd: temp });
    await write(temp, "providers/runtime.txt", "one\n");
    await write(temp, "release/recover-qualified-voice-archives.mjs", "one\n");
    await commit(temp, "base");
    const base = await head(temp);
    await write(temp, "providers/runtime.txt", "two\n");
    await write(temp, "release/new-pipeline.mjs", "new\n");
    await run(
      "git",
      [
        "mv",
        "release/recover-qualified-voice-archives.mjs",
        "release/renamed.mjs",
      ],
      { cwd: temp },
    );
    await commit(temp, "change");
    const changed = await head(temp),
      { value: policy } = await loadSourceClosurePolicy(),
      rows = await changedSourcePaths({
        repository: temp,
        from: base,
        to: changed,
        policy,
      });
    assert.ok(
      rows.some(
        (item) => item.status === "M" && item.path === "providers/runtime.txt",
      ),
    );
    assert.ok(rows.some((item) => item.status.startsWith("R")));
    assert.equal(sourceClosureDecision(rows), "profile-qualification-required");
    assert.equal(
      sourceClosureDecision([
        { category: "aggregate-api-renewal-required" },
        { category: "release-pipeline-only" },
      ]),
      "aggregate-api-renewal-required",
    );
    assert.equal(
      sourceClosureDecision([{ category: "api-impact-review-required" }]),
      "api-impact-review-required",
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("closure computation rejects symlinks and case-fold collisions", async () => {
  for (const kind of ["symlink", "case-fold-collision"]) {
    const temp = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-closure-invalid-"),
    );
    try {
      await run("git", ["init", "-q"], { cwd: temp });
      await run("git", ["config", "user.email", "test@example.invalid"], {
        cwd: temp,
      });
      await run("git", ["config", "user.name", "Closure Test"], { cwd: temp });
      let commitValue;
      if (kind === "symlink") {
        await write(temp, "target", "target\n");
        await fs.mkdir(path.join(temp, "providers"), { recursive: true });
        await fs.symlink("../target", path.join(temp, "providers/link"));
        await commit(temp, "invalid symlink");
        commitValue = await head(temp);
      } else {
        await write(temp, "upper-blob", "A\n");
        await write(temp, "lower-blob", "a\n");
        const upper = (
            await run("git", ["hash-object", "-w", "upper-blob"], { cwd: temp })
          ).stdout.trim(),
          lower = (
            await run("git", ["hash-object", "-w", "lower-blob"], { cwd: temp })
          ).stdout.trim();
        await run(
          "git",
          [
            "update-index",
            "--add",
            "--cacheinfo",
            `100644,${upper},providers/A.txt`,
          ],
          { cwd: temp },
        );
        await run(
          "git",
          [
            "update-index",
            "--add",
            "--cacheinfo",
            `100644,${lower},providers/a.txt`,
          ],
          { cwd: temp },
        );
        const tree = (
          await run("git", ["write-tree"], { cwd: temp })
        ).stdout.trim();
        commitValue = (
          await run("git", ["commit-tree", tree, "-m", "invalid collision"], {
            cwd: temp,
          })
        ).stdout.trim();
      }
      const policy = {
        precedence: ["profile-qualification-required"],
        defaultCategory: "api-impact-review-required",
        rules: [
          {
            category: "profile-qualification-required",
            prefixes: ["providers/"],
            exact: [],
          },
        ],
      };
      await assert.rejects(
        computeSourceClosure({
          repository: temp,
          commit: commitValue,
          closure: {
            closureId: "profile-closure-v1",
            categories: ["profile-qualification-required"],
            inventorySha256: digest,
            treeSha256: digest,
          },
          policy,
        }),
        /unsupported entry|case-fold collision/,
      );
    } finally {
      await fs.rm(temp, { recursive: true, force: true });
    }
  }
});

async function write(rootValue, relative, bytes) {
  const target = path.join(rootValue, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
}

async function commit(repository, message) {
  await run("git", ["add", "-A"], { cwd: repository });
  await run("git", ["commit", "-q", "-m", message], { cwd: repository });
}

async function head(repository) {
  return (
    await run("git", ["rev-parse", "HEAD"], { cwd: repository })
  ).stdout.trim();
}
