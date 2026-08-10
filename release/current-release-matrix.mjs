import path from "node:path";
import { readJson, ROOT, shaFile } from "../build/lib/files.mjs";
export const CURRENT_MATRIX_PATH = path.join(
  ROOT,
  "contracts/catalog/current-release-matrix-v2.json",
);
export function matrixEntryKey(value) {
  return `${value.profileId}/${value.platform}/${value.architecture}`;
}
export async function loadCurrentReleaseMatrix(file = CURRENT_MATRIX_PATH) {
  const value = await readJson(file);
  assertMatrixShape(value);
  const keys = value.entries.map(matrixEntryKey);
  if (
    new Set(keys).size !== keys.length ||
    keys.join(",") !== "english/darwin/arm64,chinese/darwin/arm64"
  )
    throw new Error("Current Release Matrix identity/order is not approved.");
  return { value, path: path.resolve(file), sha256: await shaFile(file) };
}
function assertMatrixShape(value) {
  const top = [
    "entries",
    "matrixId",
    "profileResourcePolicy",
    "schemaVersion",
    "supportStatement",
  ];
  const entry = [
    "architecture",
    "candidateDecision",
    "capabilityDigest",
    "compatibilityRequirementSha256",
    "hostPackageId",
    "hostRecipeFileName",
    "languageMode",
    "modelAdmissionRoot",
    "modelAssetId",
    "modelId",
    "modelManifest",
    "platform",
    "profileId",
    "providerId",
  ];
  if (
    !value ||
    Object.keys(value).sort().join(",") !== top.join(",") ||
    value.schemaVersion !== 2 ||
    value.matrixId !== "voice-runtime-darwin-arm64-v2" ||
    value.supportStatement !== "macOS Apple Silicon only" ||
    !Array.isArray(value.entries) ||
    value.entries.length !== 2
  )
    throw new Error("Current Release Matrix shape is invalid.");
  for (const row of value.entries) {
    if (
      Object.keys(row).sort().join(",") !== entry.join(",") ||
      !["english", "chinese"].includes(row.profileId) ||
      !["en", "zh"].includes(row.languageMode) ||
      row.platform !== "darwin" ||
      row.architecture !== "arm64" ||
      !["preserve", "select"].includes(row.candidateDecision) ||
      row.hostRecipeFileName !== `${row.profileId}-host-darwin-arm64-v2.json`
    )
      throw new Error("Current Release Matrix entry is invalid.");
    for (const digest of [
      row.capabilityDigest,
      row.compatibilityRequirementSha256,
      row.modelAdmissionRoot?.sha256,
      row.modelManifest?.sha256,
    ])
      if (!/^[a-f0-9]{64}$/.test(digest ?? ""))
        throw new Error("Current Release Matrix digest invalid.");
  }
}
export function assertExactMatrixRows(matrix, rows) {
  const expected = matrix.entries.map(matrixEntryKey),
    actual = rows.map(matrixEntryKey);
  if (
    actual.length !== expected.length ||
    new Set(actual).size !== actual.length ||
    expected.some((key) => !actual.includes(key))
  )
    throw new Error(
      "Artifact does not contain the exact Current Release Matrix.",
    );
}
