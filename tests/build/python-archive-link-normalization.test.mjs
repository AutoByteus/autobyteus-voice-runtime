import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import {
  DARWIN_ARM64_PYTHON_ARCHIVE_SHA256,
  normalizeLockedPythonArchiveLinks,
} from "../../build/python/archive-link-normalization.mjs";
import { regularFiles, ROOT, treeDigest } from "../../build/lib/files.mjs";
import { locked } from "../../build/locked-inputs.mjs";
import { prunePythonRuntime } from "../../build/python/materialize-runtime.mjs";

const run = promisify(execFile);
const REAL_LINK_TOPOLOGY = Object.freeze([
  ["bin/2to3", "2to3-3.12"],
  ["bin/idle3", "idle3.12"],
  ["bin/pydoc3", "pydoc3.12"],
  ["bin/python", "python3.12"],
  ["bin/python3", "python3.12"],
  ["bin/python3-config", "python3.12-config"],
  ["lib/pkgconfig/python3-embed.pc", "python-3.12-embed.pc"],
  ["lib/pkgconfig/python3.pc", "python-3.12.pc"],
  ["share/man/man1/python3.1", "python3.12.1"],
]);

test("the exact locked topology becomes a closed relocatable reproducible tree", async () => {
  assert.equal(
    DARWIN_ARM64_PYTHON_ARCHIVE_SHA256,
    locked.pythonBuildStandalone.archives["darwin-arm64"].sha256,
  );
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-python-links-pass-"),
  );
  try {
    const first = path.join(temp, "first"),
      second = path.join(temp, "second"),
      relocated = path.join(temp, "relocated");
    await createRealTopology(first);
    await createRealTopology(second);
    await normalize(first);
    await normalize(second);
    for (const root of [first, second]) {
      await fs.writeFile(
        path.join(root, "bin/huggingface-cli"),
        `#!${root}/bin/python3\nprint('build-only')\n`,
        { mode: 0o755 },
      );
      await fs.writeFile(
        path.join(root, "bin/pip3"),
        `#!${root}/bin/python3\n`,
        {
          mode: 0o755,
        },
      );
      const record = path.join(
        root,
        "lib/python3.12/site-packages/example-1.0.dist-info/RECORD",
      );
      await fs.mkdir(path.dirname(record), { recursive: true });
      await fs.writeFile(record, `../../../bin/huggingface-cli,${root},1\n`);
      await prunePythonRuntime(root);
    }
    const firstDigest = await treeDigest(first);
    assert.equal(firstDigest, await treeDigest(second));
    await fs.rename(first, relocated);
    assert.equal(firstDigest, await treeDigest(relocated));

    const executable = path.join(relocated, "bin/python3"),
      executableInfo = await fs.lstat(executable),
      files = await regularFiles(relocated);
    assert.ok(executableInfo.isFile());
    assert.notEqual(executableInfo.mode & 0o111, 0);
    assert.equal(await fs.readFile(executable, "utf8"), "python-runtime\n");
    assert.ok(files.includes("bin/python3"));
    assert.deepEqual(
      files.filter((relative) => relative.startsWith("bin/")),
      ["bin/python3"],
    );
    assert.ok(
      !files.some((relative) => relative.endsWith(".dist-info/RECORD")),
    );
    for (const [linkPath] of REAL_LINK_TOPOLOGY.filter(
      ([linkPath]) => linkPath !== "bin/python3",
    ))
      await assert.rejects(fs.lstat(path.join(relocated, linkPath)), {
        code: "ENOENT",
      });
    for (const target of [
      "bin/python3.12",
      "bin/2to3-3.12",
      "bin/idle3.12",
      "bin/pydoc3.12",
      "bin/python3.12-config",
      "lib/pkgconfig/python-3.12-embed.pc",
      "lib/pkgconfig/python-3.12.pc",
      "share/man/man1/python3.12.1",
    ])
      await assert.rejects(fs.lstat(path.join(relocated, target)), {
        code: "ENOENT",
      });

    const materializer = await fs.readFile(
      path.join(ROOT, "build/python/materialize-runtime.mjs"),
      "utf8",
    );
    assert.match(materializer, /normalizeLockedPythonArchiveLinks/);
    assert.match(materializer, /--no-index/);
    assert.match(materializer, /--no-deps/);
    assert.doesNotMatch(materializer, /https?:|\bcurl\b|\bwget\b/);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("unsafe, incomplete, and unexpected archive entries fail closed", async (t) => {
  for (const [name, mutate, expected] of [
    [
      "absolute link",
      (root) => replaceLink(root, "bin/python3", "/tmp/python3.12"),
      /absolute link/,
    ],
    [
      "escaping link",
      (root) => replaceLink(root, "bin/python3", "../../../python3.12"),
      /escaping link/,
    ],
    [
      "dangling link",
      (root) => replaceLink(root, "bin/python3", "missing-python"),
      /dangling link/,
    ],
    [
      "cyclic link",
      async (root) => {
        await fs.rm(path.join(root, "bin/python3.12"));
        await fs.symlink("python3", path.join(root, "bin/python3.12"));
      },
      /cyclic symbolic link/,
    ],
    [
      "unexpected link",
      (root) => fs.symlink("python3.12", path.join(root, "bin/extra")),
      /link topology changed/,
    ],
    [
      "missing approved link",
      async (root) => {
        await fs.rm(path.join(root, "bin/python"));
        await fs.writeFile(path.join(root, "bin/python"), "not-a-link\n");
      },
      /link topology changed/,
    ],
    [
      "special entry",
      async (root) => {
        const special = path.join(root, "lib/python3.12/special");
        await run("/usr/bin/mkfifo", [special]);
      },
      /special entry/,
    ],
  ])
    await t.test(name, async () => {
      const temp = await fs.mkdtemp(
        path.join(os.tmpdir(), "voice-python-links-fail-"),
      );
      try {
        const root = path.join(temp, "python");
        await createRealTopology(root);
        await mutate(root);
        await assert.rejects(normalize(root), expected);
      } finally {
        await fs.rm(temp, { recursive: true, force: true });
      }
    });
});

async function normalize(root) {
  return normalizeLockedPythonArchiveLinks(root, {
    target: "darwin-arm64",
    archiveSha256: DARWIN_ARM64_PYTHON_ARCHIVE_SHA256,
  });
}

async function createRealTopology(root) {
  for (const [relative, contents, mode] of [
    ["bin/python3.12", "python-runtime\n", 0o755],
    ["bin/2to3-3.12", "2to3\n", 0o755],
    ["bin/idle3.12", "idle\n", 0o755],
    ["bin/pydoc3.12", "pydoc\n", 0o755],
    ["bin/python3.12-config", "config\n", 0o755],
    ["lib/pkgconfig/python-3.12-embed.pc", "embed\n", 0o644],
    ["lib/pkgconfig/python-3.12.pc", "python\n", 0o644],
    ["share/man/man1/python3.12.1", "manual\n", 0o644],
    ["lib/python3.12/os.py", "# retained runtime file\n", 0o644],
  ]) {
    const file = path.join(root, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, contents, { mode });
  }
  for (const [relative, target] of REAL_LINK_TOPOLOGY) {
    const link = path.join(root, relative);
    await fs.mkdir(path.dirname(link), { recursive: true });
    await fs.symlink(target, link);
  }
}

async function replaceLink(root, relative, target) {
  const link = path.join(root, relative);
  await fs.rm(link);
  await fs.symlink(target, link);
}
