import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  readJson,
  sha256,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";
import { repositoryBuildLockDigest } from "../../build/repository-lock-set.mjs";
import { verifyInputManifest } from "../../build/locked-inputs.mjs";
import { materializeReleaseInputs } from "../../build/materialize-release-inputs.mjs";
import { loadCurrentReleaseMatrix } from "../../release/current-release-matrix.mjs";
import { composeBranchCatalogProjection } from "../../release/branch-catalog-projection.mjs";
import { verifyBranchCatalogProjection } from "../../release/verify-branch-catalog-projection.mjs";
import { buildReleaseCatalog } from "../../release/catalog-builder.mjs";
import { assembleReleaseEvidence } from "../../release/evidence/assemble.mjs";
import { assemblePreTagReleaseManifest } from "../../release/pretag-release-manifest.mjs";
import { qualifyRelease } from "../../release/qualify-release.mjs";
import { verifyPublishedAssets } from "../../release/verify-published-assets.mjs";
import { quarantinePublishedRelease } from "../../release/quarantine-published-release.mjs";

const run = promisify(execFile),
  root = path.resolve(import.meta.dirname, "../.."),
  commit = (
    await run("git", ["rev-parse", "HEAD"], { cwd: root })
  ).stdout.trim();

test("Current Release Matrix is the sole exact two-entry current authority", async () => {
  const matrix = await loadCurrentReleaseMatrix();
  assert.deepEqual(
    matrix.value.entries.map((item) => [
      item.profileId,
      `${item.platform}-${item.architecture}`,
      item.providerId,
      item.modelId,
    ]),
    [
      [
        "english",
        "darwin-arm64",
        "autobyteus.voice.mlx-whisper-small",
        "whisper-small-mlx-fp16",
      ],
      [
        "chinese",
        "darwin-arm64",
        "autobyteus.voice.funasr-nano-q8",
        "fun-asr-nano-gguf-q8",
      ],
    ],
  );
  await assert.rejects(
    fs.access(
      path.join(root, "contracts/catalog/required-profile-matrix-v1.json"),
    ),
    { code: "ENOENT" },
  );
});

test("materializer creates a closed deterministic tree from a clean exact repository", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-materializer-test-"),
  );
  const repository = path.join(temp, "repository"),
    cache = path.join(temp, "cache"),
    output = path.join(temp, "output"),
    recipePath = path.join(temp, "english-darwin-arm64-v1.json");
  try {
    await fs.mkdir(repository);
    await fs.mkdir(cache);
    await run("git", ["init", "-q"], { cwd: repository });
    await run("git", ["config", "user.email", "test@example.invalid"], {
      cwd: repository,
    });
    await run("git", ["config", "user.name", "Test"], { cwd: repository });
    const source = path.join(repository, "approved.txt"),
      bytes = Buffer.from("approved input\n");
    await fs.writeFile(source, bytes);
    await run("git", ["add", "approved.txt"], { cwd: repository });
    await run("git", ["commit", "-q", "-m", "fixture"], { cwd: repository });
    const sourceCommit = (
      await run("git", ["rev-parse", "HEAD"], { cwd: repository })
    ).stdout.trim();
    const matrix = await loadCurrentReleaseMatrix(),
      entry = matrix.value.entries[0],
      locked = await readJson(path.join(root, "build/locked-inputs.json")),
      recipe = {
        schemaVersion: 1,
        recipeId: "materializer-fixture-v1",
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
            "packageId",
            "providerId",
            "modelId",
            "decision",
          ].map((key) => [key, entry[key]]),
        ),
        inputs: [
          {
            kind: "repository-file",
            role: "fixture",
            destination: "fixture/approved.txt",
            sourcePath: "approved.txt",
            sizeBytes: bytes.length,
            sha256: sha256(bytes),
            licenseComponentId: "mlx-wheelhouse",
          },
        ],
        toolchain: {
          nodeVersion: "22.23.1",
          goVersion: "1.26.5",
          goArchiveSha256: locked.goToolchain.archives["darwin-arm64"].sha256,
          goRootTreeSha256:
            locked.goToolchain.archives["darwin-arm64"].rootTreeSha256,
          cmakeVersion: "4.3.3",
          appleClang: "17.0.0",
          xcode: "26.1.1",
          sdk: "26.1",
          repositoryLockSha256: await repositoryBuildLockDigest(
            "english",
            "darwin-arm64",
          ),
        },
      };
    await writeJson(recipePath, recipe);
    await materializeReleaseInputs({
      recipePath,
      cacheRoot: cache,
      repository,
      destination: output,
      sourceCommit,
    });
    const manifest = await readJson(path.join(output, "SHA256SUMS.json")),
      provenance = await readJson(
        path.join(output, "input-provenance-v1.json"),
      );
    assert.deepEqual(
      manifest.files.map((item) => item.path),
      ["fixture/approved.txt", "input-provenance-v1.json"],
    );
    assert.ok(manifest.files.every((item) => item.mode === "read-only"));
    await verifyInputManifest(output);
    assert.equal(provenance.repository.sourceCommit, sourceCommit);
    assert.doesNotMatch(JSON.stringify(provenance), new RegExp(temp));
    assert.equal(
      (await fs.stat(path.join(output, "fixture/approved.txt"))).mode & 0o222,
      0,
    );
    assert.equal(
      (await fs.stat(path.join(output, "input-provenance-v1.json"))).mode &
        0o222,
      0,
    );
    assert.equal(
      (await fs.stat(path.join(output, "SHA256SUMS.json"))).mode & 0o222,
      0,
    );
    await fs.writeFile(source, "dirty\n");
    await assert.rejects(
      materializeReleaseInputs({
        recipePath,
        cacheRoot: cache,
        repository,
        destination: path.join(temp, "dirty-output"),
        sourceCommit,
      }),
      /clean/,
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("branch projection is release-neutral, exact, and independently byte-recomputed", async () => {
  const fixture = await lifecycleFixture();
  try {
    await composeBranchCatalogProjection({
      qualificationSetPath: fixture.qsetPath,
      assets: fixture.assets,
      output: fixture.projectionPath,
    });
    const projection = await readJson(fixture.projectionPath);
    assert.equal(projection.entries.length, 2);
    assert.deepEqual(
      projection.assetSet.items.map((item) => item.fileName),
      [
        "voice-chinese-darwin-arm64-99.99.99.zip",
        "voice-english-darwin-arm64-99.99.99.zip",
      ],
    );
    for (const forbidden of [
      "releaseTag",
      "runtimeVersion",
      "url",
      "baseUrl",
      "maintainedMainCommit",
      "published",
    ])
      assert.equal(hasKey(projection, forbidden), false, forbidden);
    await verifyBranchCatalogProjection({
      projectionPath: fixture.projectionPath,
      qualificationSetPath: fixture.qsetPath,
      assets: fixture.assets,
      output: fixture.projectionResult,
    });
    assert.equal((await readJson(fixture.projectionResult)).decision, "pass");
    const extraArchive = path.join(fixture.assets, "voice-extra.zip");
    await fs.writeFile(extraArchive, "not approved\n");
    await assert.rejects(
      composeBranchCatalogProjection({
        qualificationSetPath: fixture.qsetPath,
        assets: fixture.assets,
        output: fixture.projectionPath,
      }),
      /extra or missing archive/,
    );
    await fs.rm(extraArchive);
    projection.packageVersion = "1.0.0";
    await writeJson(fixture.projectionPath, projection);
    await assert.rejects(
      verifyBranchCatalogProjection({
        projectionPath: fixture.projectionPath,
        qualificationSetPath: fixture.qsetPath,
        assets: fixture.assets,
        output: fixture.projectionResult,
      }),
      /failed/,
    );
    assert.equal((await readJson(fixture.projectionResult)).decision, "fail");
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

test("release chain is acyclic and published verification is a separate always-written result", async () => {
  const fixture = await lifecycleFixture();
  try {
    await buildReleaseCatalog({
      qualificationSetPath: fixture.qsetPath,
      releaseEvidencePath: fixture.evidencePath,
      releaseTag: "v99.99.99",
      baseUrl: "https://github.com/autobyteus/runtime/releases/download",
      output: fixture.catalogPath,
    });
    await assemblePreTagReleaseManifest({
      qualificationSetPath: fixture.qsetPath,
      releaseEvidencePath: fixture.evidencePath,
      catalogPath: fixture.catalogPath,
      assets: fixture.assets,
      output: fixture.manifestPath,
    });
    await qualifyRelease({
      manifestPath: fixture.manifestPath,
      qualificationSetPath: fixture.qsetPath,
      releaseEvidencePath: fixture.evidencePath,
      catalogPath: fixture.catalogPath,
      assets: fixture.assets,
      maintainedMainCommit: commit,
      output: fixture.pretagProof,
    });
    const evidence = await readJson(fixture.evidencePath),
      catalog = await readJson(fixture.catalogPath),
      manifest = await readJson(fixture.manifestPath);
    assert.equal(Object.hasOwn(evidence, "catalog"), false);
    assert.equal(Object.hasOwn(evidence, "publishedVerification"), false);
    assert.equal(
      catalog.releaseEvidence.sha256,
      await shaFile(fixture.evidencePath),
    );
    assert.equal(manifest.catalog.sha256, await shaFile(fixture.catalogPath));
    assert.equal(
      manifest.releaseEvidence.sha256,
      await shaFile(fixture.evidencePath),
    );
    await assert.rejects(
      verifyPublishedAssets({
        manifestPath: fixture.manifestPath,
        downloads: fixture.downloads,
        repository: "autobyteus/runtime",
        releaseTag: "v99.99.99",
        output: fixture.publishedResult,
      }),
      /do not match/,
    );
    const failed = await readJson(fixture.publishedResult);
    assert.equal(failed.decision, "fail");
    assert.equal(failed.observations.length, 4);
    assert.ok(failed.observations.every((item) => item.status === "missing"));
    await fs.copyFile(
      fixture.manifestPath,
      path.join(fixture.downloads, "pretag-release-manifest-v1.json"),
    );
    await fs.copyFile(
      fixture.catalogPath,
      path.join(fixture.downloads, manifest.catalog.fileName),
    );
    await fs.copyFile(
      fixture.evidencePath,
      path.join(fixture.downloads, manifest.releaseEvidence.fileName),
    );
    for (const archive of manifest.providerArchives.items)
      await fs.copyFile(
        path.join(fixture.assets, archive.fileName),
        path.join(fixture.downloads, archive.fileName),
      );
    const extra = path.join(fixture.downloads, "unexpected.txt");
    await fs.writeFile(extra, "not published by the approved workflow\n");
    await assert.rejects(
      verifyPublishedAssets({
        manifestPath: fixture.manifestPath,
        downloads: fixture.downloads,
        repository: "autobyteus/runtime",
        releaseTag: "v99.99.99",
        output: fixture.publishedResult,
      }),
      /do not match/,
    );
    await fs.rm(extra);
    const passed = await verifyPublishedAssets({
      manifestPath: fixture.manifestPath,
      downloads: fixture.downloads,
      repository: "autobyteus/runtime",
      releaseTag: "v99.99.99",
      output: fixture.publishedResult,
    });
    assert.equal(passed.decision, "pass");
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

test("quarantine deletes only the failed GitHub Release and proves the tag is unchanged", async () => {
  const fixture = await lifecycleFixture();
  try {
    await buildReleaseCatalog({
      qualificationSetPath: fixture.qsetPath,
      releaseEvidencePath: fixture.evidencePath,
      releaseTag: "v99.99.99",
      baseUrl: "https://github.com/autobyteus/runtime/releases/download",
      output: fixture.catalogPath,
    });
    await assemblePreTagReleaseManifest({
      qualificationSetPath: fixture.qsetPath,
      releaseEvidencePath: fixture.evidencePath,
      catalogPath: fixture.catalogPath,
      assets: fixture.assets,
      output: fixture.manifestPath,
    });
    await assert.rejects(
      verifyPublishedAssets({
        manifestPath: fixture.manifestPath,
        downloads: fixture.downloads,
        repository: "autobyteus/runtime",
        releaseTag: "v99.99.99",
        output: fixture.publishedResult,
      }),
    );
    const calls = [];
    await quarantinePublishedRelease({
      verificationPath: fixture.publishedResult,
      releaseTag: "v99.99.99",
      repository: "autobyteus/runtime",
      output: fixture.quarantineResult,
      request: async (method, apiPath) => {
        calls.push([method, apiPath]);
        if (method === "DELETE") return null;
        if (apiPath.includes("releases/tags") && calls.length > 3)
          throw Object.assign(new Error("absent"), { status: 404 });
        if (apiPath.includes("releases/tags"))
          return { id: 42, tag_name: "v99.99.99" };
        return { object: { sha: "a".repeat(40), type: "commit" } };
      },
    });
    assert.equal(
      (await readJson(fixture.quarantineResult)).decision,
      "release-deleted",
    );
    assert.deepEqual(
      calls.filter(([method]) => method === "DELETE"),
      [["DELETE", "/repos/autobyteus/runtime/releases/42"]],
    );
    assert.equal(
      calls.some(([, apiPath]) => /git\/refs|git\/ref.*DELETE/.test(apiPath)),
      false,
    );
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

test("workflow derives two current jobs and preserves post-publication separation", async () => {
  const workflow = await fs.readFile(
    path.join(root, ".github/workflows/release-voice-runtime.yml"),
    "utf8",
  );
  assert.match(
    workflow,
    /fromJSON\(needs\.current-release-matrix\.outputs\.build\)/,
  );
  assert.match(workflow, /max-parallel: 1/);
  assert.match(
    workflow,
    /uses: actions\/upload-artifact@v4\n\s+if: always\(\)[\s\S]*?name: qualified-\$\{\{ matrix\.profile \}\}-\$\{\{ matrix\.target \}\}/,
  );
  assert.match(
    workflow,
    /aggregate-pretag:[\s\S]*?if: always\(\) && inputs\.operation == 'prequalify'/,
  );
  assert.match(workflow, /Retain qualification audit on pass, fail, or block/);
  assert.doesNotMatch(workflow, /darwin-x64|linux-x64|win32-x64/);
  assert.match(workflow, /pretag-release-manifest-v1\.json/);
  assert.match(workflow, /Always record published-byte verification/);
  assert.match(
    workflow,
    /Always record published-byte verification[\s\S]*?if: always\(\) && steps\.publish\.outcome != 'skipped'/,
  );
  assert.match(workflow, /quarantine-published-release\.mjs/);
  assert.doesNotMatch(workflow, /cleanup-tag|delete.*refs\/tags/i);
});

async function lifecycleFixture() {
  const temp = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-lifecycle-test-"),
    ),
    assets = path.join(temp, "assets"),
    downloads = path.join(temp, "downloads");
  await fs.mkdir(assets);
  await fs.mkdir(downloads);
  const matrix = await loadCurrentReleaseMatrix(),
    files = new Map();
  for (const entry of matrix.value.entries) {
    const fileName = `voice-${entry.profileId}-darwin-arm64-99.99.99.zip`,
      bytes = Buffer.from(`${entry.profileId} archive bytes\n`),
      file = path.join(assets, fileName);
    await fs.writeFile(file, bytes);
    files.set(entry.profileId, {
      fileName,
      sizeBytes: bytes.length,
      sha256: sha256(bytes),
    });
  }
  const profiles = matrix.value.entries.map((entry, index) =>
    profile(entry, files.get(entry.profileId), String(index + 1).repeat(64)),
  );
  const qset = {
    schemaVersion: 1,
    artifactKind: "qualification-set",
    sourceCommit: commit,
    runnerCommit: commit,
    testCommit: commit,
    packageVersion: "99.99.99",
    releaseMatrix: { matrixId: matrix.value.matrixId, sha256: matrix.sha256 },
    profiles,
    decision: "pass",
  };
  const qsetPath = path.join(temp, "qualification-set-v1.json");
  await writeJson(qsetPath, qset);
  const evidencePath = path.join(
    temp,
    "release-qualification-evidence-v1.json",
  );
  await assembleReleaseEvidence({
    qualificationSetPath: qsetPath,
    assets,
    runtimeVersion: "99.99.99",
    releaseTag: "v99.99.99",
    maintainedMainCommit: commit,
    output: evidencePath,
  });
  return {
    temp,
    assets,
    downloads,
    qsetPath,
    evidencePath,
    projectionPath: path.join(temp, "branch-catalog-projection-v1.json"),
    projectionResult: path.join(
      temp,
      "branch-catalog-projection-verification-v1.json",
    ),
    catalogPath: path.join(temp, "voice-runtime-catalog-v3.json"),
    manifestPath: path.join(temp, "pretag-release-manifest-v1.json"),
    pretagProof: path.join(temp, "pretag-proof.json"),
    publishedResult: path.join(temp, "published-result.json"),
    quarantineResult: path.join(temp, "quarantine-result.json"),
  };
}

function profile(entry, archive, digest) {
  const hashes = [
    "recipeSha256",
    "provenanceSha256",
    "nativeBuildEnvironmentSha256",
    "repositoryBuildLockSha256",
    "goToolchainRootTreeSha256",
    "buildReportSha256",
    "reproducibilityProofSha256",
    "descriptorSha256",
    "fileManifestSha256",
    "launcherSha256",
    "launcherPlanSha256",
    "hostSha256",
    "engineConfigurationSha256",
    "modelSha256",
    "normalizerSha256",
    "protocolSha256",
    "capabilityDigest",
    "noticeInventorySha256",
    "generatedComplianceSha256",
    "preflightSha256",
    "sandboxProfileSha256",
    "corpusManifestSha256",
    "baselineSha256",
    "rawResultsSha256",
    "resultIndexSha256",
    "qualificationSummarySha256",
    "runtimeConformanceSha256",
    "qualificationAttemptsSha256",
  ];
  return {
    profileId: entry.profileId,
    languageMode: entry.languageMode,
    platform: entry.platform,
    architecture: entry.architecture,
    packageId: entry.packageId,
    providerId: entry.providerId,
    modelId: entry.modelId,
    candidateDecision: entry.decision,
    ...Object.fromEntries(hashes.map((key) => [key, digest])),
    archive: { ...archive, extractedSizeBytes: 100, entryCount: 2 },
    attempts: {
      started: entry.profileId === "english" ? 160 : 260,
      completed: entry.profileId === "english" ? 160 : 260,
      failed: 0,
      timeouts: 0,
    },
    performance: {
      coldCount: 30,
      warmPreparationCount: 30,
      warmRequestCount: 100,
      failures: 0,
      timeouts: 0,
      samplesSha256: digest,
    },
    quality: {},
    limitations: [],
    outcomes: {
      actualPlatform: true,
      normalizationFixtures: true,
      relocation: true,
      offline: true,
      noPackageMutation: true,
      recovery: true,
      licenseApproved: true,
    },
    decision: "pass",
  };
}

function hasKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.hasOwn(value, key)) return true;
  return Object.values(value).some((item) => hasKey(item, key));
}
