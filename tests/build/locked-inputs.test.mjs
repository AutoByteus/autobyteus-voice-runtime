import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { verifyGoToolchain } from "../../build/locked-inputs.mjs";
import { verifyGitSource } from "../../build/native/locked-source.mjs";
import { verifyWheelhouse } from "../../build/python/materialize-runtime.mjs";
import { assertInputClosure } from "../../build/profile-builders/common.mjs";

const run = promisify(execFile);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("version-preserving fake Go compiler is rejected by exact bytes", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "voice-fake-go-"));
  try {
    const fake = path.join(
      directory,
      process.platform === "win32" ? "go.exe" : "go",
    );
    await fs.writeFile(
      fake,
      "#!/bin/sh\necho go version go1.26.5 darwin/arm64\n",
    );
    await fs.chmod(fake, 0o755);
    await assert.rejects(verifyGoToolchain(fake), /not repository-locked/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("locked native source rejects a modified tree at the same commit", async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-source-"),
  );
  try {
    await run("git", ["init", "-q"], { cwd: directory });
    await run("git", ["config", "user.email", "test@example.invalid"], {
      cwd: directory,
    });
    await run("git", ["config", "user.name", "Test"], { cwd: directory });
    const source = path.join(directory, "source.cpp");
    await fs.writeFile(source, "approved\n");
    await run("git", ["add", "source.cpp"], { cwd: directory });
    await run("git", ["commit", "-q", "-m", "approved"], { cwd: directory });
    const commit = (
      await run("git", ["rev-parse", "HEAD"], { cwd: directory })
    ).stdout.trim();
    await verifyGitSource(directory, commit, "fixture");
    await fs.writeFile(source, "tampered\n");
    await assert.rejects(
      verifyGitSource(directory, commit, "fixture"),
      /differs from its locked commit/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("wheelhouse rejects target wheel bytes changed without a version change", async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-wheelhouse-"),
  );
  try {
    const fileName = "provider-1.0.0-py3-none-any.whl";
    const approved = Buffer.from("approved wheel bytes");
    await fs.writeFile(path.join(directory, fileName), approved);
    const lock = {
      wheels: [{ fileName, sha256: digest(approved) }],
    };
    await verifyWheelhouse(directory, lock);
    await fs.writeFile(path.join(directory, fileName), "tampered wheel bytes");
    await assert.rejects(
      verifyWheelhouse(directory, lock),
      /Locked wheel identity mismatch/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("operator-materialized Python trees are not accepted as build inputs", () => {
  assert.throws(
    () =>
      assertInputClosure(
        { inputManifest: { files: [{ path: "python-root/lib/modified.py" }] } },
        [
          "python-host-archive",
          "python-wheelhouse/",
          "model/",
          "package-notices/",
        ],
      ),
    /not consumed by a locked owner/,
  );
});
