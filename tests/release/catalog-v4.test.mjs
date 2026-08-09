import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { sha256, shaFile, writeJson } from "../../build/lib/files.mjs";
import { buildReleaseCatalog } from "../../release/catalog-builder.mjs";
import { loadCurrentReleaseMatrix } from "../../release/current-release-matrix.mjs";
import { PUBLISHED_ASSET_NAMES } from "../../release/release-contract.mjs";

const root = path.resolve(import.meta.dirname, "../..");

test("Catalog 4 binds exact admitted host/model compatibility pairs", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-catalog-v4-"),
  );
  try {
    const evidencePath = path.join(temporary, "evidence.json"),
      output = path.join(temporary, "catalog.json"),
      evidence = await fixtureEvidence();
    await writeJson(evidencePath, evidence);
    const catalog = await buildReleaseCatalog({
      releaseEvidence: evidencePath,
      baseUrl: "https://example.invalid/releases/download",
      output,
    });
    assert.deepEqual(
      catalog.entries.map((entry) => entry.profileId),
      ["english", "chinese"],
    );
    for (const entry of catalog.entries) {
      const profile = evidence.profiles.find(
        (item) => item.profileId === entry.profileId,
      );
      assert.equal(
        entry.compatibilityPairSha256,
        profile.compatibilityPairSha256,
      );
      assert.match(entry.host.archive.url, /\/v1\.0\.0\/voice-host-/);
      assert.match(entry.model.manifest.url, /\/v1\.0\.0\/voice-model-/);
    }
    evidence.profiles[0].compatibilityPairSha256 = "0".repeat(64);
    await writeJson(evidencePath, evidence);
    await assert.rejects(
      buildReleaseCatalog({
        releaseEvidence: evidencePath,
        baseUrl: "https://example.invalid/releases/download",
        output,
      }),
      /host\/model authority mismatch/,
    );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

async function fixtureEvidence() {
  const matrix = await loadCurrentReleaseMatrix(),
    profiles = [];
  for (const entry of matrix.value.entries) {
    const descriptor =
        entry.profileId === "english" ? "a".repeat(64) : "b".repeat(64),
      pair = {
        hostPackageId: entry.hostPackageId,
        descriptorSha256: descriptor,
        compatibilityRequirementSha256: entry.compatibilityRequirementSha256,
        modelManifestSha256: entry.modelManifest.sha256,
        capabilityDigest: entry.capabilityDigest,
      },
      manifestPath = path.join(
        root,
        "release/model-manifests",
        entry.modelManifest.fileName,
      ),
      manifestInfo = await fs.stat(manifestPath);
    assert.equal(await shaFile(manifestPath), entry.modelManifest.sha256);
    profiles.push({
      profileId: entry.profileId,
      hostArchive: {
        fileName: `voice-host-${entry.profileId}-darwin-arm64-1.0.0.zip`,
        sizeBytes: 1,
        sha256: entry.profileId === "english" ? "c".repeat(64) : "d".repeat(64),
      },
      hostSourceClosureSha256: "e".repeat(64),
      modelAdmissionRootSha256: entry.modelAdmissionRoot.sha256,
      modelManifest: {
        fileName: entry.modelManifest.fileName,
        sizeBytes: manifestInfo.size,
        sha256: entry.modelManifest.sha256,
      },
      compatibilityPairSha256: sha256(
        Buffer.from(`${JSON.stringify(pair, null, 2)}\n`),
      ),
      hostDescriptorSha256: descriptor,
      hostFileManifestSha256: "f".repeat(64),
      hostSourceClosureSizeBytes: 1,
    });
  }
  const identity = (fileName, digit) => ({
    fileName,
    sizeBytes: 1,
    sha256: digit.repeat(64),
  });
  return {
    schemaVersion: 4,
    artifactKind: "release-qualification-evidence",
    runtimeVersion: "1.0.0",
    releaseTag: "v1.0.0",
    finalMainCommit: "1".repeat(40),
    releaseSourceAdmission: identity("source.json", "1"),
    hostConstruction: identity("construction.json", "2"),
    modelManifestAdmission: identity("admission.json", "3"),
    matrix: identity("matrix.json", "4"),
    profiles,
    expectedAssetNames: PUBLISHED_ASSET_NAMES,
    executionCounts: {
      productTests: 0,
      modelDownloads: 0,
      providerLaunches: 0,
    },
    decision: "pass",
  };
}
