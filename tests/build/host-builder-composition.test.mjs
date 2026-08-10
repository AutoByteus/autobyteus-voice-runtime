import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { readJson, ROOT, shaFile, writeJson } from "../../build/lib/files.mjs";
import {
  trustedGoEnvironment,
  verifyGoToolchain,
} from "../../build/locked-inputs.mjs";
import {
  cmakeConfigureArguments,
  verifyResolvedCmakeConfiguration,
} from "../../build/resolved-cmake-configuration.mjs";
import { verifyHostArchive } from "../../build/host-package-verifier.mjs";
import {
  ASSEMBLER_HOST_AUTHORITY_INPUTS,
  assertHostInputOwnership,
} from "../../build/host-package-staging.mjs";
import { PROFILE_BUILDER_INPUT_PATTERNS } from "../../build/profile-builders/host-input-ownership.mjs";

const run = promisify(execFile);
const CURRENT_MANIFESTS = Object.freeze({
  english: Object.freeze({
    count: 48,
    pathsSha256:
      "062b14ea35ac306747caebd05c1e8579104b679e36578b963a067e70e0077870",
  }),
  chinese: Object.freeze({
    count: 3151,
    pathsSha256:
      "f6ae6f8e9339b584fb0be4423ea486bb5f5b05ac3f3bddccb02905e1005b5659",
  }),
});

test("both real host builders load their production module contracts", async () => {
  assert.equal(typeof cmakeConfigureArguments, "function");
  assert.equal(typeof verifyResolvedCmakeConfiguration, "function");
  for (const builder of ["mlx-host.mjs", "funasr-host.mjs"])
    await assert.rejects(
      run(
        process.execPath,
        [path.join(ROOT, "build/profile-builders", builder)],
        { cwd: ROOT, encoding: "utf8" },
      ),
      (error) => {
        assert.match(error.stderr, /Missing --target\./);
        assert.doesNotMatch(error.stderr, /does not provide an export named/);
        return true;
      },
    );
});

test("complete current host manifests have exactly one construction owner", async () => {
  for (const profile of ["english", "chinese"]) {
    const recipe = await readJson(
        path.join(
          ROOT,
          `build/input-recipes/${profile}-host-darwin-arm64-v2.json`,
        ),
      ),
      manifest = await currentManifest(profile),
      ownership = assertHostInputOwnership(
        manifest,
        PROFILE_BUILDER_INPUT_PATTERNS[profile],
      );
    assertRecipeClosesManifest(recipe, manifest);
    assert.deepEqual(
      ownership.assemblerOwned,
      ASSEMBLER_HOST_AUTHORITY_INPUTS,
      profile,
    );
    assert.equal(
      ownership.profileOwnedCount,
      manifest.files.length - 1 - ASSEMBLER_HOST_AUTHORITY_INPUTS.length,
      profile,
    );
    assert.throws(
      () =>
        assertHostInputOwnership(
          appendPath(manifest, "host-authority/unexpected-v1.json"),
          PROFILE_BUILDER_INPUT_PATTERNS[profile],
        ),
      /exactly one construction owner/,
      `${profile} accepted an unexpected third host authority`,
    );
    assert.throws(
      () =>
        assertHostInputOwnership(
          appendPath(manifest, "operator-materialized/unrelated.bin"),
          PROFILE_BUILDER_INPUT_PATTERNS[profile],
        ),
      /exactly one construction owner/,
      `${profile} accepted an unrelated unused input`,
    );
    assert.throws(
      () =>
        assertHostInputOwnership(manifest, [
          ...PROFILE_BUILDER_INPUT_PATTERNS[profile],
          "host-authority/",
        ]),
      /exactly one construction owner/,
      `${profile} accepted ambiguous broad authority ownership`,
    );
    assert.throws(
      () =>
        assertHostInputOwnership(
          {
            files: manifest.files.filter(
              (item) => item.path !== ASSEMBLER_HOST_AUTHORITY_INPUTS.at(-1),
            ),
          },
          PROFILE_BUILDER_INPUT_PATTERNS[profile],
        ),
      /authority input set is incomplete/,
      `${profile} accepted an incomplete outer authority set`,
    );
  }
});

test("real host extraction reports the logical archive root", async () => {
  assert.ok(
    process.env.VOICE_GO,
    "VOICE_GO must identify the repository-locked Go toolchain",
  );
  const temporary = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-host-verifier-composition-"),
    ),
    payload = path.join(temporary, "payload"),
    provider = path.join(payload, "provider"),
    archive = path.join(temporary, "voice-english-host-darwin-arm64-1.0.0.zip"),
    archiveReport = path.join(temporary, "archive-report.json"),
    buildReport = path.join(temporary, "host-build-report-v2.json"),
    verification = path.join(temporary, "host-verification-v2.json"),
    closureSha256 = "1".repeat(64),
    admissionSha256 = "2".repeat(64),
    compatibilitySha256 = "3".repeat(64),
    hostPackageId = "autobyteus.voice.english.darwin-arm64";
  try {
    await fs.mkdir(provider, { recursive: true });
    const descriptor = {
      schemaVersion: 2,
      hostPackageId,
      packageVersion: "1.0.0",
      providerId: "mlx-whisper-small-fp16",
      target: { platform: "darwin", architecture: "arm64" },
      protocolVersion: 1,
      sessionConfigVersion: 2,
      modelInstallationEventsVersion: 1,
      launcher: "bin/voice-provider",
      modelManager: "bin/voice-model-manager",
      launcherPlan: {
        path: "provider/package-launcher-plan-v2.json",
        sha256: "4".repeat(64),
      },
      host: {
        kind: "bundled-python",
        version: "3.12.9",
        executable: "python/bin/python3",
        sha256: "5".repeat(64),
      },
      worker: { entrypoint: "worker/worker.py", sha256: "6".repeat(64) },
      engine: {
        kind: "mlx-whisper",
        version: "0.4.3",
        configuration: {
          path: "provider/engine-configuration-v1.json",
          sha256: "7".repeat(64),
        },
      },
      profiles: [
        {
          profileId: "english",
          languageMode: "en",
          normalizationProfile: "autobyteus-english-v1",
          capabilityDigest: "8".repeat(64),
        },
      ],
      audioContract: "autobyteus-pcm16-mono-16khz-wav-v1",
      hostSourceClosure: {
        path: "provider/host-source-closure-v1.json",
        sha256: closureSha256,
      },
      modelAdmissionRoot: {
        path: "provider/model-admission-root-v1.json",
        sha256: admissionSha256,
      },
      modelCompatibilityRequirement: {
        path: "provider/model-compatibility-requirement-v1.json",
        sha256: compatibilitySha256,
      },
      fileManifestPath: "provider/host-files-v2.json",
      noticeInventoryPath: "THIRD_PARTY_NOTICES.json",
    };
    const descriptorPath = path.join(provider, "runtime-host-v2.json");
    await writeJson(descriptorPath, descriptor);
    const descriptorIdentity = await identity(
      descriptorPath,
      "runtime-host-v2.json",
    );
    await writeJson(path.join(provider, "host-files-v2.json"), {
      schemaVersion: 2,
      hostPackageId,
      files: [
        {
          path: "provider/runtime-host-v2.json",
          sha256: descriptorIdentity.sha256,
          sizeBytes: descriptorIdentity.sizeBytes,
          mode: "read-only",
        },
      ],
    });
    const manifestIdentity = await identity(
        path.join(provider, "host-files-v2.json"),
        "host-files-v2.json",
      ),
      toolchain = await verifyGoToolchain(process.env.VOICE_GO);
    await run(
      toolchain.executable,
      [
        "run",
        "./packaging/cmd/runtime-host-tool",
        "build",
        "--root",
        payload,
        "--output",
        archive,
        "--report",
        archiveReport,
      ],
      { cwd: ROOT, env: trustedGoEnvironment(toolchain) },
    );
    const archiveFacts = await readJson(archiveReport),
      placeholder = (fileName, digit) => ({
        fileName,
        sizeBytes: 1,
        sha256: digit.repeat(64),
      });
    await writeJson(buildReport, {
      schemaVersion: 2,
      artifactKind: "host-build-report",
      profileId: "english",
      sourceCommit: "a".repeat(40),
      hostSourceClosure: {
        fileName: "host-source-closure-v1.json",
        sizeBytes: 1,
        sha256: closureSha256,
      },
      archive: {
        fileName: path.basename(archive),
        sizeBytes: archiveFacts.compressedSizeBytes,
        sha256: archiveFacts.sha256,
        extractedSizeBytes: archiveFacts.extractedSizeBytes,
        entryCount: archiveFacts.entryCount,
      },
      descriptor: descriptorIdentity,
      fileManifest: manifestIdentity,
      noticeInventory: placeholder("THIRD_PARTY_NOTICES.json", "9"),
      modelAdmissionRoot: {
        fileName: "model-admission-root-v1.json",
        sizeBytes: 1,
        sha256: admissionSha256,
      },
      compatibilityRequirement: {
        fileName: "model-compatibility-requirement-v1.json",
        sizeBytes: 1,
        sha256: compatibilitySha256,
      },
      productTestsExecuted: 0,
      recipe: placeholder("recipe.json", "a"),
      inputManifest: placeholder("inputs.json", "b"),
      inputProvenance: placeholder("provenance.json", "c"),
      hostBuildEnvironment: placeholder("environment.json", "d"),
      toolProvenance: placeholder("tools.json", "e"),
      hostPackageId,
      providerId: descriptor.providerId,
      modelAssetId: "mlx-whisper-small-fp16-model",
      packageVersion: "1.0.0",
      target: descriptor.target,
      launcher: placeholder("voice-provider", "f"),
      modelManager: placeholder("voice-model-manager", "0"),
      modelBytesDownloaded: 0,
      providersLaunched: 0,
    });
    const result = await verifyHostArchive({
      archive,
      buildReport,
      go: process.env.VOICE_GO,
      output: verification,
    });
    assert.equal(result.hostRoot, "host");
    assert.equal((await readJson(verification)).hostRoot, "host");
    assert.notEqual(result.hostRoot, path.join(temporary, "verified-host"));
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

async function identity(file, fileName) {
  return {
    fileName,
    sizeBytes: (await fs.stat(file)).size,
    sha256: await shaFile(file),
  };
}

function appendPath(manifest, pathValue) {
  return { files: [...manifest.files, { path: pathValue }] };
}

async function currentManifest(profile) {
  const bytes = gunzipSync(
      await fs.readFile(
        path.join(
          ROOT,
          `tests/fixtures/host-input-ownership/api-rev-023-${profile}-paths.txt.gz`,
        ),
      ),
    ),
    authority = CURRENT_MANIFESTS[profile],
    paths = bytes.toString("utf8").trimEnd().split("\n");
  assert.equal(paths.length, authority.count, profile);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    authority.pathsSha256,
    profile,
  );
  return { files: paths.map((pathValue) => ({ path: pathValue })) };
}

function assertRecipeClosesManifest(recipe, manifest) {
  const materialized = manifest.files
    .map((item) => item.path)
    .filter((item) => item !== "host-input-provenance-v2.json");
  for (const input of recipe.inputs) {
    const owns = (item) =>
      input.kind === "git-checkout"
        ? item.startsWith(`${input.destination}/`)
        : item === input.destination;
    assert.ok(materialized.some(owns), input.destination);
  }
  for (const item of materialized)
    assert.ok(
      recipe.inputs.some((input) =>
        input.kind === "git-checkout"
          ? item.startsWith(`${input.destination}/`)
          : item === input.destination,
      ),
      item,
    );
}
