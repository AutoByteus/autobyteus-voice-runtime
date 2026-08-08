#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  parsePairs,
  readJson,
  ROOT,
  sha256,
  shaFile,
} from "../build/lib/files.mjs";
import {
  ACCEPTED_AGGREGATE,
  ACCEPTED_ARCHIVES,
  QUALIFIED_SOURCE_COMMIT,
  QUALIFIED_SOURCE_TREE,
  RECOVERY_OWNER_PATH,
  RECOVERY_WORKFLOW_PATH,
} from "./recovery-authority.mjs";
import {
  RECOVERY_RESULT_PATH,
  assertExactRecoveryDirectory,
  verifyRecoveryManifest,
} from "./recovery-evidence.mjs";
import { gitFileSha256 } from "./recovery-git-identity.mjs";
import { verifyRawRecoveryAuthority } from "./recovery-raw-verifier.mjs";
import {
  executeRecoveryBuild,
  verifyRecoveryNetworkDenial,
} from "./recovery-build.mjs";
import { blockedRecoveries, recoveryDecision } from "./recovery-outcomes.mjs";
import {
  finalizeRecoveryResult,
  unavailableRecoverySubject,
  validateRecoveryResult,
} from "./recovery-result.mjs";
import {
  assessPreliminarySourceAdmission,
  loadSourceClosurePolicy,
} from "./source-closure.mjs";

const run = promisify(execFile);

export async function recoverQualifiedArchives(
  config,
  dependencies = productionDependencies(),
) {
  assertControllerConfig(config);
  await dependencies.assertControllerCheckout(config.controllerCommit);
  const output = path.resolve(config.output),
    recovery = path.join(output, "recovery"),
    startedAt = new Date().toISOString();
  await assertOutputAbsent(output);
  await fs.mkdir(recovery, { recursive: true });
  const { value: policy, sha256: policySha256 } =
      await dependencies.loadPolicy(),
    admission = await dependencies.assessAdmission({
      repository: ROOT,
      acceptedAuthorityCommit:
        policy.closures.qualificationAuthority.baseCommit,
      reviewedControllerCommit: config.controllerCommit,
      policy,
      policySha256,
    }),
    controller = await dependencies.controllerIdentity(config.controllerCommit);
  if (admission.decision !== "reuse-permitted")
    return finalizeAndStop({
      output,
      config,
      startedAt,
      controller,
      admission,
      checkout: unavailableRecoverySubject(),
      runner: configuredUnattemptedRunner(config),
      network: unavailableRecoverySubject(),
      profileRecoveries: blockedRecoveries(ACCEPTED_ARCHIVES),
      failure: terminalFailure(
        "preliminary-source-admission-not-reuse",
        "preliminary-source-admission",
      ),
    });

  let checkout;
  try {
    checkout = await dependencies.checkoutIdentity(config.qualifiedSource);
  } catch {
    return finalizeAndStop(
      blockedContext({
        output,
        config,
        startedAt,
        controller,
        admission,
        category: "source-checkout-invalid",
        stage: "source-checkout",
      }),
    );
  }
  let runner;
  try {
    runner = await dependencies.runnerIdentity(config);
  } catch {
    return finalizeAndStop(
      blockedContext({
        output,
        config,
        startedAt,
        controller,
        admission,
        checkout,
        category: "runner-unapproved",
        stage: "runner-identity",
      }),
    );
  }
  let network;
  try {
    network = await dependencies.verifyNetwork(config.qualifiedSource);
  } catch {
    return finalizeAndStop(
      blockedContext({
        output,
        config,
        startedAt,
        controller,
        admission,
        checkout,
        runner,
        category: "network-denial-invalid",
        stage: "network-denial",
      }),
    );
  }
  let profileRecoveries;
  try {
    ({ profileRecoveries } = await dependencies.executeBuild(config));
  } catch {
    return finalizeAndStop(
      blockedContext({
        output,
        config,
        startedAt,
        controller,
        admission,
        checkout,
        runner,
        network,
        category: "toolchain-invalid",
        stage: "toolchain",
      }),
    );
  }
  const failure = profileRecoveries.find(
      (row) => row.outcome === "failed",
    )?.failure,
    result = await finalizeRecoveryResult({
      output,
      config,
      startedAt,
      controller,
      admission,
      checkout,
      runner,
      network,
      profileRecoveries,
      failure,
    });
  if (result.decision !== "pass") throw terminalError(result);
  await verifyQualifiedArchiveRecoveryResult(output);
  return result;
}

export async function verifyQualifiedArchiveRecoveryResult(root) {
  const resolvedRoot = path.resolve(root),
    result = await readJson(path.join(resolvedRoot, RECOVERY_RESULT_PATH));
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
    result.runner.status !== "verified" ||
    result.runner.ownership !== "organization-managed" ||
    result.runner.runnerGroup !== "voice-runtime-recovery"
  )
    throw new Error("Recovery authority does not match the approved boundary.");
  assertAcceptedProfileRecoveries(result.profileRecoveries);
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

async function finalizeAndStop(context) {
  const result = await finalizeRecoveryResult(context);
  throw terminalError(result);
}

function blockedContext(context) {
  return {
    output: context.output,
    config: context.config,
    startedAt: context.startedAt,
    controller: context.controller,
    admission: context.admission,
    checkout: context.checkout ?? unavailableRecoverySubject(),
    runner: context.runner ?? configuredUnattemptedRunner(context.config),
    network: context.network ?? unavailableRecoverySubject(),
    profileRecoveries: blockedRecoveries(ACCEPTED_ARCHIVES),
    failure: terminalFailure(context.category, context.stage),
  };
}

function terminalFailure(category, stage) {
  return { category, stage };
}

function terminalError(result) {
  const error = new Error(
    `Qualified archive recovery ended with ${result.decision}: ${result.failure.category}.`,
  );
  error.recoveryResult = result;
  return error;
}

function configuredUnattemptedRunner(config) {
  return {
    status: "unattempted",
    ownership: "organization-managed",
    runnerGroup: config.runnerGroup,
    runnerId: config.runnerId,
  };
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
    detached = !(await run("git", ["symbolic-ref", "-q", "HEAD"], {
      cwd,
    }).then(
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
  return {
    schemaVersion: 1,
    status: "verified",
    headCommit,
    tree,
    clean,
    detached,
  };
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
    status: "verified",
    ownership: "organization-managed",
    platform: "darwin",
    architecture: "arm64",
    runnerGroup: config.runnerGroup,
    runnerId: config.runnerId,
    environmentSha256: sha256(Buffer.from(`${JSON.stringify(environment)}\n`)),
    environment,
  };
}

function assertAcceptedProfileRecoveries(rows) {
  if (recoveryDecision(rows) !== "pass")
    throw new Error("Recovery profile set is not complete Pass.");
  for (const expected of ACCEPTED_ARCHIVES) {
    const row = rows.find((item) => item.profileId === expected.profileId),
      archive = row?.archive;
    if (
      row?.outcome !== "succeeded" ||
      archive?.status !== "accepted" ||
      !archive.exactMatch ||
      archive.fileName !== expected.fileName ||
      archive.expectedSizeBytes !== expected.sizeBytes ||
      archive.observedSizeBytes !== expected.sizeBytes ||
      archive.expectedSha256 !== expected.sha256 ||
      archive.observedSha256 !== expected.sha256 ||
      archive.descriptorSha256 !== expected.descriptorSha256 ||
      archive.fileManifestSha256 !== expected.fileManifestSha256 ||
      archive.buildReportSha256 !== expected.buildReportSha256 ||
      archive.provenanceSha256 !== expected.provenanceSha256 ||
      archive.descriptorSourceCommit !== QUALIFIED_SOURCE_COMMIT
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

function productionDependencies() {
  return {
    assertControllerCheckout,
    loadPolicy: () => loadSourceClosurePolicy(),
    assessAdmission: assessPreliminarySourceAdmission,
    controllerIdentity,
    checkoutIdentity,
    runnerIdentity,
    verifyNetwork: verifyRecoveryNetworkDenial,
    executeBuild: executeRecoveryBuild,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), ["config"]),
    config = await readJson(path.resolve(args.config));
  await recoverQualifiedArchives(config);
}
