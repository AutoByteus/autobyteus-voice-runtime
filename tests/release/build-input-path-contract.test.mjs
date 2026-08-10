import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  assertBuildInputPath,
  assertBuildInputPathSet,
} from "../../build/build-input-path-policy.mjs";
import { materializeReleaseInputs } from "../../build/materialize-release-inputs.mjs";
import {
  assertInputManifestShape,
  verifyInputManifest,
} from "../../build/locked-inputs.mjs";
import {
  readJson,
  sha256,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";
import { repositoryBuildLockDigest } from "../../build/repository-lock-set.mjs";
import { loadCurrentReleaseMatrix } from "../../release/current-release-matrix.mjs";

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, "../..");
const currentRoutingPaths = [
  "tools/ui/src/routes/(chat)/+layout.svelte",
  "tools/ui/src/routes/(chat)/+page.svelte",
  "tools/ui/src/routes/(chat)/+page.ts",
  "tools/ui/src/routes/(chat)/chat/[id]/+page.svelte",
  "tools/ui/src/routes/(chat)/chat/[id]/+page.ts",
  "tools/ui/src/routes/+error.svelte",
  "tools/ui/src/routes/+layout.svelte",
  "tools/ui/src/routes/mcp-servers/+page.svelte",
  "tools/ui/src/routes/settings/+layout.svelte",
  "tools/ui/src/routes/settings/[[section]]/+page.svelte",
];

test("Build Input path policy accepts the exact current Chinese source path set", async () => {
  const fixture = await fs.readFile(
      path.join(
        root,
        "tests/fixtures/build-input/api-rev-010-chinese-paths.txt.gz",
      ),
    ),
    plain = gunzipSync(fixture),
    paths = plain.toString("utf8").trimEnd().split("\n");
  assert.equal(
    sha256(fixture),
    "991f67d27281c782d69302692198486ab1648b64d550a039099985a87308ac17",
  );
  assert.equal(
    sha256(plain),
    "e083c4c9cf3a072d9a0365b2147f30a3bfd2d522dbacc7b17474cd07305852e6",
  );
  assert.equal(paths.length, 3_149);
  assertBuildInputPathSet(paths);
  for (const relative of currentRoutingPaths)
    assert.ok(paths.includes(`llama-cpp-source/${relative}`));
});

test("Build Input path policy rejects aliases, unsafe syntax, and collisions", () => {
  for (const value of [
    "",
    "/absolute",
    "../escape",
    "source/../escape",
    "source/./alias",
    "source//empty",
    "source\\backslash",
    "source/.git/config",
    "source/trailing.",
    "source/NUL.txt",
    "source/space name",
    "source/non-ascii-ü",
    "source/shell$variable",
    `source/${"a".repeat(234)}`,
  ])
    assert.throws(() => assertBuildInputPath(value), /Build Input path/);
  assert.throws(
    () => assertBuildInputPathSet(["source/File.cc", "source/file.cc"]),
    /case-colliding/,
  );
});

test("aggregate verifier accepts the exact retained API-REV-016 Chinese manifest", async () => {
  const manifestPath = path.join(
      root,
      "tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/chinese-darwin-arm64/build-input-manifest.json",
    ),
    manifest = await readJson(manifestPath),
    punctuationPaths = manifest.files
      .map((item) => item.path)
      .filter((value) => /[()[\]+]/.test(value));
  assert.equal(
    await shaFile(manifestPath),
    "f7bfb8f17fdf52c76d036c082690bda5d488118f491add5793b9e6b6becc2478",
  );
  assert.equal(manifest.files.length, 3_152);
  assert.deepEqual(
    punctuationPaths,
    currentRoutingPaths.map((value) => `llama-cpp-source/${value}`),
  );
  assert.doesNotThrow(() => assertInputManifestShape(manifest));
});

test("aggregate verifier retains canonical unsafe-path and record rejection", () => {
  const record = (relative) => ({
    path: relative,
    sizeBytes: 1,
    sha256: "a".repeat(64),
    mode: "read-only",
  });
  for (const files of [
    [record("source/../escape")],
    [record("source/file.cc"), record("source/file.cc")],
    [record("source/File.cc"), record("source/file.cc")],
  ])
    assert.throws(
      () =>
        assertInputManifestShape({
          schemaVersion: 1,
          files,
        }),
      /Invalid input manifest record/,
    );
  for (const invalid of [
    { ...record("source/file.cc"), sha256: "z".repeat(64) },
    { ...record("source/file.cc"), sizeBytes: 1.5 },
    { ...record("source/file.cc"), mode: "writable" },
  ])
    assert.throws(
      () =>
        assertInputManifestShape({
          schemaVersion: 1,
          files: [invalid],
        }),
      /Invalid input manifest record/,
    );
});

test("package verification rejects an unsafe Build Input manifest record", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-unsafe-input-path-"),
  );
  try {
    const file = path.join(temp, "unsafe$name"),
      bytes = Buffer.from("unsafe path fixture\n");
    await fs.writeFile(file, bytes, { mode: 0o444 });
    await writeJson(path.join(temp, "SHA256SUMS.json"), {
      schemaVersion: 1,
      files: [
        {
          path: "unsafe$name",
          sizeBytes: bytes.length,
          sha256: sha256(bytes),
          mode: "read-only",
        },
      ],
    });
    await fs.chmod(path.join(temp, "SHA256SUMS.json"), 0o444);
    await assert.rejects(verifyInputManifest(temp), /manifest record/);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("materialized current Chinese routing paths pass the package verifier unchanged", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-chinese-input-paths-"),
  );
  const repository = path.join(temp, "repository"),
    checkout = path.join(temp, "cache/checkouts/llama-cpp-source"),
    output = path.join(temp, "output"),
    recipePath = path.join(temp, "chinese-host-darwin-arm64-v2.json");
  try {
    const sourceCommit = await createGitRepository(repository, [
      "source-authority.txt",
    ]);
    const revision = await createGitRepository(checkout, currentRoutingPaths),
      treeId = (
        await run("git", ["rev-parse", "HEAD^{tree}"], { cwd: checkout })
      ).stdout.trim(),
      matrix = await loadCurrentReleaseMatrix(),
      entry = matrix.value.entries.find((item) => item.profileId === "chinese"),
      locked = await readJson(path.join(root, "build/locked-inputs.json"));
    await writeJson(recipePath, {
      schemaVersion: 2,
      recipeId: "chinese-path-contract-v2",
      releaseMatrix: {
        matrixId: matrix.value.matrixId,
        sha256: matrix.sha256,
      },
      package: Object.fromEntries(
        [
          "profileId",
          "languageMode",
          "platform",
          "architecture",
          "hostPackageId",
          "providerId",
          "modelId",
          "modelAssetId",
          "candidateDecision",
        ].map((key) => [key, entry[key]]),
      ),
      inputs: [
        {
          kind: "git-checkout",
          role: "llama-cpp-source",
          destination: "llama-cpp-source",
          repository: "https://github.com/ggml-org/llama.cpp.git",
          revision,
          treeId,
          licenseComponentId: "llama.cpp",
        },
      ],
      toolchain: {
        nodeVersion: "22.23.1",
        goVersion: "1.26.5",
        goArchiveSha256: locked.goToolchain.archives["darwin-arm64"].sha256,
        goRootTreeSha256:
          locked.goToolchain.archives["darwin-arm64"].rootTreeSha256,
        cmakeVersion: "4.2.0",
        appleClang: "17.0.0",
        xcode: "26.1.1",
        sdk: "26.1",
        repositoryLockSha256: await repositoryBuildLockDigest(
          "chinese",
          "darwin-arm64",
        ),
      },
    });
    await materializeReleaseInputs({
      recipePath,
      cacheRoot: path.join(temp, "cache"),
      repository,
      destination: output,
      sourceCommit,
    });
    const manifest = await verifyInputManifest(output),
      paths = manifest.files.map((item) => item.path);
    assert.equal(paths.length, currentRoutingPaths.length + 1);
    for (const relative of currentRoutingPaths)
      assert.ok(paths.includes(`llama-cpp-source/${relative}`));
    assert.deepEqual(
      (
        await fs.readdir(
          path.join(output, "llama-cpp-source/tools/ui/src/routes"),
        )
      ).sort(),
      ["(chat)", "+error.svelte", "+layout.svelte", "mcp-servers", "settings"],
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

async function createGitRepository(directory, files) {
  await fs.mkdir(directory, { recursive: true });
  await run("git", ["init", "-q"], { cwd: directory });
  await run("git", ["config", "user.email", "test@example.invalid"], {
    cwd: directory,
  });
  await run("git", ["config", "user.name", "Test"], { cwd: directory });
  for (const relative of files) {
    const target = path.join(directory, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, `${relative}\n`);
  }
  await run("git", ["add", "."], { cwd: directory });
  await run("git", ["commit", "-q", "-m", "fixture"], { cwd: directory });
  return (
    await run("git", ["rev-parse", "HEAD"], { cwd: directory })
  ).stdout.trim();
}
