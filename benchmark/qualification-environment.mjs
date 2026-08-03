import path from "node:path";
import { readJson, ROOT, shaFile } from "../build/lib/files.mjs";
import {
  assertPassingDarwinArm64Preflight,
  assertPreflightConditionBinding,
} from "./darwin-arm64-preflight-contract.mjs";

export async function validateQualificationConditions(value, file, build) {
  if (
    value.schemaVersion !== 1 ||
    value.sourceCommit !== build.sourceCommit ||
    value.runnerCommit !== value.sourceCommit ||
    value.profileId !== build.profileId ||
    value.target !== "darwin-arm64" ||
    value.preflight?.status !== "pass" ||
    !/^[a-f0-9]{64}$/.test(value.preflight.sha256) ||
    !value.hardware ||
    !value.operatingEnvironment ||
    value.executionEnvironment?.sandbox?.networkDenied !== true ||
    value.executionEnvironment?.sandbox?.localOperationsAllowed !== true ||
    !value.executionEnvironment?.filesystemCacheProcedure?.id ||
    typeof value.executionEnvironment.filesystemCacheProcedure.required !==
      "boolean" ||
    !/^[a-f0-9]{64}$/.test(
      value.executionEnvironment.filesystemCacheProcedure.sha256,
    )
  )
    throw new Error("Invalid qualification conditions.");
  const preflightPath = path.join(
    path.dirname(path.resolve(file)),
    value.preflight.fileName,
  );
  if ((await shaFile(preflightPath)) !== value.preflight.sha256)
    throw new Error("Qualification preflight digest mismatch.");
  const preflight = await readJson(preflightPath);
  await assertPassingDarwinArm64Preflight(preflight);
  assertPreflightConditionBinding(value, preflight);
}

export function qualificationCommandPrefix(conditions) {
  return [
    "/usr/bin/sandbox-exec",
    "-f",
    path.join(ROOT, conditions.executionEnvironment.sandbox.profile),
  ];
}
