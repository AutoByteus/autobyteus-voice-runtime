#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TICKET = path.resolve(HERE, "../..");
const SOURCE_RAW = path.join(
  TICKET,
  "evidence/backend-selection/results/profile-v2-funasr-nano-q8-zh.json",
);
const SOURCE_QUALITY = path.join(
  TICKET,
  "evidence/backend-selection/results/quality-profile-v2-funasr-nano-q8-zh.json",
);
const CORPUS = path.join(HERE, "chinese-v2.corpus.json");
const CONTRACT = path.join(HERE, "chinese-cer-scoring-contract-v1.json");
const MAP = path.join(HERE, "opencc-t2s-scoring-map-v1.json");
const BASELINE = path.join(HERE, "chinese-v2.baseline.json");
const VALIDATION = path.join(HERE, "validation.json");

const EXPECTED = Object.freeze({
  raw: "84568c53e908e1538ab55b5aa046804e2e7444386225b791de11a148239f8b48",
  quality:
    "c7229574bad3ee199d43e1ee146c61e65514fa2c2ba514d7358ff40134f64089",
  corpus:
    "f10e79f85842b153b461cb3c54309c0fdfcece54d0ec2b1219805309d5b9d787",
});

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const sha256 = (file) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const canonical = (value) => `${JSON.stringify(value, null, 2)}\n`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function trie(dictionary) {
  const root = new Map();
  for (const [source, replacement] of Object.entries(dictionary)) {
    let node = root;
    for (const character of source) {
      if (!node.has(character)) node.set(character, new Map());
      node = node.get(character);
    }
    node.replacement = replacement;
  }
  return root;
}

function convert(value, root) {
  const input = [...value];
  const output = [];
  for (let offset = 0; offset < input.length; ) {
    let node = root;
    let best;
    for (let index = offset; index < input.length; index += 1) {
      node = node.get(input[index]);
      if (!node) break;
      if (Object.hasOwn(node, "replacement")) {
        best = { end: index + 1, value: node.replacement };
      }
    }
    if (best) {
      output.push(best.value);
      offset = best.end;
    } else {
      output.push(input[offset]);
      offset += 1;
    }
  }
  return output.join("");
}

function levenshtein(left, right) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

for (const [name, file] of [
  ["raw", SOURCE_RAW],
  ["quality", SOURCE_QUALITY],
  ["corpus", CORPUS],
]) {
  assert(sha256(file) === EXPECTED[name], `Unexpected ${name} source digest.`);
}

const mapping = readJson(MAP);
const contract = readJson(CONTRACT);
assert(mapping.schemaVersion === 1, "Unexpected scoring-map schema.");
assert(contract.schemaVersion === 1, "Unexpected scoring-contract schema.");
assert(contract.mapping.sha256 === sha256(MAP), "Contract/map digest mismatch.");

const normalization = trie(mapping.normalization);
const conversion = trie(mapping.conversion);
const normalize = (value) =>
  [...convert(convert(value.normalize("NFKC"), normalization), conversion)
    .toLowerCase()]
    .filter(
      (character) =>
        (character >= "\u4e00" && character <= "\u9fff") ||
        /^[a-z0-9]$/.test(character),
    )
    .join("");

const raw = readJson(SOURCE_RAW);
const promoted = readJson(SOURCE_QUALITY).reports[0];
const corpus = readJson(CORPUS);
const clipById = new Map(corpus.clips.map((clip) => [clip.id, clip]));
assert(raw.warmSession.quality.length === 200, "Expected 200 raw source rows.");
assert(promoted.perClip.length === 200, "Expected 200 promoted quality rows.");
assert(clipById.size === 200, "Expected 200 unique corpus rows.");

let exactHistoricalReproductions = 0;
let totalErrors = 0;
let totalUnits = 0;
const results = [];
for (let index = 0; index < raw.warmSession.quality.length; index += 1) {
  const source = raw.warmSession.quality[index];
  const historical = promoted.perClip[index];
  const clip = clipById.get(source.id);
  assert(clip, `Missing corpus identity ${source.id}.`);
  assert(historical.id === source.id, `Historical row mismatch at ${index}.`);
  const reference = normalize(source.reference);
  const hypothesis = normalize(source.response.text);
  assert(
    reference === historical.normalizedReference &&
      hypothesis === historical.normalizedHypothesis,
    `Frozen scorer does not reproduce historical row ${source.id}.`,
  );
  exactHistoricalReproductions += 1;
  const referenceUnits = [...reference];
  const errors = levenshtein(referenceUnits, [...hypothesis]);
  totalErrors += errors;
  totalUnits += referenceUnits.length;
  results.push({
    clipId: source.id,
    audioSha256: clip.audioSha256,
    errors,
    units: referenceUnits.length,
  });
}

assert(totalErrors === 343, "Corrected baseline error count drifted.");
assert(totalUnits === 6580, "Corrected baseline unit count drifted.");

const scriptSha256 = sha256(fileURLToPath(import.meta.url));
const contractSha256 = sha256(CONTRACT);
const baseline = {
  schemaVersion: 2,
  baselineId: "chinese-promoted-baseline-v2",
  profileId: "chinese",
  providerId: "autobyteus.voice.funasr-nano-q8",
  modelId: "fun-asr-nano-gguf-q8",
  configurationDigest:
    "7b2ed57eca281a71bfdeb134b31bbf5e8a17384dcb975daa3eb8627aa0afb688",
  metric: "CER",
  scoringContract: {
    id: contract.contractId,
    fileName: path.basename(CONTRACT),
    sha256: contractSha256,
  },
  corpus: {
    id: corpus.corpusId,
    manifestPath:
      "evidence/chinese-qualification-v2/chinese-v2.corpus.json",
    manifestSha256: EXPECTED.corpus,
    sampleCount: 200,
  },
  source: {
    rawResultPath:
      "evidence/backend-selection/results/profile-v2-funasr-nano-q8-zh.json",
    rawResultSha256: EXPECTED.raw,
    promotedQualityPath:
      "evidence/backend-selection/results/quality-profile-v2-funasr-nano-q8-zh.json",
    promotedQualitySha256: EXPECTED.quality,
    derivationPath:
      "evidence/chinese-qualification-v2/derive_chinese_qualification_v2.mjs",
    derivationSha256: scriptSha256,
  },
  errors: totalErrors,
  units: totalUnits,
  value: totalErrors / totalUnits,
  sampleCount: results.length,
  results,
};
fs.writeFileSync(BASELINE, canonical(baseline));

const validation = {
  schemaVersion: 1,
  status: "pass",
  scoringContractId: contract.contractId,
  scoringContractSha256: contractSha256,
  mappingSha256: sha256(MAP),
  sourceDigestsVerified: true,
  corpusIdentityCount: clipById.size,
  rawResultCount: raw.warmSession.quality.length,
  promotedQualityCount: promoted.perClip.length,
  exactHistoricalNormalizationReproductions: exactHistoricalReproductions,
  baseline: {
    errors: totalErrors,
    units: totalUnits,
    value: totalErrors / totalUnits,
    sha256: sha256(BASELINE),
  },
  invariants: {
    symmetricReferenceAndHypothesisScoring: true,
    productionNormalizedTextIsNotScoringInput: true,
    rawTranscriptBytesAreNotModified: true,
    historicalSourceBytesAreNotModified: true,
  },
};
fs.writeFileSync(VALIDATION, canonical(validation));
console.log(canonical(validation));
