import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, ROOT, writeJson } from "../build/lib/files.mjs";
import {
  ACCEPTED_AGGREGATE,
  ACCEPTED_ARCHIVES,
  QUALIFIED_SOURCE_COMMIT,
  RELEASE_MATRIX,
} from "./recovery-authority.mjs";
import {
  RECOVERY_RESULT_PATH,
  writeRecoveryManifest,
  verifyRecoveryManifest,
} from "./recovery-evidence.mjs";
import {
  assertProfileRecoveryRows,
  recoveryDecision,
  summarizeProfileRecoveries,
} from "./recovery-outcomes.mjs";

export async function finalizeRecoveryResult(context) {
  const { output, profileRecoveries } = context,
    execution = summarizeProfileRecoveries(profileRecoveries);
  await writeRawRecoveryEvidence({ ...context, execution });
  const evidenceManifest = await writeRecoveryManifest(output),
    result = buildRecoveryResult({ ...context, execution, evidenceManifest });
  await validateRecoveryResult(result, output);
  await writeJson(path.join(output, RECOVERY_RESULT_PATH), result);
  return result;
}

export function buildRecoveryResult({
  controller,
  runner,
  profileRecoveries,
  execution = summarizeProfileRecoveries(profileRecoveries),
  evidenceManifest,
  failure,
}) {
  const decision = recoveryDecision(profileRecoveries),
    result = {
      schemaVersion: 1,
      artifactKind: "qualified-archive-recovery-result",
      repository: "AutoByteus/autobyteus-voice-runtime",
      packageVersion: "1.0.0",
      decision,
      qualifiedAuthority: {
        sourceCommit: QUALIFIED_SOURCE_COMMIT,
        apiRevision: "API-REV-017",
        ...ACCEPTED_AGGREGATE,
      },
      controller,
      runner: resultRunner(runner),
      closedInputs: expectedClosedInputs(),
      profileRecoveries,
      execution,
      evidenceManifest,
    };
  if (decision !== "pass") result.failure = failure;
  return result;
}

export async function validateRecoveryResult(result, root) {
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
  assertProfileRecoveryRows(result.profileRecoveries);
  const expectedExecution = summarizeProfileRecoveries(
    result.profileRecoveries,
  );
  if (
    JSON.stringify(result.execution) !== JSON.stringify(expectedExecution) ||
    result.decision !== recoveryDecision(result.profileRecoveries) ||
    (result.decision === "pass") !== (result.failure === undefined)
  )
    throw new Error("Recovery Result decision/count projection is invalid.");
  if (result.failure && !failureMatchesRows(result))
    throw new Error("Recovery Result terminal failure is inconsistent.");
  if (root && result.evidenceManifest)
    await verifyRecoveryManifest(root, result.evidenceManifest);
}

export function unavailableRecoverySubject() {
  return {
    schemaVersion: 1,
    status: "unattempted",
    unavailability: { category: "pre-build-blocked" },
  };
}

export async function writeUnattemptedLogs(recovery, rows) {
  await fs.mkdir(recovery, { recursive: true });
  for (const row of rows) {
    if (row.outcome !== "unattempted") continue;
    const target = path.join(recovery, `${row.profileId}-build.log`);
    try {
      await fs.access(target);
    } catch {
      await fs.writeFile(
        target,
        `controller-terminal profile=${row.profileId} sequence=${row.sequence} category=${row.unavailability.category}\n`,
        { flag: "wx" },
      );
    }
  }
}

async function writeRawRecoveryEvidence({
  output,
  config,
  startedAt,
  controller,
  admission,
  checkout,
  runner,
  network,
  profileRecoveries,
  execution,
}) {
  const recovery = path.join(output, "recovery");
  await writeUnattemptedLogs(recovery, profileRecoveries);
  await Promise.all([
    writeJson(path.join(recovery, "recovery-run-v1.json"), {
      schemaVersion: 1,
      repository: "AutoByteus/autobyteus-voice-runtime",
      packageVersion: "1.0.0",
      workflowRunId: Number(config.workflowRunId),
      controller,
      preliminarySourceAdmission: admission,
      startedAt,
      completedAt: new Date().toISOString(),
      commands: expectedCommands(),
      execution,
    }),
    writeJson(
      path.join(recovery, "qualified-source-checkout-v1.json"),
      checkout,
    ),
    writeJson(path.join(recovery, "runner-environment-v1.json"), runner),
    writeJson(path.join(recovery, "network-denial-v1.json"), network),
    ...profileRecoveries.map((profileRecovery) => {
      const expected = ACCEPTED_ARCHIVES.find(
        (item) => item.profileId === profileRecovery.profileId,
      );
      return writeJson(
        path.join(
          recovery,
          `${profileRecovery.profileId}-profile-recovery-v1.json`,
        ),
        {
          schemaVersion: 1,
          qualifiedSourceCommit: QUALIFIED_SOURCE_COMMIT,
          releaseMatrix: RELEASE_MATRIX,
          accepted: expected,
          profileRecovery,
        },
      );
    }),
  ]);
}

function resultRunner(runner) {
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

function expectedClosedInputs() {
  return {
    releaseMatrixSha256: RELEASE_MATRIX.sha256,
    items: ACCEPTED_ARCHIVES.map((item) => ({
      profileId: item.profileId,
      recipeSha256: item.recipeSha256,
      provenanceSha256: item.provenanceSha256,
      repositoryBuildLockSha256: item.repositoryBuildLockSha256,
      nativeBuildEnvironmentSha256: item.nativeBuildEnvironmentSha256,
      goToolchainRootTreeSha256: item.goToolchainRootTreeSha256,
    })),
  };
}

function failureMatchesRows(result) {
  const firstFailed = result.profileRecoveries.find(
    (row) => row.outcome === "failed",
  );
  if (firstFailed)
    return (
      JSON.stringify(result.failure) === JSON.stringify(firstFailed.failure)
    );
  return (
    result.decision === "blocked" &&
    result.profileRecoveries.every((row) => row.outcome === "unattempted")
  );
}

function expectedCommands() {
  return [
    "materialize exact closed inputs per profile",
    "create trusted native build environment",
    "network-denied package assembly once per profile",
    "verify provider archive identities",
  ];
}
