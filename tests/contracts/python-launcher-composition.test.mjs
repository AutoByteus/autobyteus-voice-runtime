import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { ROOT, shaFile, writeJson } from "../../build/lib/files.mjs";

const run = promisify(execFile);

test("relocated public launcher bootstraps the contained Python import root", async (t) => {
  if (!process.env.VOICE_GO) return t.skip("VOICE_GO is not configured");
  const architecture = process.arch === "x64" ? "x64" : process.arch,
    tuple = `${process.platform}-${architecture}`,
    systemPython = "/usr/bin/python3";
  if (!["darwin-arm64", "darwin-x64", "linux-x64"].includes(tuple))
    return t.skip("unsupported host");
  try {
    if (!(await fs.lstat(systemPython)).isFile())
      return t.skip("system Python fixture is unavailable");
  } catch (error) {
    if (error.code === "ENOENT")
      return t.skip("system Python fixture is unavailable");
    throw error;
  }

  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-python-launcher-composition-"),
  );
  try {
    const packageRoot = path.join(temp, "relocated package ü"),
      launcher = path.join(packageRoot, "bin/voice-provider"),
      planCopy = path.join(
        packageRoot,
        "provider/package-launcher-plan-v1.json",
      ),
      descriptor = path.join(packageRoot, "provider/provider-package-v1.json"),
      manifest = path.join(packageRoot, "provider/package-files-v1.json"),
      privatePython = path.join(packageRoot, "host/python/bin/python3"),
      worker = path.join(packageRoot, "worker/worker.py"),
      application = path.join(
        packageRoot,
        "worker/autobyteus_voice_provider/__init__.py",
      ),
      planPath = path.join(temp, "plan.json"),
      provenance = path.join(temp, "launcher-provenance.json"),
      config = path.join(temp, "session.json"),
      unrelatedCwd = path.join(temp, "unrelated-cwd"),
      packageId = "fixture.python-launcher",
      sessionId = "00000000-0000-4000-8000-000000000025",
      plan = {
        schemaVersion: 1,
        packageId,
        target: { platform: process.platform, architecture },
        invocation: {
          kind: "python-worker",
          executable: "host/python/bin/python3",
          worker: "worker/worker.py",
        },
      };
    await fs.mkdir(unrelatedCwd, { recursive: true });
    await writeJson(planPath, plan);
    await run(process.execPath, [
      path.join(ROOT, "packaging/launcher/compile-launcher.mjs"),
      "--plan",
      planPath,
      "--planCopy",
      planCopy,
      "--go",
      process.env.VOICE_GO,
      "--output",
      launcher,
      "--provenance",
      provenance,
      "--target",
      tuple,
    ]);

    await fs.mkdir(path.dirname(privatePython), { recursive: true });
    await fs.writeFile(privatePython, `#!/bin/sh\nexec ${systemPython} "$@"\n`);
    await fs.chmod(privatePython, 0o555);
    await fs.mkdir(path.dirname(application), { recursive: true });
    await fs.writeFile(
      application,
      [
        "import json",
        "import os",
        "import shutil",
        "import sys",
        "",
        "def emit_first_frame(session_id):",
        '    print(json.dumps({"type":"hello","protocolVersion":1,"sessionId":session_id,"isolated":sys.flags.isolated,"importRoot":sys.path[0]}, separators=(",", ":")), flush=True)',
        '    shutil.rmtree(os.environ["HOME"])',
        "",
      ].join("\n"),
    );
    await fs.writeFile(
      worker,
      [
        "from autobyteus_voice_provider import emit_first_frame",
        "if __name__ == '__main__':",
        `    emit_first_frame(${JSON.stringify(sessionId)})`,
        "",
      ].join("\n"),
    );
    await writeJson(descriptor, { fixture: "descriptor" });
    for (const file of [application, worker, descriptor, planCopy])
      await fs.chmod(file, 0o444);
    await fs.chmod(launcher, 0o555);

    const records = await Promise.all(
      [
        ["bin/voice-provider", launcher, "executable"],
        ["host/python/bin/python3", privatePython, "executable"],
        ["provider/package-launcher-plan-v1.json", planCopy, "read-only"],
        ["provider/provider-package-v1.json", descriptor, "read-only"],
        [
          "worker/autobyteus_voice_provider/__init__.py",
          application,
          "read-only",
        ],
        ["worker/worker.py", worker, "read-only"],
      ].map(async ([relative, file, mode]) => ({
        path: relative,
        sha256: await shaFile(file),
        sizeBytes: (await fs.stat(file)).size,
        mode,
      })),
    );
    records.sort((left, right) => left.path.localeCompare(right.path));
    await writeJson(manifest, { schemaVersion: 1, packageId, files: records });
    await fs.chmod(manifest, 0o444);
    await writeJson(config, {
      schemaVersion: 1,
      protocolVersion: 1,
      sessionId,
      profileId: "english",
      expected: {
        packageId,
        providerId: "fixture.provider",
        modelId: "fixture.model",
        languageMode: "en",
        platform: process.platform,
        architecture,
        descriptorSha256: await shaFile(descriptor),
        fileManifestSha256: await shaFile(manifest),
        capabilityDigest: "a".repeat(64),
      },
    });

    let stdout, stderr;
    try {
      ({ stdout, stderr } = await run(launcher, ["--session-config", config], {
        cwd: unrelatedCwd,
        env: {
          ...process.env,
          PYTHONHOME: "/ambient/python/home/must-not-be-used",
          PYTHONPATH: "/ambient/python/path/must-not-be-used",
        },
        timeout: 30000,
      }));
    } catch (error) {
      assert.fail(
        `launcher failed code=${error.code} signal=${error.signal} killed=${error.killed}: ${error.message}; stdout=${error.stdout} stderr=${error.stderr}`,
      );
    }
    assert.deepEqual(JSON.parse(stdout.trim()), {
      type: "hello",
      protocolVersion: 1,
      sessionId,
      isolated: 1,
      importRoot: await fs.realpath(path.dirname(worker)),
    });
    assert.equal(stderr, "");
    assert.deepEqual(
      (await fs.readdir(path.join(packageRoot, "worker"))).sort(),
      ["autobyteus_voice_provider", "worker.py"],
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});
