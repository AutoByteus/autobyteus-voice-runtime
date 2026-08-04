import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { assertIntegratedReleaseCommit } from "../../release/evidence/main-reachability.mjs";

const run = promisify(execFile);

test("maintained-main proof rejects descendants and accepts equality or integration", async () => {
  const repository = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-main-proof-"),
  );
  try {
    await git(repository, ["init", "-q"]);
    await git(repository, ["config", "user.email", "test@example.invalid"]);
    await git(repository, ["config", "user.name", "Test"]);
    await commit(repository, "base");
    const base = await rev(repository);
    await assertIntegratedReleaseCommit({
      repository,
      releaseCommit: base,
      maintainedMainCommit: base,
    });
    await commit(repository, "unmerged feature");
    const feature = await rev(repository);
    await assert.rejects(
      assertIntegratedReleaseCommit({
        repository,
        releaseCommit: feature,
        maintainedMainCommit: base,
      }),
      /not reachable from maintained main/,
    );
    await commit(repository, "integrated successor");
    const integrated = await rev(repository);
    await assertIntegratedReleaseCommit({
      repository,
      releaseCommit: feature,
      maintainedMainCommit: integrated,
    });
  } finally {
    await fs.rm(repository, { recursive: true, force: true });
  }
});

async function commit(repository, message) {
  await fs.writeFile(path.join(repository, "state"), message);
  await git(repository, ["add", "state"]);
  await git(repository, ["commit", "-q", "-m", message]);
}

async function rev(repository) {
  return (await git(repository, ["rev-parse", "HEAD"])).stdout.trim();
}

function git(repository, args) {
  return run("git", args, { cwd: repository });
}
