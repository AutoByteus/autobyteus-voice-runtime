import fs from "node:fs/promises";
import path from "node:path";
import { sha256, shaFile } from "../build/lib/files.mjs";
import {
  ACCEPTED_ARCHIVES,
  QUALIFIED_SOURCE_COMMIT,
  QUALIFIED_SOURCE_TREE,
  RELEASE_MATRIX,
} from "./recovery-authority.mjs";
import { gitFileSha256 } from "./recovery-git-identity.mjs";

export async function verifyRawRecoveryAuthority(root, result, raw, authority) {
  authority ??= await productionAuthority();
  const [recoveryRun, checkout, runner, network, ...profiles] = raw,
    { sourceCommit, sourceTree, matrix, archives, networkProfileSha256 } =
      authority,
    runnerProjection = {
      ownership: runner.ownership,
      platform: runner.platform,
      architecture: runner.architecture,
      runnerGroup: runner.runnerGroup,
      runnerId: runner.runnerId,
      environmentSha256: runner.environmentSha256,
    },
    expectedInputs = {
      releaseMatrixSha256: matrix.sha256,
      items: archives.map((item) => ({
        profileId: item.profileId,
        recipeSha256: item.recipeSha256,
        provenanceSha256: item.provenanceSha256,
        repositoryBuildLockSha256: item.repositoryBuildLockSha256,
        nativeBuildEnvironmentSha256: item.nativeBuildEnvironmentSha256,
        goToolchainRootTreeSha256: item.goToolchainRootTreeSha256,
      })),
    };
  if (
    recoveryRun.repository !== "AutoByteus/autobyteus-voice-runtime" ||
    recoveryRun.packageVersion !== "1.0.0" ||
    !Number.isSafeInteger(recoveryRun.workflowRunId) ||
    recoveryRun.workflowRunId < 1 ||
    JSON.stringify(recoveryRun.controller) !==
      JSON.stringify(result.controller) ||
    JSON.stringify(recoveryRun.execution) !==
      JSON.stringify(result.execution) ||
    JSON.stringify(recoveryRun.commands) !==
      JSON.stringify(expectedCommands()) ||
    checkout.headCommit !== sourceCommit ||
    checkout.tree !== sourceTree ||
    checkout.clean !== true ||
    checkout.detached !== true ||
    JSON.stringify(runnerProjection) !== JSON.stringify(result.runner) ||
    runner.environment?.platform !== "darwin" ||
    runner.environment?.architecture !== "arm64" ||
    runner.environment?.runnerGroup !== runner.runnerGroup ||
    runner.environment?.runnerId !== runner.runnerId ||
    runner.environmentSha256 !== shaObject(runner.environment) ||
    network.decision !== "pass" ||
    network.profileFileName !==
      "benchmark/sandbox/darwin-arm64-network-denied-v1.sb" ||
    network.profileSha256 !== networkProfileSha256 ||
    network.canary !== "outbound-tcp-denied" ||
    network.buildWindow !== "network-denied" ||
    JSON.stringify(result.closedInputs) !== JSON.stringify(expectedInputs)
  )
    throw new Error("Raw recovery authority is incomplete or inconsistent.");
  for (const expected of archives)
    await verifyProfile(root, result, profiles, expected, sourceCommit, matrix);
}

async function verifyProfile(
  root,
  result,
  profiles,
  expected,
  sourceCommit,
  matrix,
) {
  const profile = profiles.find(
      (item) => item.accepted?.profileId === expected.profileId,
    ),
    resultArchive = result.archives.find(
      (item) => item.profileId === expected.profileId,
    ),
    archivePath = path.join(root, "assets", expected.fileName),
    archiveInfo = await fs.lstat(archivePath);
  if (
    profile?.schemaVersion !== 1 ||
    profile.decision !== "pass" ||
    profile.qualifiedSourceCommit !== sourceCommit ||
    JSON.stringify(profile.releaseMatrix) !== JSON.stringify(matrix) ||
    JSON.stringify(profile.accepted) !== JSON.stringify(expected) ||
    JSON.stringify(profile.observed) !== JSON.stringify(resultArchive) ||
    !archiveInfo.isFile() ||
    archiveInfo.isSymbolicLink() ||
    archiveInfo.size !== expected.sizeBytes ||
    (await shaFile(archivePath)) !== expected.sha256
  )
    throw new Error(
      `Raw recovery profile is inconsistent: ${expected.profileId}`,
    );
  const logInfo = await fs.lstat(
    path.join(root, "recovery", `${expected.profileId}-build.log`),
  );
  if (
    !logInfo.isFile() ||
    logInfo.isSymbolicLink() ||
    logInfo.size > 1024 * 1024
  )
    throw new Error(`Recovery build log is invalid: ${expected.profileId}`);
}

async function productionAuthority() {
  return {
    sourceCommit: QUALIFIED_SOURCE_COMMIT,
    sourceTree: QUALIFIED_SOURCE_TREE,
    matrix: RELEASE_MATRIX,
    archives: ACCEPTED_ARCHIVES,
    networkProfileSha256: await gitFileSha256(
      QUALIFIED_SOURCE_COMMIT,
      "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
    ),
  };
}

function expectedCommands() {
  return [
    "materialize exact closed inputs per profile",
    "create trusted native build environment",
    "network-denied package assembly once per profile",
    "verify provider archive identities",
  ];
}

function shaObject(value) {
  return sha256(Buffer.from(`${JSON.stringify(value)}\n`));
}
