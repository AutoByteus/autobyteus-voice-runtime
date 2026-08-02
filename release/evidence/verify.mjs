#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  errorRate,
  aggregateErrorRate,
} from "../../benchmark/scoring/error-rate.mjs";
import {
  parsePairs,
  readJson,
  ROOT,
  sha256,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";
import {
  verifyBuildBinding,
  verifyCorpusBinding,
  verifyRuntimeConformance,
} from "./bindings.mjs";
import { assertIntegratedReleaseCommit } from "./main-reachability.mjs";
import { assertTrustedBaseline } from "../../benchmark/baseline/trusted-baseline.mjs";
import { verifyPerformanceEvidence } from "./performance.mjs";
const run = promisify(execFile);
const args = parsePairs(process.argv.slice(2), [
  "evidence",
  "catalog",
  "qualifications",
  "assets",
  "maintained-main-commit",
  "output",
]);
const evidence = await readJson(args.evidence),
  catalog = await readJson(args.catalog);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const [schemaPath, value] of [
  ["contracts/release/release-qualification-evidence-v1.schema.json", evidence],
  ["contracts/catalog/voice-runtime-catalog-v3.schema.json", catalog],
]) {
  const schema = await readJson(path.join(ROOT, schemaPath));
  if (!ajv.validate(schema, value))
    throw new Error(`${schemaPath}: ${ajv.errorsText()}`);
}
if (
  evidence.catalog.sha256 !== (await shaFile(args.catalog)) ||
  evidence.preTagQualification.catalogSha256 !== evidence.catalog.sha256 ||
  evidence.selectionStudy.sha256 !==
    (await shaFile(path.join(ROOT, "evidence/selection-study/SHA256SUMS.txt")))
)
  throw new Error("Top-level evidence binding mismatch.");
const history = await readJson(
  path.join(ROOT, "release/evidence/candidate-history-v1.json"),
);
if (history.candidates.length !== evidence.candidateHistory.length)
  throw new Error("Candidate history missing.");
for (const source of history.candidates) {
  const projected = { ...source };
  delete projected.resultPath;
  const actual = evidence.candidateHistory.find(
    (item) => item.candidateId === source.candidateId,
  );
  if (
    JSON.stringify(actual) !== JSON.stringify(projected) ||
    (await shaFile(
      path.join(ROOT, "evidence/selection-study", source.resultPath),
    )) !== source.resultDigest
  )
    throw new Error(`Candidate history mismatch: ${source.candidateId}`);
}
if (
  !history.candidates.some(
    (item) =>
      item.candidateId === "paraformer-control-rejected" &&
      item.outcome === "rejected",
  ) ||
  !history.candidates.some(
    (item) =>
      item.candidateId === "funasr-selected" && item.outcome === "selected",
  )
)
  throw new Error("Approved improvement lane is absent.");
const summaries = [];
for (const file of await find(
  path.resolve(args.qualifications),
  "qualification-summary.json",
))
  summaries.push({ file, value: await readJson(file) });
const required = (
  await readJson(
    path.join(ROOT, "contracts/catalog/required-profile-matrix-v1.json"),
  )
).required;
const expectedKeys = new Set(
  required.map(
    (item) => `${item.profileId}/${item.platform}/${item.architecture}`,
  ),
);
const actualKeys = new Set(
  evidence.profileQualifications
    .filter((item) => item.profileId !== "auto")
    .map((item) => `${item.profileId}/${item.platform}/${item.architecture}`),
);
if (
  expectedKeys.size !== actualKeys.size ||
  [...expectedKeys].some((key) => !actualKeys.has(key))
)
  throw new Error("Required profile matrix mismatch.");
const auto = evidence.profileQualifications.filter(
  (item) => item.profileId === "auto",
);
if (auto.length !== 0 && auto.length !== 4)
  throw new Error("Auto must be omitted or independently complete.");
const assetSet = [];
for (const qualification of evidence.profileQualifications) {
  const key = `${qualification.profileId}/${qualification.platform}/${qualification.architecture}`;
  const summary = summaries.find(
    (item) =>
      `${item.value.profileId}/${item.value.target.platform}/${item.value.target.architecture}` ===
      key,
  );
  if (
    !summary ||
    (await shaFile(summary.file)) !==
      qualification.qualificationSummarySha256 ||
    summary.value.sourceCommit !== evidence.sourceCommit ||
    summary.value.runnerCommit !== evidence.runnerCommit
  )
    throw new Error(`Qualification binding mismatch: ${key}`);
  const corpusRecord = evidence.corpora.find(
    (item) => item.id === summary.value.corpus.id,
  );
  if (JSON.stringify(corpusRecord) !== JSON.stringify(summary.value.corpus))
    throw new Error(`Corpus evidence mismatch: ${key}`);
  await verifyRaw(summary, qualification);
  enforceThresholds(qualification);
  const entry = catalog.entries.find(
    (item) => `${item.profileId}/${item.platform}/${item.architecture}` === key,
  );
  if (
    !entry ||
    entry.packageId !== qualification.packageId ||
    entry.archive.sha256 !== qualification.archiveSha256 ||
    entry.packageDescriptor.sha256 !== qualification.descriptorSha256 ||
    entry.fileManifest.sha256 !== qualification.fileManifestSha256 ||
    entry.qualificationEvidenceDigest !==
      qualification.qualificationSummarySha256
  )
    throw new Error(`Catalog qualification mismatch: ${key}`);
  const asset = path.join(path.resolve(args.assets), entry.archive.fileName);
  if ((await shaFile(asset)) !== entry.archive.sha256)
    throw new Error(`Asset mismatch: ${key}`);
  assetSet.push([entry.archive.fileName, entry.archive.sha256]);
}
assetSet.sort((a, b) => a[0].localeCompare(b[0]));
if (
  sha256(Buffer.from(`${JSON.stringify(assetSet)}\n`)) !==
  evidence.preTagQualification.assetSetSha256
)
  throw new Error("Asset-set identity mismatch.");
if (
  evidence.sourceCommit !== catalog.sourceCommit ||
  evidence.mainReachability.releaseCommit !== evidence.sourceCommit ||
  evidence.mainReachability.maintainedMainCommit !==
    args["maintained-main-commit"] ||
  evidence.preTagQualification.qualifiedCommit !== evidence.sourceCommit ||
  !evidence.mainReachability.reachable ||
  !evidence.preTagQualification.completedBeforeTag
)
  throw new Error("Release lineage mismatch.");
await assertIntegratedReleaseCommit({
  repository: ROOT,
  releaseCommit: evidence.sourceCommit,
  maintainedMainCommit: args["maintained-main-commit"],
});
let tagExists = true;
try {
  await run(
    "git",
    ["rev-parse", "--verify", `refs/tags/${catalog.releaseTag}`],
    { cwd: ROOT },
  );
} catch {
  tagExists = false;
}
if (tagExists)
  throw new Error("Release tag exists before pre-tag qualification.");
await writeJson(path.resolve(args.output), {
  schemaVersion: 1,
  decision: "qualified-pre-tag",
  sourceCommit: evidence.sourceCommit,
  runnerCommit: evidence.runnerCommit,
  catalogSha256: evidence.catalog.sha256,
  assetSetSha256: evidence.preTagQualification.assetSetSha256,
  evidenceSha256: await shaFile(args.evidence),
  verifiedAt: new Date().toISOString(),
});
async function verifyRaw(summary, qualification) {
  const directory = path.dirname(summary.file),
    rawPath = path.join(directory, "raw-results.json"),
    indexPath = path.join(directory, "result-index.json"),
    baselinePath = path.join(directory, "baseline-evidence.json"),
    corpusPath = path.join(directory, "corpus-manifest.json"),
    buildReportPath = path.join(directory, "build-report.json"),
    inputManifestPath = path.join(directory, "build-input-manifest.json");
  const reproducibilityPath = path.join(
    directory,
    "reproducibility-proof-v1.json",
  );
  const conformancePath = path.join(directory, "runtime-conformance-v1.json");
  const performancePath = path.join(directory, "performance-samples-v1.json");
  if (
    (await shaFile(rawPath)) !== qualification.quality.rawResultsSha256 ||
    (await shaFile(indexPath)) !== qualification.quality.resultIndexSha256 ||
    (await shaFile(baselinePath)) !==
      qualification.quality.baseline.evidenceSha256 ||
    (await shaFile(corpusPath)) !== summary.value.corpus.manifestSha256 ||
    (await shaFile(buildReportPath)) !== qualification.buildReportSha256 ||
    (await shaFile(inputManifestPath)) !==
      qualification.buildInputManifestSha256 ||
    (await shaFile(reproducibilityPath)) !==
      qualification.reproducibilityProofSha256 ||
    (await shaFile(conformancePath)) !==
      qualification.runtimeConformanceSha256 ||
    (await shaFile(performancePath)) !== qualification.performanceSamplesSha256
  )
    throw new Error("Raw/baseline evidence digest mismatch.");
  const raw = await readJson(rawPath),
    index = await readJson(indexPath),
    baseline = await readJson(baselinePath),
    corpus = await readJson(corpusPath),
    build = await readJson(buildReportPath),
    inputManifest = await readJson(inputManifestPath),
    reproducibility = await readJson(reproducibilityPath),
    conformance = await readJson(conformancePath),
    performance = await readJson(performancePath);
  const baselineTrust = await assertTrustedBaseline({
    baseline,
    baselinePath,
    corpusManifestSha256: summary.value.corpus.manifestSha256,
    profileId: qualification.profileId,
    target: `${qualification.platform}-${qualification.architecture}`,
    metric: qualification.quality.metric,
  });
  await verifyBuildBinding(
    build,
    inputManifest,
    qualification,
    summary.value.sourceCommit,
  );
  if (
    reproducibility.schemaVersion !== 1 ||
    reproducibility.passed !== true ||
    reproducibility.sourceCommit !== summary.value.sourceCommit ||
    reproducibility.packageId !== qualification.packageId ||
    reproducibility.buildInputManifestSha256 !==
      qualification.buildInputManifestSha256 ||
    reproducibility.archiveSha256 !== qualification.archiveSha256 ||
    reproducibility.firstBuildReportSha256 !==
      qualification.buildReportSha256 ||
    reproducibility.secondBuildReportSha256 !==
      reproducibility.firstBuildReportSha256
  )
    throw new Error("Reproducibility proof mismatch.");
  verifyRuntimeConformance(conformance);
  await verifyPerformanceEvidence(summary.value, qualification, performance);
  verifyCorpusBinding(corpus, raw, summary.value, qualification);
  if (
    raw.packageId !== qualification.packageId ||
    raw.results.length !== qualification.quality.sampleCount ||
    baseline.results.length !== qualification.quality.baseline.sampleCount ||
    baseline.baselineId !== qualification.quality.baseline.id ||
    baseline.profileId !== qualification.profileId ||
    baseline.metric !== qualification.quality.metric ||
    baseline.configurationDigest !==
      qualification.quality.baseline.configurationDigest ||
    baseline.providerId !== qualification.quality.baseline.providerId ||
    baseline.modelId !== qualification.quality.baseline.modelId ||
    baselineTrust.catalogSha256 !==
      qualification.quality.baseline.trustedCatalogSha256 ||
    baselineTrust.record.promotedResultSha256 !==
      qualification.quality.baseline.promotedResultSha256 ||
    baselineTrust.record.corpusManifestSha256 !==
      qualification.quality.baseline.corpusManifestSha256 ||
    Math.abs(baseline.value - qualification.quality.baseline.value) > 1e-12
  )
    throw new Error("Raw/baseline count mismatch.");
  const recomputed = raw.results.map((item) => ({
    ...item,
    ...errorRate(item.reference, item.normalizedText, {
      metric: qualification.quality.metric,
      profileId: qualification.profileId,
    }),
  }));
  const quality = aggregateErrorRate(recomputed),
    baselineQuality = aggregateErrorRate(baseline.results);
  for (let index = 0; index < recomputed.length; index++)
    if (
      baseline.results[index].clipId !== recomputed[index].clipId ||
      baseline.results[index].audioSha256 !== recomputed[index].audioSha256 ||
      !Number.isInteger(baseline.results[index].errors) ||
      !Number.isInteger(baseline.results[index].units)
    )
      throw new Error("Baseline corpus pairing mismatch.");
  if (
    Math.abs(quality.value - qualification.quality.value) > 1e-12 ||
    Math.abs(baselineQuality.value - qualification.quality.baseline.value) >
      1e-12
  )
    throw new Error("Quality value is not reproducible.");
  const expectedIndex = recomputed.map((item) => ({
    clipId: item.clipId,
    audioSha256: item.audioSha256,
    outcome: item.outcome,
    errors: item.errors,
    units: item.units,
  }));
  if (JSON.stringify(index.results) !== JSON.stringify(expectedIndex))
    throw new Error("Result index does not match raw evidence.");
  const paired = pairedBootstrap(recomputed, baseline.results);
  for (const key of ["difference", "lower95", "upper95"])
    if (
      Math.abs(paired[key] - qualification.quality.pairedUncertainty[key]) >
      1e-12
    )
      throw new Error("Paired uncertainty is not reproducible.");
  await verifyOperationalAudits(summary.value, qualification, directory);
}
async function verifyOperationalAudits(summary, qualification, directory) {
  const conditionsPath = path.join(
      directory,
      "qualification-conditions-v1.json",
    ),
    conditions = await readJson(conditionsPath);
  if (
    JSON.stringify(conditions) !== JSON.stringify(summary.conditions) ||
    conditions.sourceCommit !== summary.sourceCommit ||
    conditions.runnerCommit !== summary.runnerCommit ||
    conditions.runnerCommit !== conditions.sourceCommit ||
    !conditions.executionEnvironment?.powerCondition ||
    !conditions.executionEnvironment?.backgroundLoad ||
    !conditions.executionEnvironment?.filesystemCacheProcedure
  )
    throw new Error("Qualification conditions mismatch.");
  const licensePath = path.join(directory, conditions.licenseAudit.fileName),
    offlinePath = path.join(directory, conditions.offlineAudit.fileName);
  if (
    (await shaFile(licensePath)) !== conditions.licenseAudit.sha256 ||
    (await shaFile(offlinePath)) !== conditions.offlineAudit.sha256
  )
    throw new Error("Operational audit digest mismatch.");
  const license = await readJson(licensePath),
    offline = await readJson(offlinePath);
  if (
    license.decision !== "approved" ||
    license.inventorySha256 !== qualification.noticeInventorySha256 ||
    offline.decision !== "network-disabled"
  )
    throw new Error("License/offline audit is not applicable.");
  if (
    qualification.platform === "darwin" &&
    qualification.architecture === "arm64" &&
    !/Apple M1 Max/i.test(conditions.hardware.cpuModel)
  )
    throw new Error(
      "macOS arm64 acceptance did not run on the approved M1 Max reference machine.",
    );
}
function enforceThresholds(q) {
  for (const metric of [
    q.handshake,
    q.coldPreparation,
    q.warmPreparation,
    q.coldResult,
    q.warmRequest,
  ])
    if (metric.failures || metric.timeouts)
      throw new Error("Failures/timeouts cannot be excluded.");
  if (
    q.handshake.p95Ms > 1000 ||
    q.coldPreparation.p95Ms > 20000 ||
    q.warmPreparation.p95Ms > 10000 ||
    q.coldResult.p95Ms > 25000 ||
    q.warmRequest.p95Ms > 10000 ||
    q.maxRssBytes > 2684354560 ||
    q.extractedSizeBytes > 1342177280
  )
    throw new Error("Performance/resource gate failed.");
  if (
    q.platform === "darwin" &&
    q.architecture === "arm64" &&
    (q.handshake.count < 30 ||
      q.coldPreparation.count < 30 ||
      q.warmPreparation.count < 30 ||
      q.coldResult.count < 30 ||
      q.warmRequest.count < 100)
  )
    throw new Error("Mac acceptance trial counts incomplete.");
  const quality = q.quality;
  if (
    quality.failedCount ||
    quality.emptyCount ||
    quality.sampleCount !== quality.baseline.sampleCount
  )
    throw new Error("Quality sample set incomplete.");
  if (
    q.profileId === "english" &&
    (quality.metric !== "WER" ||
      quality.value > 0.08 ||
      quality.value - quality.baseline.value > 0.005000000001)
  )
    throw new Error("English non-regression gate failed.");
  if (
    q.profileId === "chinese" &&
    (quality.metric !== "CER" ||
      quality.value > 0.07 ||
      quality.value - quality.baseline.value > 0.005000000001)
  )
    throw new Error("Chinese selection preservation gate failed.");
}
function pairedBootstrap(current, baseline) {
  const differences = [];
  let state = 0x5eed1234;
  for (let repetition = 0; repetition < 10000; repetition++) {
    let ce = 0,
      cu = 0,
      be = 0,
      bu = 0;
    for (let draw = 0; draw < current.length; draw++) {
      state = (1664525 * state + 1013904223) >>> 0;
      const index = state % current.length;
      ce += current[index].errors;
      cu += current[index].units;
      be += baseline[index].errors;
      bu += baseline[index].units;
    }
    differences.push(ce / cu - be / bu);
  }
  differences.sort((a, b) => a - b);
  return {
    difference:
      aggregateErrorRate(current).value - aggregateErrorRate(baseline).value,
    lower95: differences[249],
    upper95: differences[9749],
  };
}
async function find(root, name) {
  const result = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await find(target, name)));
    else if (entry.name === name) result.push(target);
  }
  return result.sort();
}
