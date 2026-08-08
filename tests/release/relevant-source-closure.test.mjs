import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  assertCanonicalChangedPaths,
  assessPreliminarySourceAdmission,
  canonicalObjectSha256,
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
  digest = "a".repeat(64),
  aggregateRecordCommit = "448517cee89e6498c551bcc70aba65ec0bedf97e";

test("frozen Profile and Qualification Authority closures reproduce exactly", async () => {
  const { value: policy } = await loadSourceClosurePolicy(),
    frozen = await verifyFrozenSourceClosures({ policy });
  assert.equal(frozen.profile.closureId, "profile-closure-v1");
  assert.equal(
    frozen.qualificationAuthority.closureId,
    "qualification-authority-closure-v1",
  );
  assert.match(frozen.profile.treeSha256, /^[a-f0-9]{64}$/);
});

test("current preliminary admission accepts the exact renewed aggregate authority", async () => {
  const loaded = await loadSourceClosurePolicy(),
    record = JSON.parse(
      (
        await run(
          "git",
          [
            "show",
            `${aggregateRecordCommit}:release/candidates/authority/v1.0.0-aggregate-api-renewal-v1.json`,
          ],
          { cwd: root },
        )
      ).stdout,
    ),
    headCommit = await head(root),
    admission = await assessPreliminarySourceAdmission({
      repository: root,
      acceptedAuthorityCommit:
        loaded.value.closures.qualificationAuthority.baseCommit,
      reviewedControllerCommit: headCommit,
      policy: loaded.value,
      policySha256: loaded.sha256,
    });
  assert.equal(
    loaded.value.closures.qualificationAuthority.baseCommit,
    aggregateRecordCommit,
  );
  assert.deepEqual(
    admission.closures.accepted.qualificationAuthority,
    record.qualificationAuthority,
  );
  assert.deepEqual(admission.closures.accepted.profile, record.profileClosure);
  assert.equal(admission.acceptedAuthorityIsAncestor, true);
  assert.equal(admission.acceptedAuthorityMatchesPolicy, true);
  assert.equal(admission.closures.unchanged.profile, true);
  assert.equal(admission.closures.unchanged.qualificationAuthority, true);
  assert.equal(admission.decision, "reuse-permitted");
  assert.ok(admission.changedPaths.length > 0);
  assert.ok(
    admission.changedPaths.every((item) =>
      ["release-pipeline-only", "documentation-or-record-only"].includes(
        item.category,
      ),
    ),
  );
  assert.equal(
    admission.changedPathsSha256,
    canonicalObjectSha256(admission.changedPaths),
  );
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
    await write(temp, "docs/remove-me.md", "remove\n");
    await commit(temp, "add removal subject");
    const intermediate = await head(temp);
    await fs.rm(path.join(temp, "docs/remove-me.md"));
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
    assert.ok(
      rows.some(
        (item) =>
          item.status === "R" &&
          item.oldPath === "release/recover-qualified-voice-archives.mjs" &&
          item.newPath === "release/renamed.mjs",
      ),
    );
    assert.ok(rows.some((item) => item.status === "A"));
    const deletion = await changedSourcePaths({
      repository: temp,
      from: intermediate,
      to: changed,
      policy,
    });
    assert.ok(deletion.some((item) => item.status === "D"));
    assertCanonicalChangedPaths(rows, policy);
    assert.throws(
      () => assertCanonicalChangedPaths([...rows, rows[0]], policy),
      /duplicate|canonical/,
    );
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

test("unknown closure-equal change and ancestry failure block admission", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "voice-admission-git-"));
  try {
    await run("git", ["init", "-q"], { cwd: temp });
    await run("git", ["config", "user.email", "test@example.invalid"], {
      cwd: temp,
    });
    await run("git", ["config", "user.name", "Admission Test"], {
      cwd: temp,
    });
    await write(temp, "release/known.mjs", "one\n");
    await commit(temp, "base");
    const base = await head(temp),
      policy = testPolicy(base);
    for (const key of ["profile", "qualificationAuthority"])
      Object.assign(
        policy.closures[key],
        await computeSourceClosure({
          repository: temp,
          commit: base,
          closure: policy.closures[key],
          policy,
        }),
      );
    await write(temp, "unexpected/new-authority.bin", "unknown\n");
    await commit(temp, "unknown");
    const changed = await head(temp),
      admission = await assessPreliminarySourceAdmission({
        repository: temp,
        acceptedAuthorityCommit: base,
        reviewedControllerCommit: changed,
        policy,
        policySha256: digest,
      });
    assert.equal(admission.closures.unchanged.profile, true);
    assert.equal(admission.closures.unchanged.qualificationAuthority, true);
    assert.equal(admission.decision, "api-impact-review-required");
    await run("git", ["checkout", "-q", "--orphan", "unrelated"], {
      cwd: temp,
    });
    await fs.rm(path.join(temp, "release"), { recursive: true, force: true });
    await fs.rm(path.join(temp, "unexpected"), {
      recursive: true,
      force: true,
    });
    await write(temp, "release/known.mjs", "unrelated\n");
    await commit(temp, "unrelated");
    const unrelated = await head(temp),
      blocked = await assessPreliminarySourceAdmission({
        repository: temp,
        acceptedAuthorityCommit: base,
        reviewedControllerCommit: unrelated,
        policy,
        policySha256: digest,
      });
    assert.equal(blocked.acceptedAuthorityIsAncestor, false);
    assert.equal(blocked.decision, "api-impact-review-required");
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

function testPolicy(baseCommit) {
  return {
    schemaVersion: 1,
    policyId: "voice-runtime-relevant-source-closure-v1",
    defaultCategory: "api-impact-review-required",
    precedence: [
      "profile-qualification-required",
      "aggregate-api-renewal-required",
      "release-pipeline-only",
      "documentation-or-record-only",
    ],
    closures: {
      profile: {
        closureId: "profile-closure-v1",
        baseCommit,
        categories: ["profile-qualification-required"],
        inventorySha256: digest,
        treeSha256: digest,
      },
      qualificationAuthority: {
        closureId: "qualification-authority-closure-v1",
        baseCommit,
        categories: ["aggregate-api-renewal-required"],
        inventorySha256: digest,
        treeSha256: digest,
      },
    },
    rules: [
      {
        category: "release-pipeline-only",
        prefixes: ["release/"],
        exact: [],
      },
    ],
  };
}
