import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { ROOT, sha256, shaFile } from "../../build/lib/files.mjs";
import {
  canonicalExecutablePath,
  captureXcodeClangCxxIdentity,
} from "../../build/native-tool-identities.mjs";

const run = promisify(execFile),
  fixtureRoot = path.join(
    ROOT,
    "tests/fixtures/chinese-worker-native-headers-v1",
  ),
  fixtureManifestPath = path.join(fixtureRoot, "manifest.json"),
  fixtureManifestSha256 =
    "3b7cc6f9c1689a1ad75a64d1b597da938d0c474de27787ca6e14c6b502243c86",
  providerRoot = path.join(ROOT, "providers/chinese-funasr"),
  providerSource = path.join(providerRoot, "src"),
  productionSources = [
    "src/main.cpp",
    "src/session.cpp",
    "src/package_integrity.cpp",
    "src/package_integrity_apple.cpp",
    "src/preparation_diagnostics.cpp",
    "src/audio.cpp",
    "src/audio_features.cpp",
    "src/normalization.cpp",
    "src/result_policy.cpp",
    "src/funasr_engine.cpp",
    "${UTF8PROC_SOURCE_DIR}/utf8proc.c",
  ];

test("complete production Chinese worker translation set compiles with locked Apple inputs", async (t) => {
  if (process.platform !== "darwin" || process.arch !== "arm64")
    return t.skip("production Chinese worker target is darwin-arm64 only");

  const recipe = JSON.parse(
      await fs.readFile(
        path.join(
          ROOT,
          "build/input-recipes/chinese-host-darwin-arm64-v2.json",
        ),
      ),
    ),
    manifestBytes = await fs.readFile(fixtureManifestPath),
    manifest = JSON.parse(manifestBytes),
    archivePath = path.join(fixtureRoot, manifest.archive.fileName),
    cmake = await fs.readFile(
      path.join(providerRoot, "CMakeLists.txt"),
      "utf8",
    ),
    declaredSources = cmake
      .match(/add_executable\(voice-provider-worker\s+([\s\S]*?)\)/)?.[1]
      .trim()
      .split(/\s+/);

  assert.equal(sha256(manifestBytes), fixtureManifestSha256);
  assert.deepEqual(declaredSources, productionSources);
  assert.match(
    cmake,
    /target_compile_options\(voice-provider-worker PRIVATE -Wall -Wextra -Werror\)/,
  );
  assert.deepEqual(
    manifest.sources.map(({ directory, revision, treeId }) => ({
      directory,
      revision,
      treeId,
    })),
    recipe.inputs
      .filter(({ destination }) =>
        ["llama-cpp-source", "utf8proc-source"].includes(destination),
      )
      .map(({ destination, revision, treeId }) => ({
        directory: destination,
        revision,
        treeId,
      })),
  );
  assert.equal(manifest.toolchain.xcode, recipe.toolchain.xcode);
  assert.equal(manifest.toolchain.sdk, recipe.toolchain.sdk);
  const archiveInfo = await fs.stat(archivePath);
  assert.equal(archiveInfo.size, manifest.archive.sizeBytes);
  assert.equal(await shaFile(archivePath), manifest.archive.sha256);

  const work = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-chinese-native-compile-"),
  );
  try {
    await run("/usr/bin/tar", ["-xzf", archivePath, "-C", work]);
    assert.deepEqual(
      await fixtureFiles(work),
      manifest.files.map(({ path }) => path),
    );
    for (const record of manifest.files) {
      const file = path.join(work, record.path),
        info = await fs.lstat(file),
        bytes = await fs.readFile(file);
      assert.equal(info.isFile() && !info.isSymbolicLink(), true, record.path);
      assert.equal(info.size, record.sizeBytes, record.path);
      assert.equal(sha256(bytes), record.sha256, record.path);
      assert.equal(gitBlobSha1(bytes), record.gitBlobSha1, record.path);
    }

    const cInvocation = (
        await run("/usr/bin/xcrun", ["--find", "clang"])
      ).stdout.trim(),
      cxxInvocation = (
        await run("/usr/bin/xcrun", ["--find", "clang++"])
      ).stdout.trim(),
      cTarget = await canonicalExecutablePath(cInvocation),
      compilerIdentity = await captureXcodeClangCxxIdentity(cxxInvocation, {
        path: cTarget,
        sha256: await shaFile(cTarget),
      }),
      clangVersion = (await run(compilerIdentity.invocationPath, ["--version"]))
        .stdout,
      xcodeVersion = (await run("/usr/bin/xcodebuild", ["-version"])).stdout,
      sdkVersion = (
        await run("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-version"])
      ).stdout.trim(),
      sdkPath = (
        await run("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-path"])
      ).stdout.trim();
    assert.match(
      clangVersion,
      new RegExp(
        `^Apple clang version ${escapeRegex(recipe.toolchain.appleClang)}`,
      ),
    );
    assert.equal(
      compilerIdentity.targetSha256,
      manifest.toolchain.compilerTargetSha256,
    );
    assert.equal(
      xcodeVersion,
      `Xcode ${recipe.toolchain.xcode.replace(" (", "\nBuild version ").replace(")", "")}\n`,
    );
    assert.equal(sdkVersion, recipe.toolchain.sdk.replace("macOS ", ""));
    assert.equal(
      await shaFile(path.join(sdkPath, "SDKSettings.json")),
      manifest.toolchain.sdkSettingsSha256,
    );

    const includeArguments = [
        "-I",
        providerSource,
        "-I",
        path.join(work, "llama-cpp-source/vendor"),
        "-I",
        path.join(work, "llama-cpp-source/include"),
        "-I",
        path.join(work, "llama-cpp-source/ggml/include"),
        "-I",
        path.join(work, "utf8proc-source"),
      ],
      commonArguments = [
        "-DGGML_USE_BLAS",
        "-DGGML_USE_CPU",
        "-DGGML_USE_METAL",
        "-Wall",
        "-Wextra",
        "-Werror",
        "-arch",
        "arm64",
        "-isysroot",
        sdkPath,
        "-fsyntax-only",
        ...includeArguments,
      ];
    for (const relative of productionSources.filter((file) =>
      file.endsWith(".cpp"),
    ))
      await run(compilerIdentity.invocationPath, [
        "-std=c++20",
        ...commonArguments,
        path.join(providerRoot, relative),
      ]);
    await run(cInvocation, [
      "-std=c17",
      ...commonArguments,
      path.join(work, "utf8proc-source/utf8proc.c"),
    ]);
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
});

async function fixtureFiles(root) {
  const result = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(target);
      else result.push(path.relative(root, target).split(path.sep).join("/"));
    }
  }
  await walk(root);
  return result.sort();
}

function gitBlobSha1(bytes) {
  return createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest("hex");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
