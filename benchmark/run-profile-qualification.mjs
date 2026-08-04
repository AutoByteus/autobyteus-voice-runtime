#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ProviderProcessSession } from "./provider-process-session.mjs";
import { measureWithRss } from "./rss-sampler.mjs";
import { startQualificationSession } from "./qualification-preparation.mjs";
import { preserveQualificationInputs } from "./qualification-inputs.mjs";
import { proveRuntimeConformance } from "./runtime-conformance.mjs";
import { validateCorpus } from "./corpus/validate-corpus.mjs";
import {
  qualificationScoringAuthority,
  scoreQualificationResult,
} from "./scoring/qualification-scoring.mjs";
import { resolveProfileResourcePolicy } from "./profile-resource-policy.mjs";
import { proveProductNormalization } from "./product-normalization-proof.mjs";
import { validateQualificationBaseline } from "./baseline/qualification-baseline.mjs";
import { executeCacheProcedure } from "./cache-procedure.mjs";
import {
  qualificationCommandPrefix,
  validateQualificationConditions,
} from "./qualification-environment.mjs";
import {
  QualificationAttemptRecorder,
  assertSuccessfulQualificationResult,
  classifyQualificationFailure,
  qualificationDecisionForFailure,
} from "./qualification-attempts.mjs";
import {
  assertPassingProfileQualification,
  writeProfileQualificationEvidence,
} from "./profile-qualification-evidence.mjs";
import {
  extractQualifiedPackage,
  snapshotPackage,
} from "./qualification-package.mjs";
import {
  assertGoToolchainProvenance,
  verifyGoToolchain,
} from "../build/locked-inputs.mjs";
import {
  parsePairs,
  readJson,
  removeWritableTree,
  writeJson,
} from "../build/lib/files.mjs";

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
  conditions = await readJson(args.conditions),
  goToolchain = await verifyGoToolchain(path.resolve(args.go)),
  corpus = await validateCorpus(args.corpus),
  baseline = await readJson(args.baseline);
assertGoToolchainProvenance(goToolchain, build);
if (
  build.profileId !== corpus.manifest.profileId ||
  build.sourceCommit !== conditions.sourceCommit ||
  conditions.profileId !== build.profileId ||
  conditions.target !== `${build.target.platform}-${build.target.architecture}`
)
  throw new Error("Corpus/profile/source mismatch.");
await validateQualificationConditions(conditions, args.conditions, build);
const normalizationFixtures = await proveProductNormalization(),
  baselineTrust = await validateQualificationBaseline(
    baseline,
    args.baseline,
    corpus,
    build,
  ),
  resourcePolicy = await resolveProfileResourcePolicy(
    build.profileId,
    `${build.target.platform}-${build.target.architecture}`,
  ),
  actual = {
    platform: process.platform,
    architecture: process.arch === "x64" ? "x64" : process.arch,
  };
if (
  actual.platform !== build.target.platform ||
  actual.architecture !== build.target.architecture
)
  throw new Error("Qualification must execute the advertised target.");

const output = path.resolve(args.output),
  work = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-profile-qualification-"),
  );
const coldCount = 30,
  warmCount = 100;
await fs.mkdir(output, { recursive: true });
let context = null,
  evidenceWritten = false;
try {
  const preserved = await preserveQualificationInputs({
    destination: output,
    build,
    conditions,
    buildReportPath: path.resolve(args["build-report"]),
    reproducibilityProofPath: path.resolve(args["reproducibility-proof"]),
    compliancePath: path.resolve(args.compliance),
    baselinePath: path.resolve(args.baseline),
    corpusPath: path.resolve(args.corpus),
    conditionsPath: path.resolve(args.conditions),
  });
  const packageRoot = await extractQualifiedPackage({
      work,
      build,
      archive: path.resolve(args.archive),
      goToolchain,
    }),
    before = await snapshotPackage(packageRoot),
    expectedBase = {
      packageId: build.packageId,
      providerId: build.providerId,
      modelId: build.modelId,
      profileId: build.profileId,
      languageMode: build.languageMode,
      platform: build.target.platform,
      architecture: build.target.architecture,
      capabilityDigest: build.capabilityDigest,
    },
    recorder = await new QualificationAttemptRecorder({
      output: path.join(output, "qualification-attempts-v1.json"),
      packageId: build.packageId,
      profileId: build.profileId,
      target: `${build.target.platform}-${build.target.architecture}`,
    }).initialize();
  context = {
    ...preserved,
    packageRoot,
    before,
    expectedBase,
    recorder,
    cacheExecutions: [],
    cold: [],
    warmPreparation: [],
    warm: [],
    raw: [],
    rss: [],
    preparationAttempts: [],
    activeSession: null,
    failureCategory: null,
    conformancePath: null,
    noPackageMutation: false,
    recovery: false,
  };
  await runColdTrials(context);
  await runWarmPreparationTrials(context);
  await runWarmAndQualityTrials(context);
  await context.activeSession.shutdown();
  context.activeSession = null;
  const conformance = await proveRuntimeConformance({
    createSession,
    packageRoot,
    expectedBase,
    work,
    sampleAudio: path.resolve(corpus.root, corpus.manifest.clips[0].audioPath),
  });
  context.conformancePath = path.join(output, "runtime-conformance-v1.json");
  await writeJson(context.conformancePath, conformance);
  context.recovery = conformance.cleanNextStart;
  const after = await snapshotPackage(packageRoot);
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("Provider mutated package bytes.");
  context.noPackageMutation = true;
  const evidence = await writeEvidence(context, "pass", null);
  evidenceWritten = true;
  assertPassingProfileQualification(evidence);
} catch (error) {
  if (context && !evidenceWritten) {
    await terminateQuietly(context.activeSession, error);
    context.activeSession = null;
    const category =
      context.failureCategory ?? classifyQualificationFailure(error);
    await writeEvidence(
      context,
      qualificationDecisionForFailure(category),
      category,
    );
  }
  throw error;
} finally {
  await removeWritableTree(work);
}

async function runColdTrials(state) {
  for (let index = 0; index < coldCount; index++) {
    const clip = corpus.manifest.clips[index % corpus.manifest.clips.length],
      sequence = await state.recorder.start({
        phase: "cold",
        index,
        performanceCounted: true,
        qualityCounted: false,
        audioSha256: clip.audioSha256,
      }),
      started = performance.now();
    let session = null;
    try {
      let cacheExecution;
      try {
        cacheExecution = await executeCacheProcedure(
          conditions.executionEnvironment.filesystemCacheProcedure,
          `${build.target.platform}-${build.target.architecture}`,
        );
      } catch (cause) {
        throw new Error("CACHE_PROCEDURE_FAILED", { cause });
      }
      if (cacheExecution)
        state.cacheExecutions.push({ index, ...cacheExecution });
      session = await createSession(
        state.packageRoot,
        state.expectedBase,
        work,
      );
      state.activeSession = session;
      await startQualificationSession({
        session,
        profileId: build.profileId,
        attemptSequence: sequence,
        rss: state.rss,
        preparationAttempts: state.preparationAttempts,
      });
      const result = await measuredTranscription(session, clip, state.rss);
      assertSuccessfulQualificationResult(result);
      const sample = {
        handshakeMs: session.timings.handshakeMs,
        preparationMs: session.timings.preparationMs,
        coldResultMs: performance.now() - started,
        requestMs: session.timings.lastRequestMs,
        outcome: result.outcome,
      };
      await session.shutdown();
      state.activeSession = null;
      state.cold.push(sample);
      await state.recorder.succeed(sequence, {
        outcome: result.outcome,
        timings: attemptTimings(session, { resultMs: sample.coldResultMs }),
      });
    } catch (error) {
      await recordAttemptFailure(state, sequence, session, error, {
        resultMs: performance.now() - started,
      });
      throw error;
    }
  }
}

async function runWarmPreparationTrials(state) {
  for (let index = 0; index < coldCount; index++) {
    const sequence = await state.recorder.start({
      phase: "warm-preparation",
      index,
      performanceCounted: true,
      qualityCounted: false,
    });
    let session = null;
    try {
      session = await createSession(
        state.packageRoot,
        state.expectedBase,
        work,
      );
      state.activeSession = session;
      await startQualificationSession({
        session,
        profileId: build.profileId,
        attemptSequence: sequence,
        rss: state.rss,
        preparationAttempts: state.preparationAttempts,
      });
      if (index < coldCount - 1) {
        await session.shutdown();
        state.activeSession = null;
      }
      state.warmPreparation.push({
        preparationMs: session.timings.preparationMs,
      });
      await state.recorder.succeed(sequence, {
        timings: attemptTimings(session),
      });
    } catch (error) {
      await recordAttemptFailure(state, sequence, session, error);
      throw error;
    }
  }
}

async function runWarmAndQualityTrials(state) {
  const count = Math.max(warmCount, corpus.manifest.clips.length);
  for (let index = 0; index < count; index++) {
    const clip = corpus.manifest.clips[index % corpus.manifest.clips.length],
      sequence = await state.recorder.start({
        phase: "warm-request",
        index,
        performanceCounted: index < warmCount,
        qualityCounted: index < corpus.manifest.clips.length,
        audioSha256: clip.audioSha256,
      });
    try {
      const result = await measuredTranscription(
        state.activeSession,
        clip,
        state.rss,
      );
      assertSuccessfulQualificationResult(result);
      if (index < warmCount)
        state.warm.push({
          requestMs: state.activeSession.timings.lastRequestMs,
          outcome: result.outcome,
        });
      if (index < corpus.manifest.clips.length) {
        const scored = scoreQualificationResult({
          profileId: build.profileId,
          metric: corpus.manifest.metric,
          rawReference: clip.reference,
          rawHypothesis: result.rawText,
        });
        state.raw.push({
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
      await state.recorder.succeed(sequence, {
        outcome: result.outcome,
        timings: attemptTimings(state.activeSession),
      });
    } catch (error) {
      await recordAttemptFailure(state, sequence, state.activeSession, error);
      throw error;
    }
  }
}

async function measuredTranscription(session, clip, rss) {
  return measureWithRss(
    session.transcribe(path.resolve(corpus.root, clip.audioPath)),
    () => session.child?.pid,
    rss,
  );
}

async function recordAttemptFailure(
  state,
  sequence,
  session,
  error,
  extra = {},
) {
  state.failureCategory = await state.recorder.fail(
    sequence,
    error,
    attemptTimings(session, extra),
  );
  await terminateQuietly(session, error);
  state.activeSession = null;
}

function attemptTimings(session, extra = {}) {
  return {
    handshakeMs: session?.timings.handshakeMs,
    preparationMs: session?.timings.preparationMs,
    requestMs: session?.timings.lastRequestMs,
    ...extra,
  };
}

async function terminateQuietly(session, error) {
  if (!session || ["stopped", "failed"].includes(session.state)) return;
  try {
    await session.fail(error);
  } catch {}
}

async function writeEvidence(state, decision, failureCategory) {
  return writeProfileQualificationEvidence({
    output,
    build,
    conditions,
    corpus,
    baseline,
    baselineTrust,
    scoringAuthority: qualificationScoringAuthority(build.profileId),
    resourcePolicy,
    compliancePath: state.compliancePath,
    archivePath: path.resolve(args.archive),
    buildReportPath: state.buildReportPath,
    reproducibilityProofPath: state.reproducibilityProofPath,
    nativeBuildEnvironmentPath: state.nativeBuildEnvironmentPath,
    normalizationFixtures,
    recorder: state.recorder,
    cacheExecutions: state.cacheExecutions,
    cold: state.cold,
    warmPreparation: state.warmPreparation,
    warm: state.warm,
    raw: state.raw,
    rss: state.rss,
    preparationAttempts: state.preparationAttempts,
    conformancePath: state.conformancePath,
    decision,
    failureCategory,
    noPackageMutation: state.noPackageMutation,
    recovery: state.recovery,
  });
}

async function createSession(root, base, temporary, deadlines) {
  const sessionId = randomUUID(),
    config = path.join(temporary, `session-${sessionId}.json`);
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
