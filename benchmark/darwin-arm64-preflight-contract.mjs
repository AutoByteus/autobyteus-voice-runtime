import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { locked } from "../build/locked-inputs.mjs";
import { readJson, ROOT, shaFile } from "../build/lib/files.mjs";

const schema = await readJson(
    path.join(
      ROOT,
      "contracts/qualification/darwin-arm64-preflight-v1.schema.json",
    ),
  ),
  ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export async function assertPassingDarwinArm64Preflight(value) {
  if (!validate(value) || value.status !== "pass")
    throw new Error(
      `Passing M1 preflight required: ${JSON.stringify(validate.errors)}`,
    );
  const average =
      value.quiescence.samples.reduce((sum, item) => sum + item, 0) /
      value.quiescence.samples.length,
    go = locked.goToolchain.archives["darwin-arm64"],
    sandbox = path.join(
      ROOT,
      "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
    );
  if (
    Math.abs(average - value.quiescence.averageIdlePercent) > 1e-12 ||
    value.tools.goArchiveSha256 !== go.sha256 ||
    value.tools.goRootTreeSha256 !== go.rootTreeSha256 ||
    value.sandbox.profileSha256 !== (await shaFile(sandbox))
  )
    throw new Error("M1 preflight identities do not recompute.");
  return value;
}

export function assertPreflightConditionBinding(conditions, preflight) {
  if (
    conditions.preflight.status !== "pass" ||
    JSON.stringify(conditions.hardware) !== JSON.stringify(preflight.host) ||
    JSON.stringify(conditions.operatingEnvironment?.power) !==
      JSON.stringify(preflight.power) ||
    JSON.stringify(conditions.operatingEnvironment?.quiescence) !==
      JSON.stringify(preflight.quiescence) ||
    JSON.stringify(conditions.operatingEnvironment?.tools) !==
      JSON.stringify(preflight.tools) ||
    JSON.stringify(conditions.executionEnvironment?.sandbox) !==
      JSON.stringify(preflight.sandbox)
  )
    throw new Error(
      "Qualification conditions do not preserve preflight facts.",
    );
}
