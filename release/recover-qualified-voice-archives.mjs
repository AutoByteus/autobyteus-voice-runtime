#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import {
  parsePairs,
  readJson,
  ROOT,
  sha256,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import {
  ACCEPTED_AGGREGATE,
  ACCEPTED_ARCHIVES,
  QUALIFIED_SOURCE_COMMIT,
  QUALIFIED_SOURCE_TREE,
  RECOVERY_OWNER_PATH,
  RECOVERY_WORKFLOW_PATH,
  RELEASE_MATRIX,
} from "./recovery-authority.mjs";
import {
  RECOVERY_RESULT_PATH,
  assertExactRecoveryDirectory,
  verifyRecoveryManifest,
  writeRecoveryManifest,
} from "./recovery-evidence.mjs";
import { gitFileSha256 } from "./recovery-git-identity.mjs";
import { verifyRawRecoveryAuthority } from "./recovery-raw-verifier.mjs";
import {
  executeRecoveryBuild,
  verifyRecoveryNetworkDenial,
} from "./recovery-build.mjs";

const run = promisify(execFile);

export async function recoverQualifiedArchives(config) {
  assertControllerConfig(config);
  await assertControllerCheckout(config.controllerCommit);
  const output = path.resolve(config.output),
    recovery = path.join(output, "recovery"),
    startedAt = new Date().toISOString(),
    controller = await controllerIdentity(config.controllerCommit),
    checkout = await checkoutIdentity(config.qualifiedSource),
    runner = await runnerIdentity(config),
    network = await verifyRecoveryNetworkDenial(config.qualifiedSource);
  await assertOutputAbsent(output);
  let observed;
  try {
    ({ observed } = await executeRecoveryBuild(config));
  } catch (error) {
    await writeFailureRawEvidence({
      output,
      recovery,
      config,
      startedAt,
      controller,
      checkout,
      runner,
      network,
      error,
    });
    throw error;
  }
  await writeRawEvidence({
    recovery,
    config,
    startedAt,
    controller,
    checkout,
    runner,
    network,
    observed,
  });
  const evidenceManifest = await writeRecoveryManifest(output),
    result = buildRecoveryResult({
      controller,
      runner,
      observed,
      evidenceManifest,
    });
  await validateRecoveryResult(result, output);
  await writeJson(path.join(output, RECOVERY_RESULT_PATH), result);
  await verifyQualifiedArchiveRecoveryResult(output);
  return result;
}

export async function verifyQualifiedArchiveRecoveryResult(root) {
  const resolvedRoot = path.resolve(root),
    resultPath = path.join(resolvedRoot, RECOVERY_RESULT_PATH),
    result = await readJson(resultPath);
  await validateRecoveryResult(result, root);
  await assertExactRecoveryDirectory(resolvedRoot);
  if (result.decision !== "pass")
    throw new Error("Qualified archive recovery did not pass.");
  await verifyRecoveryManifest(root, result.evidenceManifest);
  if (
    result.qualifiedAuthority.sourceCommit !== QUALIFIED_SOURCE_COMMIT ||
    JSON.stringify(result.qualifiedAuthority.qualificationSet) !==
      JSON.stringify(ACCEPTED_AGGREGATE.qualificationSet) ||
    JSON.stringify(result.qualifiedAuthority.branchProjection) !==
      JSON.stringify(ACCEPTED_AGGREGATE.branchProjection) ||
    JSON.stringify(result.qualifiedAuthority.branchProjectionVerification) !==
      JSON.stringify(ACCEPTED_AGGREGATE.branchProjectionVerification) ||
    result.runner.ownership !== "organization-managed" ||
    result.runner.runnerGroup !== "voice-runtime-recovery" ||
    result.execution.packageBuildsPerProfile !== 1 ||
    Object.entries(result.execution).some(
      ([key, value]) => key !== "packageBuildsPerProfile" && value !== 0,
    )
  )
    throw new Error("Recovery authority does not match the approved boundary.");
  assertArchiveRows(result.archives);
  const expectedController = await controllerIdentity(result.controller.commit);
  if (JSON.stringify(result.controller) !== JSON.stringify(expectedController))
    throw new Error("Recovery controller Git identities do not reproduce.");
  const raw = await Promise.all(
    [
      "recovery-run-v1.json",
      "qualified-source-checkout-v1.json",
      "runner-environment-v1.json",
      "network-denial-v1.json",
      "english-profile-recovery-v1.json",
      "chinese-profile-recovery-v1.json",
    ].map((file) => readJson(path.join(root, "recovery", file))),
  );
  await verifyRawRecoveryAuthority(resolvedRoot, result, raw);
  return result;
}

function buildRecoveryResult(context) {
  const { controller, runner, observed, evidenceManifest } = context;
  return {
    schemaVersion: 1,
    artifactKind: "qualified-archive-recovery-result",
    repository: "AutoByteus/autobyteus-voice-runtime",
    packageVersion: "1.0.0",
    decision: "pass",
    qualifiedAuthority: {
      sourceCommit: QUALIFIED_SOURCE_COMMIT,
      apiRevision: "API-REV-017",
      ...ACCEPTED_AGGREGATE,
    },
    controller,
    runner: {
      ownership: runner.ownership,
      platform: runner.platform,
      architecture: runner.architecture,
      runnerGroup: runner.runnerGroup,
      runnerId: runner.runnerId,
      environmentSha256: runner.environmentSha256,
    },
    closedInputs: {
      releaseMatrixSha256: RELEASE_MATRIX.sha256,
      items: ACCEPTED_ARCHIVES.map((item) => ({
        profileId: item.profileId,
        recipeSha256: item.recipeSha256,
        provenanceSha256: item.provenanceSha256,
        repositoryBuildLockSha256: item.repositoryBuildLockSha256,
        nativeBuildEnvironmentSha256: item.nativeBuildEnvironmentSha256,
        goToolchainRootTreeSha256: item.goToolchainRootTreeSha256,
      })),
    },
    archives: observed,
    execution: zeroExecution(),
    evidenceManifest,
  };
}

async function writeRawEvidence(context) {
  const {
    recovery,
    config,
    startedAt,
    controller,
    checkout,
    runner,
    network,
    observed,
  } = context;
  await Promise.all([
    writeJson(path.join(recovery, "recovery-run-v1.json"), {
      schemaVersion: 1,
      repository: "AutoByteus/autobyteus-voice-runtime",
      packageVersion: "1.0.0",
      workflowRunId: config.workflowRunId,
      controller,
      startedAt,
      completedAt: new Date().toISOString(),
      commands: [
        "materialize exact closed inputs per profile",
        "create trusted native build environment",
        "network-denied package assembly once per profile",
        "verify provider archive identities",
      ],
      execution: zeroExecution(),
    }),
    writeJson(
      path.join(recovery, "qualified-source-checkout-v1.json"),
      checkout,
    ),
    writeJson(path.join(recovery, "runner-environment-v1.json"), runner),
    writeJson(path.join(recovery, "network-denial-v1.json"), network),
    ...observed.map((item) =>
      writeJson(
        path.join(recovery, `${item.profileId}-profile-recovery-v1.json`),
        {
          schemaVersion: 1,
          decision: "pass",
          qualifiedSourceCommit: QUALIFIED_SOURCE_COMMIT,
          releaseMatrix: RELEASE_MATRIX,
          accepted: ACCEPTED_ARCHIVES.find(
            (expected) => expected.profileId === item.profileId,
          ),
          observed: item,
        },
      ),
    ),
  ]);
}

async function writeFailureRawEvidence(context) {
  const { output, recovery, error } = context;
  await fs.mkdir(recovery, { recursive: true });
  const fallback = ACCEPTED_ARCHIVES.map((expected) => ({
    profileId: expected.profileId,
    buildCount: 1,
    fileName: expected.fileName,
    expectedSizeBytes: expected.sizeBytes,
    observedSizeBytes: 0,
    expectedSha256: expected.sha256,
    observedSha256: "0".repeat(64),
    descriptorSha256: expected.descriptorSha256,
    fileManifestSha256: expected.fileManifestSha256,
    descriptorSourceCommit: QUALIFIED_SOURCE_COMMIT,
    buildReportSha256: "0".repeat(64),
    provenanceSha256: "0".repeat(64),
    exactMatch: false,
  }));
  for (const expected of ACCEPTED_ARCHIVES) {
    const log = path.join(recovery, `${expected.profileId}-build.log`);
    try {
      await fs.access(log);
    } catch {
      await fs.writeFile(log, `recovery failed: ${safeError(error)}\n`);
    }
  }
  await writeRawEvidence({ ...context, observed: fallback });
  const evidenceManifest = await writeRecoveryManifest(output),
    result = {
      ...buildRecoveryResult({
        controller: context.controller,
        runner: context.runner,
        observed: fallback,
        evidenceManifest,
      }),
      decision: "blocked",
    };
  await validateRecoveryResult(result, output);
  await writeJson(path.join(output, RECOVERY_RESULT_PATH), result);
}

async function controllerIdentity(commit) {
  return {
    commit,
    workflowPath: RECOVERY_WORKFLOW_PATH,
    workflowSha256: await gitFileSha256(commit, RECOVERY_WORKFLOW_PATH),
    recoveryOwnerSha256: await gitFileSha256(commit, RECOVERY_OWNER_PATH),
  };
}

async function assertControllerCheckout(commit) {
  const current = (
    await run("git", ["rev-parse", "HEAD"], { cwd: ROOT })
  ).stdout.trim();
  if (current !== commit)
    throw new Error("Recovery controller commit is not the checked-out HEAD.");
}

async function checkoutIdentity(source) {
  const cwd = path.resolve(source),
    headCommit = (
      await run("git", ["rev-parse", "HEAD"], { cwd })
    ).stdout.trim(),
    tree = (
      await run("git", ["show", "-s", "--format=%T", "HEAD"], { cwd })
    ).stdout.trim(),
    clean =
      (await run("git", ["status", "--porcelain"], { cwd })).stdout === "",
    detached = !(await run("git", ["symbolic-ref", "-q", "HEAD"], { cwd }).then(
      () => true,
      () => false,
    ));
  if (
    headCommit !== QUALIFIED_SOURCE_COMMIT ||
    tree !== QUALIFIED_SOURCE_TREE ||
    !clean ||
    !detached
  )
    throw new Error("Qualified source checkout identity is not exact.");
  return { schemaVersion: 1, headCommit, tree, clean, detached };
}

async function runnerIdentity(config) {
  if (process.platform !== "darwin" || process.arch !== "arm64")
    throw new Error("Recovery runner must be darwin-arm64.");
  const environment = {
    platform: process.platform,
    architecture: process.arch,
    runnerGroup: config.runnerGroup,
    runnerId: config.runnerId,
    goSha256: await shaFile(config.go),
    cmakeSha256: await shaFile(await fs.realpath(config.cmake)),
    preflightSha256: await shaFile(config.preflight),
  };
  return {
    schemaVersion: 1,
    ownership: "organization-managed",
    platform: "darwin",
    architecture: "arm64",
    runnerGroup: config.runnerGroup,
    runnerId: config.runnerId,
    environmentSha256: shaObject(environment),
    environment,
  };
}

async function validateRecoveryResult(result, root) {
  const schema = await readJson(
      path.join(
        ROOT,
        "contracts/release/qualified-archive-recovery-result-v1.schema.json",
      ),
    ),
    validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!validate(result))
    throw new Error(
      `Recovery Result invalid: ${JSON.stringify(validate.errors)}`,
    );
  if (result.evidenceManifest)
    await verifyRecoveryManifest(root, result.evidenceManifest);
}

function assertArchiveRows(rows) {
  if (rows.length !== 2) throw new Error("Recovery must bind two archives.");
  for (const expected of ACCEPTED_ARCHIVES) {
    const row = rows.find((item) => item.profileId === expected.profileId);
    if (
      !row?.exactMatch ||
      row.buildCount !== 1 ||
      row.fileName !== expected.fileName ||
      row.expectedSizeBytes !== expected.sizeBytes ||
      row.observedSizeBytes !== expected.sizeBytes ||
      row.expectedSha256 !== expected.sha256 ||
      row.observedSha256 !== expected.sha256 ||
      row.descriptorSha256 !== expected.descriptorSha256 ||
      row.fileManifestSha256 !== expected.fileManifestSha256 ||
      row.buildReportSha256 !== expected.buildReportSha256 ||
      row.provenanceSha256 !== expected.provenanceSha256 ||
      row.descriptorSourceCommit !== QUALIFIED_SOURCE_COMMIT
    )
      throw new Error(
        `Recovery archive authority mismatch: ${expected.profileId}`,
      );
  }
}

function assertControllerConfig(config) {
  for (const key of [
    "qualifiedSource",
    "output",
    "cacheRoot",
    "go",
    "cmake",
    "preflight",
  ])
    if (typeof config?.[key] !== "string" || !path.isAbsolute(config[key]))
      throw new Error(`Recovery config ${key} must be absolute.`);
  if (
    config.runnerGroup !== "voice-runtime-recovery" ||
    !/^org-managed-voice-recovery-[A-Za-z0-9._-]+$/.test(config.runnerId) ||
    !/^[1-9][0-9]*$/.test(String(config.workflowRunId)) ||
    !/^(?!0{40})[a-f0-9]{40}$/.test(config.controllerCommit)
  )
    throw new Error("Recovery controller/runner identity is not approved.");
}

async function assertOutputAbsent(output) {
  try {
    await fs.lstat(output);
    throw new Error("Recovery output must not already exist.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function zeroExecution() {
  return {
    packageBuildsPerProfile: 1,
    providerStarts: 0,
    inferenceRequests: 0,
    corpusRuns: 0,
    coldTrials: 0,
    warmPreparationTrials: 0,
    warmRequestTrials: 0,
  };
}

function shaObject(value) {
  return sha256(Buffer.from(`${JSON.stringify(value)}\n`));
}

function safeError(error) {
  return String(error?.message ?? "unknown recovery failure")
    .replace(/[\r\n\u0000-\u001f]+/g, " ")
    .slice(0, 512);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), ["config"]),
    config = await readJson(path.resolve(args.config));
  await recoverQualifiedArchives(config);
}
