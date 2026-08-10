import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { verifyHostReproducibility } from "../../build/verify-reproducibility.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const identity = (name) => ({
  fileName: name,
  sizeBytes: 1,
  sha256: "a".repeat(64),
});
test("host reproducibility requires whole-archive and complete report equality", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "host-repro-"));
  try {
    const archive = Buffer.from("host"),
      archiveSha = sha(archive),
      report = {
        schemaVersion: 2,
        artifactKind: "host-build-report",
        profileId: "english",
        sourceCommit: "a".repeat(40),
        hostSourceClosure: identity("host-source-closure-v1.json"),
        archive: {
          fileName: "host.zip",
          sizeBytes: archive.length,
          sha256: archiveSha,
          extractedSizeBytes: 1,
          entryCount: 1,
        },
        descriptor: identity("runtime-host-v2.json"),
        fileManifest: identity("host-files-v2.json"),
        noticeInventory: identity("THIRD_PARTY_NOTICES.json"),
        modelAdmissionRoot: identity("model-admission-root-v1.json"),
        compatibilityRequirement: identity(
          "model-compatibility-requirement-v1.json",
        ),
        productTestsExecuted: 0,
        recipe: identity("recipe.json"),
        inputManifest: identity("inputs.json"),
        inputProvenance: identity("provenance.json"),
        hostBuildEnvironment: identity("host-build-environment-v2.json"),
        toolProvenance: identity("tools.json"),
        hostPackageId: "host",
        providerId: "provider",
        modelAssetId: "asset",
        packageVersion: "1.0.0",
        target: { platform: "darwin", architecture: "arm64" },
        launcher: identity("voice-provider"),
        modelManager: identity("voice-model-manager"),
        modelBytesDownloaded: 0,
        providersLaunched: 0,
      };
    for (const side of ["first", "second"]) {
      await fs.writeFile(path.join(root, `${side}.zip`), archive);
      await fs.writeFile(
        path.join(root, `${side}.json`),
        `${JSON.stringify(report)}\n`,
      );
    }
    const output = path.join(root, "proof.json");
    const args = {
      firstArchive: path.join(root, "first.zip"),
      firstReport: path.join(root, "first.json"),
      secondArchive: path.join(root, "second.zip"),
      secondReport: path.join(root, "second.json"),
      output,
    };
    assert.equal((await verifyHostReproducibility(args)).decision, "pass");
    await fs.writeFile(args.secondArchive, "changed");
    await assert.rejects(verifyHostReproducibility(args), /not byte-identical/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
