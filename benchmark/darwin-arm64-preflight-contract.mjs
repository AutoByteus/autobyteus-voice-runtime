import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { locked } from "../build/locked-inputs.mjs";
import { readJson, ROOT, shaFile } from "../build/lib/files.mjs";
import {
  assertXcodeClangCxxIdentity,
  assertXcodeRanlibIdentity,
} from "../build/native-tool-identities.mjs";
import {
  systemCommandIdentityDigest,
  verifyPinnedSudoIdentity,
  verifyPinnedSudoMetadataIdentity,
} from "./system-command-identity.mjs";

const schema = await readJson(
    path.join(
      ROOT,
      "contracts/qualification/darwin-arm64-preflight-v2.schema.json",
    ),
  ),
  ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export async function assertPassingDarwinArm64Preflight(value) {
  await assertPassingPreflightRecord(value);
  await verifyPinnedSudoIdentity(value.tools.sudoExecutable);
  return value;
}

export async function assertSandboxedBuildDarwinArm64Preflight(value) {
  await assertPassingPreflightRecord(value);
  await verifyPinnedSudoMetadataIdentity(value.tools.sudoExecutable);
  return value;
}

async function assertPassingPreflightRecord(value) {
  if (!validate(value) || value.status !== "pass")
    throw new Error(
      `Passing M1 preflight required: ${JSON.stringify(validate.errors)}`,
    );
  const average =
      value.performanceEnvironment.cpuIdleSamples.reduce(
        (sum, item) => sum + item,
        0,
      ) / value.performanceEnvironment.cpuIdleSamples.length,
    go = locked.goToolchain.archives["darwin-arm64"],
    sandbox = path.join(
      ROOT,
      "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
    );
  if (
    Math.abs(average - value.performanceEnvironment.averageIdlePercent) >
      1e-12 ||
    value.performanceEnvironment.taskOwnedCompetingProcesses.detected !==
      value.performanceEnvironment.taskOwnedCompetingProcesses.processNames
        .length >
        0 ||
    value.performanceEnvironment.classification !==
      (average >= 80 &&
      !value.performanceEnvironment.taskOwnedCompetingProcesses.detected
        ? "controlled"
        : "loaded-host") ||
    value.tools.goArchiveSha256 !== go.sha256 ||
    value.tools.goRootTreeSha256 !== go.rootTreeSha256 ||
    value.sandbox.profileSha256 !== (await shaFile(sandbox)) ||
    value.purge.sudoExecutableIdentitySha256 !==
      systemCommandIdentityDigest(value.tools.sudoExecutable)
  )
    throw new Error("M1 preflight identities do not recompute.");
  await assertXcodeRanlibIdentity(
    value.tools.appleRanlibExecutable,
    value.tools.appleLibtoolExecutable,
  );
  await assertXcodeClangCxxIdentity(
    value.tools.appleClangCxxExecutable,
    value.tools.appleClangExecutable,
  );
  return value;
}

export function assertPreflightConditionBinding(conditions, preflight) {
  if (
    conditions.preflight.status !== "pass" ||
    JSON.stringify(conditions.hardware) !== JSON.stringify(preflight.host) ||
    JSON.stringify(conditions.operatingEnvironment?.power) !==
      JSON.stringify(preflight.power) ||
    JSON.stringify(conditions.operatingEnvironment?.performanceEnvironment) !==
      JSON.stringify(preflight.performanceEnvironment) ||
    JSON.stringify(conditions.operatingEnvironment?.tools) !==
      JSON.stringify(preflight.tools) ||
    JSON.stringify(conditions.executionEnvironment?.sandbox) !==
      JSON.stringify(preflight.sandbox)
  )
    throw new Error(
      "Qualification conditions do not preserve preflight facts.",
    );
}
