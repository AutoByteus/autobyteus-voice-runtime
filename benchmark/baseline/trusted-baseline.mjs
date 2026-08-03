import path from "node:path";
import { readJson, ROOT, sha256, shaFile } from "../../build/lib/files.mjs";
import { verifyEnglishPreservationAuthority } from "./english-preservation-authority.mjs";
import {
  CHINESE_SCORING_AUTHORITY,
  normalizeChineseQualificationText,
  scoreChineseQualification,
} from "../scoring/chinese-qualification.mjs";
import { aggregateErrorRate } from "../scoring/error-rate.mjs";

const TRUST_PATH = path.join(
  ROOT,
  "release/evidence/trusted-baselines-v1.json",
);

export async function loadTrustedBaseline(profileId, target) {
  const catalog = await readJson(TRUST_PATH);
  if (
    catalog.schemaVersion !== 1 ||
    Object.keys(catalog).sort().join(",") !== "baselines,schemaVersion" ||
    !Array.isArray(catalog.baselines)
  )
    throw new Error("Trusted baseline catalog is invalid.");
  const record = catalog.baselines.find(
    (item) => item.profileId === profileId && item.targets?.includes(target),
  );
  if (!record) throw new Error("No trusted baseline is approved for target.");
  if (profileId === "chinese") return loadChineseTrust(record);
  await verifyEnglishPreservationAuthority(record);
  await verifyRepositoryIdentity(record.evidencePath, record.evidenceSha256);
  await verifyRepositoryIdentity(
    record.promotedResultPath,
    record.promotedResultSha256,
  );
  await verifyRepositoryIdentity(
    record.promotedQualityPath,
    record.promotedQualitySha256,
  );
  await verifyRepositoryIdentity(
    record.corpusManifestPath,
    record.corpusManifestSha256,
  );
  if (
    sha256(Buffer.from(`${JSON.stringify(record.configuration)}\n`)) !==
      record.configurationDigest ||
    record.configuration.providerId !== record.providerId ||
    record.configuration.modelId !== record.modelId ||
    record.configuration.promotedResultSha256 !== record.promotedResultSha256
  )
    throw new Error("Trusted baseline configuration binding is invalid.");
  await verifyPromotedDerivation(record);
  return { record, catalogSha256: await shaFile(TRUST_PATH) };
}

export async function assertTrustedBaseline({
  baseline,
  baselinePath,
  corpusManifestSha256,
  profileId,
  target,
  metric,
}) {
  const trust = await loadTrustedBaseline(profileId, target);
  if ((await shaFile(baselinePath)) !== trust.record.evidenceSha256)
    throw new Error("Baseline evidence digest is not trusted.");
  validateBaselineIdentity(
    baseline,
    trust.record,
    corpusManifestSha256,
    metric,
  );
  return trust;
}

export function validateBaselineIdentity(
  baseline,
  record,
  corpusManifestSha256,
  metric,
) {
  if (record.profileId === "chinese") {
    validateChineseBaselineIdentity(
      baseline,
      record,
      corpusManifestSha256,
      metric,
    );
    return;
  }
  if (
    baseline.schemaVersion !== 1 ||
    baseline.baselineId !== record.baselineId ||
    baseline.profileId !== record.profileId ||
    baseline.metric !== metric ||
    record.metric !== metric ||
    baseline.corpusManifestSha256 !== corpusManifestSha256 ||
    record.corpusManifestSha256 !== corpusManifestSha256 ||
    baseline.configurationDigest !== record.configurationDigest ||
    baseline.providerId !== record.providerId ||
    baseline.modelId !== record.modelId ||
    baseline.value !== record.value ||
    !Array.isArray(baseline.results) ||
    baseline.results.length !== record.sampleCount
  )
    throw new Error("Baseline identity is not the promoted baseline.");
  assertOneToOneCorpusBaseline(
    {
      clips: baseline.results.map((item) => ({
        id: item.clipId,
        audioSha256: item.audioSha256,
        audioPath: item.clipId,
      })),
    },
    baseline,
    record.sampleCount,
    { comparePaths: false },
  );
  for (const result of baseline.results)
    if (
      !result ||
      Object.keys(result).sort().join(",") !==
        "audioSha256,clipId,errors,units" ||
      typeof result.clipId !== "string" ||
      !/^[a-f0-9]{64}$/.test(result.audioSha256) ||
      !Number.isInteger(result.errors) ||
      result.errors < 0 ||
      !Number.isInteger(result.units) ||
      result.units < 1
    )
      throw new Error("Promoted baseline per-clip counts are invalid.");
}

async function loadChineseTrust(record) {
  const expectedKeys = [
    "baseline",
    "baselineId",
    "configurationDigest",
    "corpus",
    "errors",
    "metric",
    "modelId",
    "profileId",
    "providerId",
    "replacement",
    "sampleCount",
    "schemaVersion",
    "scoringContract",
    "source",
    "targets",
    "units",
    "value",
  ];
  if (
    record.schemaVersion !== 2 ||
    Object.keys(record).sort().join(",") !== expectedKeys.sort().join(",") ||
    record.baselineId !== "chinese-promoted-baseline-v2" ||
    record.metric !== "CER" ||
    record.errors !== 343 ||
    record.units !== 6580 ||
    record.sampleCount !== 200 ||
    JSON.stringify(record.scoringContract) !==
      JSON.stringify({
        id: CHINESE_SCORING_AUTHORITY.id,
        fileName: "chinese-cer-scoring-contract-v1.json",
        sha256: CHINESE_SCORING_AUTHORITY.sha256,
        mappingFileName: CHINESE_SCORING_AUTHORITY.mappingFileName,
        mappingSha256: CHINESE_SCORING_AUTHORITY.mappingSha256,
      }) ||
    record.replacement?.supersedes !== "chinese-promoted-baseline-v1" ||
    record.replacement?.historicalBytesPreserved !== true ||
    record.replacement?.countsAndValueChanged !== false
  )
    throw new Error("Chinese v2 trusted baseline record is invalid.");
  const active = {
    ...record,
    evidencePath: "release/evidence/baselines/chinese-v2.json",
    evidenceSha256: record.baseline.sha256,
    corpusManifestPath:
      "release/evidence/qualification-corpora/chinese-v2.json",
    corpusManifestSha256: record.corpus.sha256,
    promotedResultPath:
      "evidence/backend-selection/results/profile-v2-funasr-nano-q8-zh.json",
    promotedResultSha256: record.source.promotedResultSha256,
    promotedQualityPath:
      "evidence/backend-selection/results/quality-profile-v2-funasr-nano-q8-zh.json",
    promotedQualitySha256: record.source.promotedQualitySha256,
  };
  for (const [relative, expected] of [
    [active.evidencePath, active.evidenceSha256],
    [active.corpusManifestPath, active.corpusManifestSha256],
    [active.promotedResultPath, active.promotedResultSha256],
    [active.promotedQualityPath, active.promotedQualitySha256],
    [
      "evidence/chinese-qualification-v2/derive_chinese_qualification_v2.mjs",
      record.source.derivationSha256,
    ],
    [
      "contracts/scoring/chinese-cer-selection-comparable-v1.json",
      record.scoringContract.sha256,
    ],
    [
      "contracts/scoring/opencc-t2s-scoring-map-v1.json",
      record.scoringContract.mappingSha256,
    ],
    [
      "evidence/selection-study/corpus-manifests/fleurs-simplified-mandarin-profile-v2.json",
      record.source.selectionCorpusManifestSha256,
    ],
  ])
    await verifyRepositoryIdentity(relative, expected);
  await verifyChinesePromotedDerivation(active);
  return {
    record: active,
    trustedRecord: record,
    catalogSha256: await shaFile(TRUST_PATH),
  };
}

function validateChineseBaselineIdentity(
  baseline,
  record,
  corpusManifestSha256,
  metric,
) {
  const aggregate = aggregateErrorRate(baseline.results ?? []);
  if (
    baseline.schemaVersion !== 2 ||
    baseline.baselineId !== record.baselineId ||
    baseline.profileId !== "chinese" ||
    baseline.metric !== metric ||
    metric !== "CER" ||
    baseline.providerId !== record.providerId ||
    baseline.modelId !== record.modelId ||
    baseline.configurationDigest !== record.configurationDigest ||
    baseline.corpus?.manifestSha256 !== corpusManifestSha256 ||
    record.corpusManifestSha256 !== corpusManifestSha256 ||
    baseline.corpus?.sampleCount !== record.sampleCount ||
    baseline.scoringContract?.id !== record.scoringContract.id ||
    baseline.scoringContract?.sha256 !== record.scoringContract.sha256 ||
    baseline.errors !== record.errors ||
    baseline.units !== record.units ||
    baseline.value !== record.value ||
    aggregate.errors !== baseline.errors ||
    aggregate.units !== baseline.units ||
    Math.abs(aggregate.value - baseline.value) > 1e-12 ||
    !Array.isArray(baseline.results) ||
    baseline.results.length !== record.sampleCount
  )
    throw new Error("Chinese baseline identity is not scoring-bound v2.");
  assertOneToOneCorpusBaseline(
    {
      clips: baseline.results.map((item) => ({
        id: item.clipId,
        audioSha256: item.audioSha256,
        audioPath: item.clipId,
      })),
    },
    baseline,
    record.sampleCount,
    { comparePaths: false },
  );
  for (const result of baseline.results)
    if (
      Object.keys(result).sort().join(",") !==
        "audioSha256,clipId,errors,units" ||
      !Number.isInteger(result.errors) ||
      result.errors < 0 ||
      !Number.isInteger(result.units) ||
      result.units < 1
    )
      throw new Error("Chinese v2 per-clip counts are invalid.");
}

async function verifyChinesePromotedDerivation(record) {
  const [baseline, corpus, raw, quality] = await Promise.all([
      readJson(path.join(ROOT, record.evidencePath)),
      readJson(path.join(ROOT, record.corpusManifestPath)),
      readJson(path.join(ROOT, record.promotedResultPath)),
      readJson(path.join(ROOT, record.promotedQualityPath)),
    ]),
    rawResults = raw.warmSession?.quality,
    promoted = quality.reports?.find((item) => item.language === "zh")?.perClip;
  if (
    !Array.isArray(rawResults) ||
    !Array.isArray(promoted) ||
    rawResults.length !== 200 ||
    promoted.length !== 200 ||
    corpus.clips?.length !== 200
  )
    throw new Error("Chinese v2 promoted evidence is incomplete.");
  assertOneToOneCorpusBaseline(corpus, baseline, 200);
  const clipById = new Map(corpus.clips.map((clip) => [clip.id, clip])),
    recomputed = [];
  for (let index = 0; index < rawResults.length; index++) {
    const source = rawResults[index],
      historical = promoted[index],
      clip = clipById.get(source.id),
      result = baseline.results[index],
      rawHypothesis = source.response?.text,
      scored = scoreChineseQualification({
        rawReference: source.reference,
        rawHypothesis,
      });
    if (
      !clip ||
      historical?.id !== source.id ||
      normalizeChineseQualificationText(source.reference) !==
        historical.normalizedReference ||
      normalizeChineseQualificationText(rawHypothesis) !==
        historical.normalizedHypothesis ||
      result.clipId !== source.id ||
      result.audioSha256 !== clip.audioSha256 ||
      result.errors !== scored.errors ||
      result.units !== scored.units
    )
      throw new Error("Chinese v2 baseline does not recompute from raw text.");
    recomputed.push(scored);
  }
  const aggregate = aggregateErrorRate(recomputed);
  if (
    aggregate.errors !== record.errors ||
    aggregate.units !== record.units ||
    Math.abs(aggregate.value - record.value) > 1e-12
  )
    throw new Error("Chinese v2 aggregate count authority drifted.");
}

async function verifyRepositoryIdentity(relative, expected) {
  if (
    !/^[A-Za-z0-9._/-]+$/.test(relative) ||
    relative.startsWith("/") ||
    relative.split("/").includes("..") ||
    !/^[a-f0-9]{64}$/.test(expected) ||
    (await shaFile(path.join(ROOT, relative))) !== expected
  )
    throw new Error(`Repository-owned baseline input mismatch: ${relative}`);
}

async function verifyPromotedDerivation(record) {
  const baseline = await readJson(path.join(ROOT, record.evidencePath));
  const corpus = await readJson(path.join(ROOT, record.corpusManifestPath));
  const raw = await readJson(path.join(ROOT, record.promotedResultPath));
  const quality = await readJson(path.join(ROOT, record.promotedQualityPath));
  const language = record.profileId === "english" ? "en" : "zh";
  const report = quality.reports?.find((item) => item.language === language);
  const rawResults = raw.warmSession?.quality;
  if (
    !report ||
    !Array.isArray(report.perClip) ||
    !Array.isArray(rawResults) ||
    report.perClip.length !== record.sampleCount ||
    rawResults.length !== record.sampleCount ||
    corpus.clips.length !== record.sampleCount ||
    Math.abs(report.corpusErrorRate - record.value) > 0.000001
  )
    throw new Error("Promoted baseline evidence is incomplete.");
  assertOneToOneCorpusBaseline(corpus, baseline, record.sampleCount);
  for (let index = 0; index < corpus.clips.length; index++) {
    const clip = corpus.clips[index];
    const promoted = report.perClip[index];
    const raw = rawResults[index];
    const result = baseline.results[index];
    if (promoted?.id !== clip.id || raw?.id !== clip.id)
      throw new Error("Promoted baseline clip identity is missing.");
    const units =
      record.metric === "WER"
        ? promoted.normalizedReference.split(/\s+/).filter(Boolean).length
        : [...promoted.normalizedReference].length;
    const errors = Math.round(promoted.errorRate * units);
    if (
      result.clipId !== clip.id ||
      result.audioSha256 !== clip.audioSha256 ||
      result.units !== units ||
      result.errors !== errors
    )
      throw new Error("Baseline counts do not derive from promoted evidence.");
  }
}

export function assertOneToOneCorpusBaseline(
  corpus,
  baseline,
  expectedCount,
  { comparePaths = true } = {},
) {
  if (
    !Array.isArray(corpus?.clips) ||
    !Array.isArray(baseline?.results) ||
    corpus.clips.length !== expectedCount ||
    baseline.results.length !== expectedCount
  )
    throw new Error("Corpus/baseline cardinality is not one-to-one.");
  const ids = new Set(),
    paths = new Set(),
    hashes = new Set(),
    baselineIds = new Set(),
    baselineHashes = new Set();
  for (let index = 0; index < expectedCount; index++) {
    const clip = corpus.clips[index],
      result = baseline.results[index];
    if (
      !clip ||
      !result ||
      ids.has(clip.id) ||
      (comparePaths && paths.has(clip.audioPath)) ||
      hashes.has(clip.audioSha256) ||
      baselineIds.has(result.clipId) ||
      baselineHashes.has(result.audioSha256) ||
      clip.id !== result.clipId ||
      clip.audioSha256 !== result.audioSha256
    )
      throw new Error("Corpus/baseline identities are not unique one-to-one.");
    ids.add(clip.id);
    paths.add(clip.audioPath);
    hashes.add(clip.audioSha256);
    baselineIds.add(result.clipId);
    baselineHashes.add(result.audioSha256);
  }
}
