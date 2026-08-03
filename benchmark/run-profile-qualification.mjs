#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ProviderProcessSession } from "./provider-process-session.mjs";
import { measureWithRss } from "./rss-sampler.mjs";
import { proveRuntimeConformance } from "./runtime-conformance.mjs";
import { validateCorpus } from "./corpus/validate-corpus.mjs";
import { aggregateErrorRate, errorRate } from "./scoring/error-rate.mjs";
import { normalizeTranscript } from "./scoring/normalization.mjs";
import {
  pairedBootstrap,
  validateQualificationBaseline,
} from "./baseline/qualification-baseline.mjs";
import { executeCacheProcedure } from "./cache-procedure.mjs";
import {
  qualificationCommandPrefix,
  validateQualificationConditions,
} from "./qualification-environment.mjs";
import {
  assertGoToolchainProvenance,
  trustedGoEnvironment,
  verifyGoToolchain,
} from "../build/locked-inputs.mjs";
import {
  parsePairs,
  readJson,
  removeWritableTree,
  regularFiles,
  ROOT,
  sha256,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
const run = promisify(execFile);
const args = parsePairs(process.argv.slice(2), [
  "archive",
  "build-report",
  "corpus",
  "baseline",
  "conditions",
  "compliance",
  "go",
  "reproducibility-proof",
  "output",
]);
const build = await readJson(args["build-report"]),
  conditions = await readJson(args.conditions);
const goToolchain = await verifyGoToolchain(path.resolve(args.go));
assertGoToolchainProvenance(goToolchain, build);
const corpus = await validateCorpus(args.corpus),
  baseline = await readJson(args.baseline);
if (
  build.profileId !== corpus.manifest.profileId ||
  build.sourceCommit !== conditions.sourceCommit ||
  conditions.profileId !== build.profileId ||
  conditions.target !== `${build.target.platform}-${build.target.architecture}`
)
  throw new Error("Corpus/profile/source mismatch.");
await validateQualificationConditions(conditions, args.conditions, build);
const normalizationFixtures = await proveNormalization();
const baselineTrust = await validateQualificationBaseline(
  baseline,
  args.baseline,
  corpus,
  build,
);
const coldCount = 30,
  warmCount = 100;
const actual = {
  platform: process.platform,
  architecture: process.arch === "x64" ? "x64" : process.arch,
};
if (
  actual.platform !== build.target.platform ||
  actual.architecture !== build.target.architecture
)
  throw new Error("Qualification must execute the advertised target.");
const output = path.resolve(args.output);
await fs.mkdir(output, { recursive: true });
const work = await fs.mkdtemp(
  path.join(os.tmpdir(), "voice-profile-qualification-"),
);
try {
  const buildReportPath = path.resolve(args["build-report"]);
  const reproducibilityProof = await readJson(args["reproducibility-proof"]);
  const inputManifestPath = path.join(
    path.dirname(buildReportPath),
    path.basename(build.buildInputManifestFileName),
  );
  const inputProvenancePath = path.join(
    path.dirname(buildReportPath),
    path.basename(build.buildInputProvenanceFileName),
  );
  const compliancePath = path.resolve(args.compliance),
    compliance = await readJson(compliancePath);
  if (
    build.buildInputManifestFileName !==
      path.basename(build.buildInputManifestFileName) ||
    (await shaFile(inputManifestPath)) !== build.buildInputManifestSha256 ||
    build.buildInputProvenanceFileName !==
      path.basename(build.buildInputProvenanceFileName) ||
    (await shaFile(inputProvenancePath)) !== build.buildInputProvenanceSha256 ||
    compliance.decision !== "pass" ||
    compliance.packageId !== build.packageId ||
    compliance.archiveSha256 !== build.archive.sha256 ||
    compliance.provenanceSha256 !== build.buildInputProvenanceSha256
  )
    throw new Error("Preserved build-input manifest mismatch.");
  if (
    reproducibilityProof.schemaVersion !== 1 ||
    reproducibilityProof.passed !== true ||
    reproducibilityProof.sourceCommit !== build.sourceCommit ||
    reproducibilityProof.packageId !== build.packageId ||
    reproducibilityProof.buildInputManifestSha256 !==
      build.buildInputManifestSha256 ||
    reproducibilityProof.archiveSha256 !== build.archive.sha256 ||
    reproducibilityProof.firstBuildReportSha256 !==
      (await shaFile(buildReportPath)) ||
    reproducibilityProof.secondBuildReportSha256 !==
      reproducibilityProof.firstBuildReportSha256
  )
    throw new Error("Reproducibility proof does not bind this build.");
  await fs.copyFile(buildReportPath, path.join(output, "build-report.json"));
  await fs.copyFile(
    inputManifestPath,
    path.join(output, "build-input-manifest.json"),
  );
  await fs.copyFile(
    inputProvenancePath,
    path.join(output, "input-provenance-v1.json"),
  );
  await fs.copyFile(
    compliancePath,
    path.join(output, "package-compliance-v1.json"),
  );
  await fs.copyFile(
    args["reproducibility-proof"],
    path.join(output, "reproducibility-proof-v1.json"),
  );
  await fs.copyFile(args.baseline, path.join(output, "baseline-evidence.json"));
  await fs.copyFile(args.corpus, path.join(output, "corpus-manifest.json"));
  await fs.copyFile(
    args.conditions,
    path.join(output, "qualification-conditions-v1.json"),
  );
  await fs.copyFile(
    path.join(
      path.dirname(path.resolve(args.conditions)),
      conditions.preflight.fileName,
    ),
    path.join(output, "darwin-arm64-preflight-v1.json"),
  );
  const packageRoot = await extractPackage(
    work,
    build,
    path.resolve(args.archive),
    goToolchain,
  );
  const before = await snapshot(packageRoot);
  const expectedBase = {
    packageId: build.packageId,
    providerId: build.providerId,
    modelId: build.modelId,
    profileId: build.profileId,
    languageMode: build.languageMode,
    platform: build.target.platform,
    architecture: build.target.architecture,
    capabilityDigest: build.capabilityDigest,
  };
  const cold = [],
    cacheExecutions = [],
    warmPreparation = [],
    warm = [],
    raw = [],
    rss = [];
  for (let index = 0; index < coldCount; index++) {
    const cacheExecution = await executeCacheProcedure(
      conditions.executionEnvironment.filesystemCacheProcedure,
      `${build.target.platform}-${build.target.architecture}`,
    );
    if (cacheExecution) cacheExecutions.push({ index, ...cacheExecution });
    const clip = corpus.manifest.clips[index % corpus.manifest.clips.length];
    const started = performance.now();
    const session = await createSession(packageRoot, expectedBase, work);
    await measureWithRss(session.start(), () => session.child?.pid, rss);
    const resultPromise = session.transcribe(
      path.resolve(corpus.root, clip.audioPath),
    );
    const result = await measureWithRss(
      resultPromise,
      () => session.child?.pid,
      rss,
    );
    cold.push({
      handshakeMs: session.timings.handshakeMs,
      preparationMs: session.timings.preparationMs,
      coldResultMs: performance.now() - started,
      requestMs: session.timings.lastRequestMs,
      outcome: result.outcome,
    });
    await session.shutdown();
  }
  let session;
  for (let index = 0; index < coldCount; index++) {
    const candidate = await createSession(packageRoot, expectedBase, work);
    await measureWithRss(candidate.start(), () => candidate.child?.pid, rss);
    warmPreparation.push({ preparationMs: candidate.timings.preparationMs });
    if (index === coldCount - 1) session = candidate;
    else await candidate.shutdown();
  }
  for (
    let index = 0;
    index < Math.max(warmCount, corpus.manifest.clips.length);
    index++
  ) {
    const clip = corpus.manifest.clips[index % corpus.manifest.clips.length];
    const resultPromise = session.transcribe(
      path.resolve(corpus.root, clip.audioPath),
    );
    const result = await measureWithRss(
      resultPromise,
      () => session.child?.pid,
      rss,
    );
    if (index < warmCount)
      warm.push({
        requestMs: session.timings.lastRequestMs,
        outcome: result.outcome,
      });
    if (index < corpus.manifest.clips.length) {
      const scored = errorRate(clip.reference, result.normalizedText, {
        metric: corpus.manifest.metric,
        profileId: build.profileId,
      });
      raw.push({
        clipId: clip.id,
        audioSha256: clip.audioSha256,
        reference: clip.reference,
        rawText: result.rawText,
        normalizedText: result.normalizedText,
        outcome: result.outcome,
        detectedLanguage: result.detectedLanguage,
        ...scored,
      });
    }
  }
  await session.shutdown();
  const conformance = await proveRuntimeConformance({
    createSession,
    packageRoot,
    expectedBase,
    work,
    sampleAudio: path.resolve(corpus.root, corpus.manifest.clips[0].audioPath),
  });
  const conformancePath = path.join(output, "runtime-conformance-v1.json");
  await writeJson(conformancePath, conformance);
  const after = await snapshot(packageRoot);
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("Provider mutated package bytes.");
  const rawPath = path.join(output, "raw-results.json");
  await writeJson(rawPath, {
    schemaVersion: 1,
    packageId: build.packageId,
    results: raw,
  });
  const indexPath = path.join(output, "result-index.json");
  await writeJson(indexPath, {
    schemaVersion: 1,
    results: raw.map((item) => ({
      clipId: item.clipId,
      audioSha256: item.audioSha256,
      outcome: item.outcome,
      errors: item.errors,
      units: item.units,
    })),
  });
  const performancePath = path.join(output, "performance-samples-v1.json");
  await writeJson(performancePath, {
    schemaVersion: 1,
    cacheProcedure: conditions.executionEnvironment.filesystemCacheProcedure,
    cacheExecutions,
    cold,
    warmPreparation,
    warm,
  });
  const quality = aggregateErrorRate(raw);
  const paired = pairedBootstrap(raw, baseline.results);
  const summary = {
    schemaVersion: 1,
    sourceCommit: build.sourceCommit,
    runnerCommit: conditions.runnerCommit,
    packageVersion: build.packageVersion,
    buildReportSha256: await shaFile(args["build-report"]),
    buildInputManifestSha256: build.buildInputManifestSha256,
    buildInputProvenanceSha256: build.buildInputProvenanceSha256,
    buildInputRecipeSha256: build.buildInputRecipeSha256,
    releaseMatrixId: build.releaseMatrixId,
    releaseMatrixSha256: build.releaseMatrixSha256,
    repositoryBuildLockSha256: build.repositoryBuildLockSha256,
    goToolchainHost: build.goToolchainHost,
    goToolchainArchiveSha256: build.goToolchainArchiveSha256,
    goToolchainRootManifestSha256: build.goToolchainRootManifestSha256,
    goToolchainRootTreeSha256: build.goToolchainRootTreeSha256,
    goToolchainRootFileCount: build.goToolchainRootFileCount,
    goToolchainRootSizeBytes: build.goToolchainRootSizeBytes,
    reproducibilityProofSha256: await shaFile(args["reproducibility-proof"]),
    runtimeConformanceSha256: await shaFile(conformancePath),
    performanceSamplesSha256: await shaFile(performancePath),
    packageId: build.packageId,
    providerId: build.providerId,
    modelId: build.modelId,
    profileId: build.profileId,
    languageMode: build.languageMode,
    target: build.target,
    archive: { ...build.archive, fileName: path.basename(args.archive) },
    capabilityDigest: build.capabilityDigest,
    descriptorSha256: build.descriptorSha256,
    fileManifestSha256: build.fileManifestSha256,
    launcherSha256: build.launcherSha256,
    launcherPlanSha256: build.launcherPlanSha256,
    hostSha256: build.hostSha256,
    engineConfigurationSha256: build.engineConfigurationSha256,
    modelSha256: build.modelSha256,
    normalizerSha256: build.normalizerSha256,
    protocolSha256: build.protocolSha256,
    noticeInventorySha256: build.noticeInventorySha256,
    generatedComplianceSha256: await shaFile(compliancePath),
    preflightSha256: conditions.preflight.sha256,
    sandboxProfileSha256: conditions.executionEnvironment.sandbox.profileSha256,
    conditions,
    corpus: corpus.corpusEvidence,
    quality: {
      metric: corpus.manifest.metric,
      value: quality.value,
      baseline: {
        id: baseline.baselineId,
        evidenceSha256: await shaFile(args.baseline),
        configurationDigest: baseline.configurationDigest,
        providerId: baseline.providerId,
        modelId: baseline.modelId,
        value: baseline.value,
        sampleCount: baseline.results.length,
        trustedCatalogSha256: baselineTrust.catalogSha256,
        promotedResultSha256: baselineTrust.record.promotedResultSha256,
        corpusManifestSha256: baselineTrust.record.corpusManifestSha256,
      },
      pairedUncertainty: paired,
      sampleCount: raw.length,
      emptyCount: raw.filter((item) => item.outcome === "no-speech").length,
      failedCount: 0,
      rawResultsSha256: await shaFile(rawPath),
      resultIndexSha256: await shaFile(indexPath),
    },
    handshake: latency(cold.map((item) => item.handshakeMs)),
    coldPreparation: latency(cold.map((item) => item.preparationMs)),
    warmPreparation: latency(warmPreparation.map((item) => item.preparationMs)),
    coldResult: latency(cold.map((item) => item.coldResultMs)),
    warmRequest: latency(warm.map((item) => item.requestMs)),
    maxRssBytes: Math.max(...rss),
    extractedSizeBytes: build.archive.extractedSizeBytes,
    packageRuns: coldCount + warmPreparation.length,
    actualPlatform: true,
    normalizationFixtures,
    relocation: true,
    offline: conditions.executionEnvironment.sandbox.networkDenied === true,
    noPackageMutation: true,
    recovery: conformance.cleanNextStart,
    licenseApproved: compliance.decision === "pass",
  };
  await writeJson(path.join(output, "qualification-summary.json"), summary);
} finally {
  await removeWritableTree(work);
}
async function createSession(root, base, work, deadlines) {
  const sessionId = randomUUID();
  const config = path.join(work, `session-${sessionId}.json`);
  await writeJson(config, {
    schemaVersion: 1,
    protocolVersion: 1,
    sessionId,
    profileId: base.profileId,
    expected: {
      packageId: base.packageId,
      providerId: base.providerId,
      modelId: base.modelId,
      languageMode: base.languageMode,
      platform: base.platform,
      architecture: base.architecture,
      descriptorSha256: build.descriptorSha256,
      fileManifestSha256: build.fileManifestSha256,
      capabilityDigest: base.capabilityDigest,
    },
  });
  return new ProviderProcessSession({
    launcher: path.join(
      root,
      "bin",
      base.platform === "win32" ? "voice-provider.exe" : "voice-provider",
    ),
    sessionConfig: config,
    expected: { ...base, sessionId },
    commandPrefix: qualificationCommandPrefix(conditions),
    deadlines,
  });
}
async function extractPackage(work, build, archive, goToolchain) {
  const expected = {
    schemaVersion: 1,
    packageId: build.packageId,
    target: build.target,
    archive: {
      format: "zip",
      formatVersion: 1,
      compression: "deflate",
      canonicalization: "autobyteus-provider-zip-v1",
      rootDirectory: "package",
      fileName: path.basename(archive),
      url: "https://invalid.example/qualification",
      sha256: build.archive.sha256,
      compressedSizeBytes: build.archive.compressedSizeBytes,
      extractedSizeBytes: build.archive.extractedSizeBytes,
      entryCount: build.archive.entryCount,
    },
    packageDescriptor: {
      path: "provider/provider-package-v1.json",
      sha256: build.descriptorSha256,
    },
    fileManifest: {
      path: "provider/package-files-v1.json",
      sha256: build.fileManifestSha256,
    },
  };
  const expectation = path.join(work, "expectation.json"),
    report = path.join(work, "extract-report.json"),
    destination = path.join(work, "relocated package – voice");
  await writeJson(expectation, expected);
  await run(
    goToolchain.executable,
    [
      "run",
      "./packaging/cmd/provider-package-tool",
      "extract",
      "--archive",
      archive,
      "--expectation",
      expectation,
      "--destination",
      destination,
      "--report",
      report,
    ],
    { cwd: ROOT, env: trustedGoEnvironment(goToolchain) },
  );
  return destination;
}
async function snapshot(root) {
  const records = [];
  for (const relative of await regularFiles(root)) {
    const file = path.join(root, relative);
    records.push([relative, (await fs.stat(file)).size, await shaFile(file)]);
  }
  return records;
}
function latency(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (q) =>
    sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)] ?? 0;
  return {
    count: sorted.length,
    failures: 0,
    timeouts: 0,
    p50Ms: pick(0.5),
    p95Ms: pick(0.95),
    maxMs: sorted.at(-1) ?? 0,
  };
}
async function proveNormalization() {
  const fixtures = await readJson(
    path.join(ROOT, "contracts/normalization/fixtures-v1.json"),
  );
  for (const fixture of fixtures.fixtures)
    if (
      normalizeTranscript(fixture.raw, fixture.profileId) !== fixture.normalized
    )
      throw new Error(`Normalization fixture failed: ${fixture.id}`);
  return true;
}
