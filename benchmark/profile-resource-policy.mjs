import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, ROOT, shaFile } from "../build/lib/files.mjs";
import {
  loadCurrentReleaseMatrix,
  matrixEntryKey,
} from "../release/current-release-matrix.mjs";

export const PROFILE_RESOURCE_POLICY_PATH = path.join(
  ROOT,
  "contracts/qualification/profile-resource-policy-v1.json",
);

export async function loadProfileResourcePolicy(
  file = PROFILE_RESOURCE_POLICY_PATH,
) {
  const [value, schema, matrix] = await Promise.all([
      readJson(file),
      readJson(
        path.join(
          ROOT,
          "contracts/qualification/profile-resource-policy-v1.schema.json",
        ),
      ),
      loadCurrentReleaseMatrix(),
    ]),
    validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema),
    sha256 = await shaFile(file);
  if (!validate(value))
    throw new Error(
      `Profile Resource Policy invalid: ${JSON.stringify(validate.errors)}`,
    );
  // Matrix 2 preserves the reviewed Policy 1 bytes (and their historical
  // matrixId) by exact identity rather than relabeling the policy.
  if (
    matrix.value.profileResourcePolicy.policyId !== value.policyId ||
    matrix.value.profileResourcePolicy.fileName !== path.basename(file) ||
    matrix.value.profileResourcePolicy.sha256 !== sha256
  )
    throw new Error("Current Release Matrix resource-policy binding mismatch.");
  const matrixKeys = matrix.value.entries.map(matrixEntryKey),
    policyKeys = value.rows.map(matrixEntryKey);
  if (
    new Set(policyKeys).size !== policyKeys.length ||
    matrixKeys.length !== policyKeys.length ||
    matrixKeys.some((key, index) => key !== policyKeys[index])
  )
    throw new Error("Profile Resource Policy does not close the matrix.");
  return { value, sha256, matrix };
}

export async function resolveProfileResourcePolicy(profileId, target) {
  const policy = await loadProfileResourcePolicy(),
    [platform, architecture] = target.split("-"),
    row = policy.value.rows.find(
      (item) =>
        item.profileId === profileId &&
        item.platform === platform &&
        item.architecture === architecture,
    );
  if (!row) throw new Error("No exact Profile Resource Policy row exists.");
  return Object.freeze({
    policyId: policy.value.policyId,
    sha256: policy.sha256,
    row: Object.freeze({ ...row }),
  });
}

export function assertResourcePolicyObservation(resourcePolicy, observedBytes) {
  if (
    !resourcePolicy ||
    !Number.isSafeInteger(observedBytes) ||
    observedBytes < 0 ||
    !Number.isSafeInteger(resourcePolicy.row?.hardProcessTreeRssCeilingBytes) ||
    !Number.isSafeInteger(resourcePolicy.row?.assessmentOptimizationTargetBytes)
  )
    throw new Error("Profile Resource Policy observation is invalid.");
  return {
    policyId: resourcePolicy.policyId,
    sha256: resourcePolicy.sha256,
    row: { ...resourcePolicy.row },
    observedPeakProcessTreeRssBytes: observedBytes,
    hardCeilingMet:
      observedBytes > 0 &&
      observedBytes <= resourcePolicy.row.hardProcessTreeRssCeilingBytes,
  };
}
