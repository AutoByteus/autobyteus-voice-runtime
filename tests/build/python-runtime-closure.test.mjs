import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import {
  isRetainedPythonRuntimeFile,
  prunePythonRuntime,
} from "../../build/python/runtime-closure.mjs";
import {
  trustedGoEnvironment,
  verifyGoToolchain,
} from "../../build/locked-inputs.mjs";
import {
  regularFiles,
  ROOT,
  sha256,
  writeJson,
} from "../../build/lib/files.mjs";

const run = promisify(execFile);

test("Python closure excludes dependency tests and development headers coherently", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-python-closure-"),
  );
  try {
    const root = path.join(temp, "python");
    for (const [relative, contents, mode = 0o644] of [
      ["bin/python3", "runtime\n", 0o755],
      ["lib/python3.12/site-packages/scipy/io/runtime.py", "runtime\n"],
      [
        "lib/python3.12/site-packages/scipy/io/tests/data/Transparent Busy.ani",
        "test-data\n",
      ],
      ["lib/python3.12/site-packages/torch/runtime.py", "runtime\n"],
      [
        "lib/python3.12/site-packages/torch/include/c10/util/C++17.h",
        "header\n",
      ],
      [
        "lib/python3.12/site-packages/numpy/testing/__init__.py",
        "runtime-api\n",
      ],
    ]) {
      const file = path.join(root, relative);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, contents, { mode });
    }
    await prunePythonRuntime(root);
    assert.deepEqual(await regularFiles(root), [
      "bin/python3",
      "lib/python3.12/site-packages/numpy/testing/__init__.py",
      "lib/python3.12/site-packages/scipy/io/runtime.py",
      "lib/python3.12/site-packages/torch/runtime.py",
    ]);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("the complete observed staged manifest passes the canonical Go validator after closure", async (t) => {
  if (!process.env.VOICE_GO) return t.skip("VOICE_GO is not configured");
  const fixture = path.join(
      ROOT,
      "tests/fixtures/python-runtime-closure/api-rev-008-package-paths.txt.gz",
    ),
    observedPathBytes = gunzipSync(await fs.readFile(fixture)),
    observedPaths = observedPathBytes.toString("utf8").trimEnd().split("\n"),
    manifest = {
      schemaVersion: 1,
      packageId: "voice.english.whisper-small-fp16.darwin-arm64",
      files: observedPaths.map((filePath) => ({
        path: filePath,
        sha256: "0".repeat(64),
        sizeBytes: 0,
        mode: "read-only",
      })),
    },
    removed = manifest.files.filter(
      ({ path: filePath }) =>
        filePath.startsWith("host/python/") &&
        !isRetainedPythonRuntimeFile(filePath.slice("host/python/".length)),
    ),
    removedPaths = new Set(removed.map(({ path: filePath }) => filePath));
  assert.equal(observedPaths.length, 19003);
  assert.equal(
    sha256(observedPathBytes),
    "5ef013d56d3e2a71a4b20a533c94ae7beb12fdb1874d4e2b24f5861ee7355245",
  );
  assert.ok(removed.some(({ path: filePath }) => filePath.includes("/tests/")));
  assert.ok(
    removed.some(({ path: filePath }) => filePath.includes("/include/")),
  );
  assert.ok(
    removedPaths.has(
      "host/python/lib/python3.12/site-packages/scipy/io/tests/data/Transparent Busy.ani",
    ),
  );
  assert.ok(
    removedPaths.has(
      "host/python/lib/python3.12/site-packages/torch/include/c10/util/C++17.h",
    ),
  );
  manifest.files = manifest.files.filter(
    ({ path: filePath }) => !removedPaths.has(filePath),
  );
  assert.equal(removed.length, 12502);
  assert.equal(manifest.files.length, 6501);
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-manifest-closure-"),
  );
  try {
    const manifestPath = path.join(temp, "package-files-v1.json");
    await writeJson(manifestPath, manifest);
    const toolchain = await verifyGoToolchain(process.env.VOICE_GO);
    await run(
      toolchain.executable,
      [
        "test",
        "./packaging/archive",
        "-run",
        "^TestRuntimeClosureManifest$",
        "-count=1",
      ],
      {
        cwd: ROOT,
        env: {
          ...trustedGoEnvironment(toolchain),
          VOICE_RUNTIME_CLOSURE_MANIFEST: manifestPath,
        },
        timeout: 120000,
        maxBuffer: 4 * 1024 * 1024,
      },
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});
