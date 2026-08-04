#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { loadTrustedBaseline } from "../benchmark/baseline/trusted-baseline.mjs";
import {
  loadProfileResourcePolicy,
  resolveProfileResourcePolicy,
} from "../benchmark/profile-resource-policy.mjs";
import { readJson, ROOT, shaFile } from "../build/lib/files.mjs";

const trust = await loadTrustedBaseline("chinese", "darwin-arm64"),
  policy = await loadProfileResourcePolicy(),
  chinese = await resolveProfileResourcePolicy("chinese", "darwin-arm64"),
  evidence = path.join(ROOT, "evidence/chinese-qualification-v2"),
  checksums = (await fs.readFile(path.join(evidence, "SHA256SUMS.txt"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => line.split(/\s+/)),
  catalog = await readJson(
    path.join(ROOT, "release/evidence/trusted-baselines-v1.json"),
  ),
  reviewedRecord = await readJson(
    path.join(evidence, "chinese-v2.trusted-baseline-record.json"),
  );
for (const [expected, fileName] of checksums)
  if ((await shaFile(path.join(evidence, fileName))) !== expected)
    throw new Error(`Chinese v2 authority checksum mismatch: ${fileName}`);
for (const [reviewed, active] of [
  [
    path.join(evidence, "chinese-cer-scoring-contract-v1.json"),
    path.join(
      ROOT,
      "contracts/scoring/chinese-cer-selection-comparable-v1.json",
    ),
  ],
  [
    path.join(evidence, "opencc-t2s-scoring-map-v1.json"),
    path.join(ROOT, "contracts/scoring/opencc-t2s-scoring-map-v1.json"),
  ],
  [
    path.join(evidence, "chinese-v2.corpus.json"),
    path.join(ROOT, "release/evidence/qualification-corpora/chinese-v2.json"),
  ],
  [
    path.join(evidence, "chinese-v2.baseline.json"),
    path.join(ROOT, "release/evidence/baselines/chinese-v2.json"),
  ],
])
  if (
    !Buffer.from(await fs.readFile(reviewed)).equals(await fs.readFile(active))
  )
    throw new Error(
      `Active Chinese authority differs: ${path.basename(active)}`,
    );
const activeRecord = catalog.baselines.find(
  (record) => record.profileId === "chinese",
);
if (
  trust.record.errors !== 343 ||
  trust.record.units !== 6580 ||
  policy.value.rows.length !== 2 ||
  chinese.row.hardProcessTreeRssCeilingBytes !== 4294967296 ||
  chinese.row.assessmentOptimizationTargetBytes !== 2684354560 ||
  JSON.stringify(activeRecord) !== JSON.stringify(reviewedRecord)
)
  throw new Error("Chinese qualification authority did not reproduce.");
console.log("Chinese v2 scoring/trust and Profile Resource Policy verified.");
