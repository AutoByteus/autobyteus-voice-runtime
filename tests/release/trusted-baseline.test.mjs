import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  assertTrustedBaseline,
  loadTrustedBaseline,
  validateBaselineIdentity,
} from "../../benchmark/baseline/trusted-baseline.mjs";

test("repository-owned baseline rejects wrong digest and semantic identities", async () => {
  const { record } = await loadTrustedBaseline("english", "darwin-arm64");
  const source = path.resolve(record.evidencePath);
  const baseline = JSON.parse(await fs.readFile(source, "utf8"));
  validateBaselineIdentity(
    baseline,
    record,
    record.corpusManifestSha256,
    "WER",
  );
  for (const [field, value] of [
    ["providerId", "wrong-provider"],
    ["modelId", "wrong-model"],
    ["configurationDigest", "0".repeat(64)],
  ]) {
    const changed = structuredClone(baseline);
    changed[field] = value;
    assert.throws(
      () =>
        validateBaselineIdentity(
          changed,
          record,
          record.corpusManifestSha256,
          "WER",
        ),
      /not the promoted baseline/,
    );
  }
  const shortened = structuredClone(baseline);
  shortened.results.pop();
  assert.throws(
    () =>
      validateBaselineIdentity(
        shortened,
        record,
        record.corpusManifestSha256,
        "WER",
      ),
    /not the promoted baseline/,
  );
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "voice-baseline-"));
  try {
    const tampered = path.join(directory, "baseline.json");
    await fs.writeFile(tampered, `${JSON.stringify(baseline)}\n`);
    await assert.rejects(
      assertTrustedBaseline({
        baseline,
        baselinePath: tampered,
        corpusManifestSha256: record.corpusManifestSha256,
        profileId: "english",
        target: "darwin-arm64",
        metric: "WER",
      }),
      /digest is not trusted/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
