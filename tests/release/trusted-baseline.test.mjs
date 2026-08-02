import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  assertOneToOneCorpusBaseline,
  assertTrustedBaseline,
  loadTrustedBaseline,
  validateBaselineIdentity,
} from "../../benchmark/baseline/trusted-baseline.mjs";
import {
  assertReproducedEnglishOutputs,
  verifyEnglishPreservationAuthority,
} from "../../benchmark/baseline/english-preservation-authority.mjs";

const root = path.resolve(import.meta.dirname, "../..");

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

test("English v2 authority replaces invalid final v1 files without changing the trust boundary", async () => {
  const { record } = await loadTrustedBaseline("english", "darwin-arm64");
  assert.equal(record.baselineId, "english-promoted-baseline-unique-v2");
  assert.equal(
    record.evidenceSha256,
    "c52613457644700e18d0caf4e1d1a32a7a00c679968866b06be4305ce8b58dba",
  );
  assert.equal(
    record.corpusManifestSha256,
    "03fe5e7ba88b4f84e0d18ec9444663a481168bb521c415bcc226e747e98deffd",
  );
  assert.equal(record.sampleCount, 49);
  for (const relative of [
    "release/evidence/qualification-corpora/english-v1.json",
    "release/evidence/baselines/english-v1.json",
  ])
    await assert.rejects(fs.access(path.join(root, relative)), {
      code: "ENOENT",
    });
});

test("checked-in corpus and baseline require 49 unique one-to-one identities", async () => {
  const corpus = JSON.parse(
    await fs.readFile(
      path.join(root, "release/evidence/qualification-corpora/english-v2.json"),
      "utf8",
    ),
  );
  const baseline = JSON.parse(
    await fs.readFile(
      path.join(root, "release/evidence/baselines/english-v2.json"),
      "utf8",
    ),
  );
  assert.doesNotThrow(() => assertOneToOneCorpusBaseline(corpus, baseline, 49));
  const duplicateCorpus = structuredClone(corpus);
  duplicateCorpus.clips.at(-1).id = duplicateCorpus.clips[0].id;
  assert.throws(
    () => assertOneToOneCorpusBaseline(duplicateCorpus, baseline, 49),
    /not unique one-to-one/,
  );
  const duplicateBaseline = structuredClone(baseline);
  duplicateBaseline.results.at(-1).audioSha256 =
    duplicateBaseline.results[0].audioSha256;
  assert.throws(
    () => assertOneToOneCorpusBaseline(corpus, duplicateBaseline, 49),
    /not unique one-to-one/,
  );
});

test("English v2 authority rejects changed immutable source bytes", async () => {
  const { record } = await loadTrustedBaseline("english", "darwin-arm64");
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-english-authority-"),
  );
  try {
    const authority =
      "evidence/selection-study/derived/english-preservation-unique-v2/authority.json";
    const source =
      "evidence/selection-study/corpus-manifests/fleurs-controlled-v1.json";
    await fs.mkdir(path.dirname(path.join(directory, authority)), {
      recursive: true,
    });
    await fs.copyFile(
      path.join(root, authority),
      path.join(directory, authority),
    );
    await fs.mkdir(path.dirname(path.join(directory, source)), {
      recursive: true,
    });
    await fs.writeFile(path.join(directory, source), "{}\n");
    await assert.rejects(
      verifyEnglishPreservationAuthority(record, { root: directory }),
      /source mismatch/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("English v2 reproduction rejects changed generated authority when five other outputs match", async () => {
  const { record } = await loadTrustedBaseline("english", "darwin-arm64");
  const authorityPath = path.join(
    root,
    "evidence/selection-study/derived/english-preservation-unique-v2/authority.json",
  );
  const authority = JSON.parse(await fs.readFile(authorityPath, "utf8"));
  const output = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-english-reproduction-"),
  );
  try {
    for (const [name, projected] of Object.entries(authority.outputs)) {
      const bytes =
        name === "trustedBaselineRecord"
          ? `${JSON.stringify(record, null, 2)}\n`
          : await fs.readFile(path.join(root, projected.runtimePath));
      await fs.writeFile(path.join(output, projected.solutionFile), bytes);
    }
    const changedAuthority = structuredClone(authority);
    changedAuthority.status = "different-generated-authority";
    await fs.writeFile(
      path.join(output, "authority.json"),
      `${JSON.stringify(changedAuthority, null, 2)}\n`,
    );
    await assert.rejects(
      assertReproducedEnglishOutputs({ root, output, authority, record }),
      /derivation drift: authority/,
    );
  } finally {
    await fs.rm(output, { recursive: true, force: true });
  }
});
