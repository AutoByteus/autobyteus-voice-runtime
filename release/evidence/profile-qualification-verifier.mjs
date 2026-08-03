import path from "node:path";
import {
  aggregateErrorRate,
  errorRate,
} from "../../benchmark/scoring/error-rate.mjs";
import { assertTrustedBaseline } from "../../benchmark/baseline/trusted-baseline.mjs";
import { pairedBootstrap } from "../../benchmark/baseline/qualification-baseline.mjs";
import { readJson, shaFile } from "../../build/lib/files.mjs";
import {
  verifyBuildBinding,
  verifyCorpusBinding,
  verifyRuntimeConformance,
} from "./bindings.mjs";
import { verifyPerformanceEvidence } from "./performance.mjs";
import {
  assertPassingDarwinArm64Preflight,
  assertPreflightConditionBinding,
} from "../../benchmark/darwin-arm64-preflight-contract.mjs";

export async function verifyProfileQualificationEvidence(summary, directory) {
  const file = (name) => path.join(directory, name),
    paths = {
      build: file("build-report.json"),
      manifest: file("build-input-manifest.json"),
      provenance: file("input-provenance-v1.json"),
      reproducibility: file("reproducibility-proof-v1.json"),
      conformance: file("runtime-conformance-v1.json"),
      performance: file("performance-samples-v1.json"),
      raw: file("raw-results.json"),
      index: file("result-index.json"),
      baseline: file("baseline-evidence.json"),
      corpus: file("corpus-manifest.json"),
      compliance: file("package-compliance-v1.json"),
      preflight: file("darwin-arm64-preflight-v1.json"),
    },
    values = Object.fromEntries(
      await Promise.all(
        Object.entries(paths).map(async ([key, value]) => [
          key,
          await readJson(value),
        ]),
      ),
    ),
    qualification = qualificationView(summary);
  for (const [pathKey, expected] of [
    ["build", summary.buildReportSha256],
    ["manifest", summary.buildInputManifestSha256],
    ["provenance", summary.buildInputProvenanceSha256],
    ["reproducibility", summary.reproducibilityProofSha256],
    ["conformance", summary.runtimeConformanceSha256],
    ["performance", summary.performanceSamplesSha256],
    ["raw", summary.quality.rawResultsSha256],
    ["index", summary.quality.resultIndexSha256],
    ["baseline", summary.quality.baseline.evidenceSha256],
    ["corpus", summary.corpus.manifestSha256],
    ["compliance", summary.generatedComplianceSha256],
    ["preflight", summary.preflightSha256],
  ])
    if ((await shaFile(paths[pathKey])) !== expected)
      throw new Error(`Profile qualification digest mismatch: ${pathKey}`);
  await verifyBuildBinding(
    values.build,
    values.manifest,
    qualification,
    summary.sourceCommit,
  );
  if (
    values.provenance.repository.sourceCommit !== summary.sourceCommit ||
    values.provenance.recipe.sha256 !== summary.buildInputRecipeSha256 ||
    values.reproducibility.passed !== true ||
    values.reproducibility.archiveSha256 !== summary.archive.sha256 ||
    values.reproducibility.buildInputProvenanceSha256 !==
      summary.buildInputProvenanceSha256 ||
    values.compliance.decision !== "pass" ||
    values.preflight.status !== "pass"
  )
    throw new Error("Profile provenance/compliance/preflight mismatch.");
  await assertPassingDarwinArm64Preflight(values.preflight);
  assertPreflightConditionBinding(summary.conditions, values.preflight);
  verifyRuntimeConformance(values.conformance);
  await verifyPerformanceEvidence(summary, qualification, values.performance);
  verifyCorpusBinding(values.corpus, values.raw, summary, qualification);
  const trust = await assertTrustedBaseline({
    baseline: values.baseline,
    baselinePath: paths.baseline,
    corpusManifestSha256: summary.corpus.manifestSha256,
    profileId: summary.profileId,
    target: "darwin-arm64",
    metric: summary.quality.metric,
  });
  if (
    trust.catalogSha256 !== summary.quality.baseline.trustedCatalogSha256 ||
    values.raw.results.length !== summary.quality.sampleCount ||
    values.baseline.results.length !== summary.quality.baseline.sampleCount ||
    values.raw.results.length !== (summary.profileId === "english" ? 49 : 200)
  )
    throw new Error("Profile corpus/baseline cardinality mismatch.");
  const recomputed = values.raw.results.map((item) => ({
    ...item,
    ...errorRate(item.reference, item.normalizedText, {
      metric: summary.quality.metric,
      profileId: summary.profileId,
    }),
  }));
  const quality = aggregateErrorRate(recomputed),
    baselineQuality = aggregateErrorRate(values.baseline.results),
    uncertainty = pairedBootstrap(recomputed, values.baseline.results),
    expectedIndex = recomputed.map((item) => ({
      clipId: item.clipId,
      audioSha256: item.audioSha256,
      outcome: item.outcome,
      errors: item.errors,
      units: item.units,
    }));
  if (
    Math.abs(quality.value - summary.quality.value) > 1e-12 ||
    Math.abs(baselineQuality.value - summary.quality.baseline.value) > 1e-12 ||
    JSON.stringify(expectedIndex) !== JSON.stringify(values.index.results) ||
    ["difference", "lower95", "upper95"].some(
      (key) =>
        Math.abs(uncertainty[key] - summary.quality.pairedUncertainty[key]) >
        1e-12,
    )
  )
    throw new Error("Profile quality evidence is not reproducible.");
  return values;
}

function qualificationView(q) {
  return {
    ...q,
    platform: q.target.platform,
    architecture: q.target.architecture,
    archiveSha256: q.archive.sha256,
  };
}
