import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
const run = promisify(execFile),
  root = path.resolve(import.meta.dirname, "../..");
test("pinned launcher build is byte deterministic and rejects public argv", async (t) => {
  const go = process.env.VOICE_GO;
  if (!go) return t.skip("VOICE_GO is not configured");
  const target = `${process.platform}-${process.arch === "x64" ? "x64" : process.arch}`;
  if (
    !["darwin-arm64", "darwin-x64", "linux-x64", "win32-x64"].includes(target)
  )
    return t.skip("unsupported host");
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "launcher-test-"));
  try {
    const plan = {
      schemaVersion: 1,
      packageId: "fixture.package",
      target: {
        platform: process.platform,
        architecture: process.arch === "x64" ? "x64" : process.arch,
      },
      invocation: {
        kind: "native-worker",
        executable:
          process.platform === "win32"
            ? "provider/worker.exe"
            : "provider/worker",
      },
    };
    const planPath = path.join(directory, "plan.json");
    await fs.writeFile(planPath, `${JSON.stringify(plan)}\n`);
    const digests = [];
    for (const name of ["a", "b"]) {
      const base = path.join(directory, name);
      await fs.mkdir(base);
      const output = path.join(
        base,
        "bin",
        process.platform === "win32" ? "voice-provider.exe" : "voice-provider",
      );
      await run(process.execPath, [
        path.join(root, "packaging/launcher/compile-launcher.mjs"),
        "--plan",
        planPath,
        "--planCopy",
        path.join(base, "plan-copy.json"),
        "--go",
        go,
        "--output",
        output,
        "--provenance",
        path.join(base, "provenance.json"),
        "--target",
        target,
      ]);
      const provenance = JSON.parse(
        await fs.readFile(path.join(base, "provenance.json"), "utf8"),
      );
      for (const key of [
        "goModuleSha256",
        "goSumSha256",
        "launcherSourceSha256",
        "planSha256",
        "launcherSha256",
      ])
        assert.match(provenance[key], /^[a-f0-9]{64}$/);
      assert.equal(provenance.goVersion, "1.26.5");
      assert.equal(provenance.cgoEnabled, false);
      assert.match(provenance.goToolchainRoot.manifestSha256, /^[a-f0-9]{64}$/);
      assert.match(provenance.goToolchainRoot.treeSha256, /^[a-f0-9]{64}$/);
      assert.ok(provenance.goToolchainRoot.fileCount > 10_000);
      assert.ok(provenance.goToolchainRoot.totalSizeBytes > 100_000_000);
      digests.push(
        createHash("sha256")
          .update(await fs.readFile(output))
          .digest("hex"),
      );
      await assert.rejects(run(output, []), (error) => error.code === 64);
    }
    assert.equal(digests[0], digests[1]);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
