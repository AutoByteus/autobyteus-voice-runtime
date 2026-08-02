import path from "node:path";
import { readJson, ROOT, sha256, shaFile } from "../../build/lib/files.mjs";

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
  const qualityById = new Map(report.perClip.map((item) => [item.id, item]));
  const rawIds = new Set(rawResults.map((item) => item.id));
  for (let index = 0; index < corpus.clips.length; index++) {
    const clip = corpus.clips[index];
    const promoted = qualityById.get(clip.id);
    const result = baseline.results[index];
    if (!promoted || !rawIds.has(clip.id))
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
