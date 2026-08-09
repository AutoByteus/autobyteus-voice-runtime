import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { writeJson } from "../../build/lib/files.mjs";
import { sealPrepublicationBundle } from "../../release/prepublication-seal.mjs";
import {
  CHECKSUM_COVERED_NAMES,
  ordinaryFileIdentity,
  writeChecksums,
} from "../../release/release-contract.mjs";

test("the prepublication seal closes exactly eight prior assets plus checksums", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "voice-seal-"));
  try {
    for (const fileName of CHECKSUM_COVERED_NAMES)
      if (fileName !== "pretag-release-manifest-v4.json")
        await fs.writeFile(path.join(directory, fileName), `${fileName}\n`);
    const identity = (fileName) =>
        ordinaryFileIdentity(path.join(directory, fileName)),
      payloads = await Promise.all(
        [
          "THIRD_PARTY_NOTICES.json",
          "voice-host-chinese-darwin-arm64-1.0.0.zip",
          "voice-host-english-darwin-arm64-1.0.0.zip",
          "voice-model-chinese-fun-asr-nano-gguf-q8-v1.json",
          "voice-model-english-whisper-small-mlx-fp16-v1.json",
        ].map(identity),
      );
    payloads.sort((left, right) =>
      Buffer.compare(Buffer.from(left.fileName), Buffer.from(right.fileName)),
    );
    await writeJson(path.join(directory, "pretag-release-manifest-v4.json"), {
      schemaVersion: 4,
      artifactKind: "pretag-release-manifest",
      runtimeVersion: "1.0.0",
      releaseTag: "v1.0.0",
      finalMainCommit: "1".repeat(40),
      releaseEvidence: await identity("release-qualification-evidence-v4.json"),
      catalog: await identity("voice-runtime-catalog-v4.json"),
      payloads,
    });
    const checksum = path.join(directory, "release-SHA256SUMS.txt");
    await writeChecksums(directory, checksum);
    const seal = await sealPrepublicationBundle({
      directory,
      output: path.join(directory, "audit-seal.json"),
    });
    assert.equal(seal.coveredAssets.length, 8);
    assert.equal(seal.expectedPublishedAssetNames.length, 9);
    await fs.appendFile(
      path.join(directory, "voice-runtime-catalog-v4.json"),
      "changed",
    );
    await assert.rejects(
      sealPrepublicationBundle({
        directory,
        output: path.join(directory, "second-seal.json"),
      }),
      /Checksum mismatch/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
