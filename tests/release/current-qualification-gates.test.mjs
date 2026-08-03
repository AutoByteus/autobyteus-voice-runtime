import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  readJson,
  sha256,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";
import { generatePackageCompliance } from "../../release/compliance/generate-package-compliance.mjs";
import { enforceThresholds } from "../../release/evidence/qualification-set.mjs";
import { assertPassingDarwinArm64Preflight } from "../../benchmark/darwin-arm64-preflight-contract.mjs";

const root = path.resolve(import.meta.dirname, "../..");

test("generated compliance is an exact recipe/provenance/policy/notice join", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-compliance-test-"),
  );
  try {
    const recipePath = path.join(
        root,
        "build/input-recipes/english-darwin-arm64-v1.json",
      ),
      recipe = await readJson(recipePath),
      provenancePath = path.join(temp, "input-provenance-v1.json"),
      archivePath = path.join(temp, "archive.zip"),
      buildPath = path.join(temp, "build.json"),
      outputPath = path.join(temp, "compliance.json"),
      noticesPath = path.join(
        root,
        "release/compliance/package-notices/english/THIRD_PARTY_NOTICES.json",
      );
    await fs.writeFile(archivePath, "archive");
    await writeJson(provenancePath, {
      schemaVersion: 1,
      recipe: {
        fileName: "english-darwin-arm64-v1.json",
        sha256: await shaFile(recipePath),
      },
      releaseMatrix: recipe.releaseMatrix,
      package: recipe.package,
      repository: {
        sourceCommit: "a".repeat(40),
        lockSha256: recipe.toolchain.repositoryLockSha256,
      },
      inputs: recipe.inputs.map((item) => ({
        kind: item.kind,
        role: item.role,
        destination: item.destination,
        identity: item.kind === "git-checkout" ? item.treeId : item.sha256,
        licenseComponentId: item.licenseComponentId,
      })),
      materializedTreeSha256: "b".repeat(64),
    });
    const build = {
      packageId: recipe.package.packageId,
      providerId: recipe.package.providerId,
      modelId: recipe.package.modelId,
      descriptorSha256: "c".repeat(64),
      noticeInventorySha256: await shaFile(noticesPath),
      archive: { sha256: await shaFile(archivePath) },
    };
    await writeJson(buildPath, build);
    const result = await generatePackageCompliance({
      recipePath,
      provenancePath,
      noticesPath,
      buildReportPath: buildPath,
      archivePath,
      outputPath,
    });
    assert.equal(result.decision, "pass");
    assert.deepEqual(
      result.components.map((item) => item.componentId),
      ["go", "mlx-wheelhouse", "python-build-standalone", "whisper-small-mlx"],
    );
    const notices = await readJson(noticesPath);
    notices.components.push({ ...notices.components[0], componentId: "extra" });
    const changed = path.join(temp, "changed-notices.json");
    await writeJson(changed, notices);
    build.noticeInventorySha256 = await shaFile(changed);
    await writeJson(buildPath, build);
    await assert.rejects(
      generatePackageCompliance({
        recipePath,
        provenancePath,
        noticesPath: changed,
        buildReportPath: buildPath,
        archivePath,
        outputPath,
      }),
      /missing or extra/,
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("qualification contract fixes Seatbelt and exact 30/30/100 trial sets", async () => {
  assert.equal(
    await fs.readFile(
      path.join(root, "benchmark/sandbox/darwin-arm64-network-denied-v1.sb"),
      "utf8",
    ),
    "(version 1)\n(allow default)\n(deny network*)\n",
  );
  const source = await fs.readFile(
    path.join(root, "benchmark/run-profile-qualification.mjs"),
    "utf8",
  );
  assert.match(source, /const coldCount = 30,[\s\S]*warmCount = 100/);
  assert.doesNotMatch(source, /cold-count|warm-count/);
  const prepare = await fs.readFile(
    path.join(root, "benchmark/prepare-conditions.mjs"),
    "utf8",
  );
  assert.match(prepare, /"preflight"/);
  assert.doesNotMatch(
    prepare,
    /VOICE_POWER_CONDITION|VOICE_BACKGROUND_LOAD|license-audit|offline-environment/,
  );
  await assert.rejects(
    assertPassingDarwinArm64Preflight({
      schemaVersion: 1,
      target: "darwin-arm64",
      status: "pass",
      checkedAt: "2026-01-01T00:00:00.000Z",
      host: {},
      power: {},
      quiescence: {},
      tools: {},
      sandbox: {},
      purge: {},
      failureCategory: null,
    }),
    /Passing M1 preflight required/,
  );
  const q = {
      profileId: "english",
      handshake: latency(30, 900),
      coldPreparation: latency(30, 19000),
      warmPreparation: latency(30, 9000),
      coldResult: latency(30, 24000),
      warmRequest: latency(100, 9000),
      maxRssBytes: 1024,
      extractedSizeBytes: 1024,
      quality: {
        metric: "WER",
        value: 0.07,
        baseline: { value: 0.07, sampleCount: 49 },
        sampleCount: 49,
        failedCount: 0,
        emptyCount: 0,
      },
    },
    performance = {
      cacheExecutions: Array.from({ length: 30 }),
      cold: Array.from({ length: 30 }),
      warmPreparation: Array.from({ length: 30 }),
      warm: Array.from({ length: 100 }),
    };
  assert.doesNotThrow(() => enforceThresholds(q, performance));
  performance.warmPreparation.pop();
  assert.throws(() => enforceThresholds(q, performance), /exact 30\/30\/100/);
});

test("every current recipe repository-file byte still matches its reviewed digest", async () => {
  for (const name of [
    "english-darwin-arm64-v1.json",
    "chinese-darwin-arm64-v1.json",
  ]) {
    const recipe = await readJson(path.join(root, "build/input-recipes", name));
    for (const item of recipe.inputs.filter(
      (input) => input.kind === "repository-file",
    )) {
      const bytes = await fs.readFile(path.join(root, item.sourcePath));
      assert.equal(bytes.length, item.sizeBytes, `${name}:${item.sourcePath}`);
      assert.equal(sha256(bytes), item.sha256, `${name}:${item.sourcePath}`);
    }
  }
});

function latency(count, p95Ms) {
  return {
    count,
    failures: 0,
    timeouts: 0,
    p50Ms: p95Ms / 2,
    p95Ms,
    maxMs: p95Ms,
  };
}
