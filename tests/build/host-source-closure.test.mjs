import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { deriveHostSourceClosure } from "../../build/host-source-closure.mjs";

const root = path.resolve(import.meta.dirname, "../..");

test("Host Source Closure 1 binds exact repository and hosted tool subjects", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-host-closure-"),
  );
  try {
    const manifest = path.join(temporary, "SHA256SUMS.json");
    await fs.writeFile(manifest, '{"files":[]}\n');
    const digest = (digit) => digit.repeat(64),
      result = await deriveHostSourceClosure({
        repository: root,
        profileId: "english",
        recipePath: path.join(
          root,
          "build/input-recipes/english-host-darwin-arm64-v2.json",
        ),
        inputManifestPath: manifest,
        buildEnvironment: {
          authority: { xcodeVersion: "Xcode 26.1.1\nBuild version 17B100" },
          tools: {
            node: { sha256: digest("1") },
            cmake: { sha256: digest("2") },
            sdk: { settingsSha256: digest("3") },
            cxxCompiler: { targetSha256: digest("4") },
          },
          configuration: {
            generator: "Unix Makefiles",
            buildType: "Release",
            parallelism: 1,
            flagPolicy: "empty-external-native-flags-v1",
          },
        },
        admissionRootPath: path.join(
          root,
          "contracts/model/admission/english-darwin-arm64-v1.json",
        ),
        compatibilityPath: path.join(
          root,
          "contracts/model/compatibility/english-darwin-arm64-v1.json",
        ),
      });
    assert.match(result.value.toolchain.node, new RegExp(digest("1")));
    assert.match(result.value.toolchain.xcode, /Build version 17B100/);
    assert.match(result.value.toolchain.sdk, new RegExp(digest("3")));
    assert.match(result.value.toolchain.compiler, new RegExp(digest("4")));
    assert.ok(
      result.value.repositoryFiles.some(
        (file) => file.path === "build/host-package-metadata.mjs",
      ),
    );
    assert.doesNotMatch(JSON.stringify(result.value), /undefined|\/verified/);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});
