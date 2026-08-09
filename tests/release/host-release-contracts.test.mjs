import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  CHECKSUM_COVERED_NAMES,
  PUBLISHED_ASSET_NAMES,
} from "../../release/release-contract.mjs";

const root = path.resolve(import.meta.dirname, "../..");

test("the release contract contains exactly two hosts, two locators, four metadata assets, and checksums", () => {
  assert.deepEqual(PUBLISHED_ASSET_NAMES, [
    "THIRD_PARTY_NOTICES.json",
    "pretag-release-manifest-v4.json",
    "release-SHA256SUMS.txt",
    "release-qualification-evidence-v4.json",
    "voice-host-chinese-darwin-arm64-1.0.0.zip",
    "voice-host-english-darwin-arm64-1.0.0.zip",
    "voice-model-chinese-fun-asr-nano-gguf-q8-v1.json",
    "voice-model-english-whisper-small-mlx-fp16-v1.json",
    "voice-runtime-catalog-v4.json",
  ]);
  assert.equal(CHECKSUM_COVERED_NAMES.length, 8);
  assert.ok(!CHECKSUM_COVERED_NAMES.includes("release-SHA256SUMS.txt"));
  assert.ok(
    PUBLISHED_ASSET_NAMES.every(
      (name) => !/\.(?:gguf|npz|safetensors)$/.test(name),
    ),
  );
});

test("one standard-hosted job builds hosts without model or product execution", async () => {
  const workflow = await fs.readFile(
    path.join(root, ".github/workflows/release-voice-runtime.yml"),
    "utf8",
  );
  assert.match(workflow, /jobs:\n  release:\n    runs-on: macos-26/);
  assert.doesNotMatch(workflow, /self-hosted|runner-group|larger runner/i);
  assert.match(workflow, /release\/run-host-construction\.mjs/);
  assert.match(
    workflow,
    /sandbox-exec -f benchmark\/sandbox\/darwin-arm64-network-denied-v1\.sb[\s\S]+release\/run-host-construction\.mjs/,
  );
  assert.match(workflow, /hosted-host-construction-result-v2\.json/);
  assert.match(workflow, /release\/verify-release-source-admission\.mjs/);
  assert.match(workflow, /release\/prepublication-seal\.mjs/);
  assert.match(workflow, /release\/verify-published-assets\.mjs/);
  assert.match(workflow, /release\/quarantine-published-release\.mjs/);
  assert.doesNotMatch(
    workflow,
    /recover-qualified|qualified-release-candidate|run-profile-qualification|qualify:profile|caffeinate|\/usr\/sbin\/purge/,
  );
  assert.doesNotMatch(workflow, /huggingface\.co|weights\.npz|\.gguf/);
  assert.match(workflow, /test "\$\{#FILES\[@\]\}" = 9/);
});

test("managed recovery and combined-package entrypoints are absent", async () => {
  for (const relative of [
    ".github/workflows/recover-qualified-voice-archives.yml",
    ".github/workflows/promote-qualified-voice-candidate.yml",
    "build/package-assembler.mjs",
    "build/package-verifier.mjs",
    "release/recover-qualified-voice-archives.mjs",
    "release/qualified-release-candidate.mjs",
    "contracts/package/provider-package-v1.schema.json",
    "contracts/startup/provider-session-config-v1.schema.json",
  ])
    await assert.rejects(fs.access(path.join(root, relative)), {
      code: "ENOENT",
    });
});
