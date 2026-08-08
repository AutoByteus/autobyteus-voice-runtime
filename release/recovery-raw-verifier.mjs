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
import {
  assessPreliminarySourceAdmission,
  loadSourceClosurePolicy,
} from "./source-closure.mjs";

export async function verifyRawRecoveryAuthority(root, result, raw, authority) {
  authority ??= await productionAuthority();
  const [recoveryRun, checkout, runner, network, ...profiles] = raw,
    { sourceCommit, sourceTree, matrix, archives, networkProfileSha256 } =
      authority,
    runnerProjection = projectRunner(runner),
    expectedInputs = expectedClosedInputs(matrix, archives);
  await verifyAdmission(recoveryRun.preliminarySourceAdmission, authority);
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
    checkout.status !== "verified" ||
    checkout.headCommit !== sourceCommit ||
    checkout.tree !== sourceTree ||
    checkout.clean !== true ||
    checkout.detached !== true ||
    JSON.stringify(runnerProjection) !== JSON.stringify(result.runner) ||
    runner.status !== "verified" ||
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
      (item) => item.profileRecovery?.profileId === expected.profileId,
    ),
    resultRow = result.profileRecoveries.find(
      (item) => item.profileId === expected.profileId,
    );
  if (
    profile?.schemaVersion !== 1 ||
    profile.qualifiedSourceCommit !== sourceCommit ||
    JSON.stringify(profile.releaseMatrix) !== JSON.stringify(matrix) ||
    JSON.stringify(profile.accepted) !== JSON.stringify(expected) ||
    JSON.stringify(profile.profileRecovery) !== JSON.stringify(resultRow)
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
  if (resultRow.outcome !== "succeeded") return;
  const archivePath = path.join(root, "assets", expected.fileName),
    archiveInfo = await fs.lstat(archivePath);
  if (
    !archiveInfo.isFile() ||
    archiveInfo.isSymbolicLink() ||
    archiveInfo.size !== expected.sizeBytes ||
    (await shaFile(archivePath)) !== expected.sha256 ||
    resultRow.archive.status !== "accepted" ||
    resultRow.archive.exactMatch !== true
  )
    throw new Error(`Recovered archive is inconsistent: ${expected.profileId}`);
}

async function verifyAdmission(admission, authority) {
  let expected;
  if (authority.admission) expected = authority.admission;
  else {
    const loaded = await loadSourceClosurePolicy({
      repository: authority.repository,
    });
    if (
      admission?.policy?.policyId !== loaded.value.policyId ||
      admission?.policy?.sha256 !== loaded.sha256
    )
      throw new Error("Preliminary source admission policy mismatch.");
    expected = await assessPreliminarySourceAdmission({
      repository: authority.repository,
      acceptedAuthorityCommit: admission.acceptedAuthorityCommit,
      reviewedControllerCommit: admission.reviewedControllerCommit,
      policy: loaded.value,
      policySha256: loaded.sha256,
    });
  }
  if (
    JSON.stringify(admission) !== JSON.stringify(expected) ||
    admission.decision !== "reuse-permitted"
  )
    throw new Error(
      "Preliminary source admission does not independently pass.",
    );
}

function projectRunner(runner) {
  if (runner.status === "unattempted") return runner;
  return {
    status: "verified",
    ownership: runner.ownership,
    platform: runner.platform,
    architecture: runner.architecture,
    runnerGroup: runner.runnerGroup,
    runnerId: runner.runnerId,
    environmentSha256: runner.environmentSha256,
  };
}

function expectedClosedInputs(matrix, archives) {
  return {
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
}

async function productionAuthority() {
  return {
    repository: path.resolve(import.meta.dirname, ".."),
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
