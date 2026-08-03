import path from "node:path";
import { readJson, ROOT, shaFile } from "../build/lib/files.mjs";

export const CURRENT_MATRIX_PATH = path.join(
  ROOT,
  "contracts/catalog/current-release-matrix-v1.json",
);

export function matrixEntryKey(value) {
  return `${value.profileId}/${value.platform}/${value.architecture}`;
}

export async function loadCurrentReleaseMatrix(file = CURRENT_MATRIX_PATH) {
  const value = await readJson(file);
  assertMatrixShape(value);
  const keys = value.entries.map(matrixEntryKey);
  if (new Set(keys).size !== keys.length)
    throw new Error("Current Release Matrix contains duplicate entries.");
  if (keys.join(",") !== "english/darwin/arm64,chinese/darwin/arm64")
    throw new Error("Current Release Matrix identity/order is not approved.");
  return { value, path: path.resolve(file), sha256: await shaFile(file) };
}

function assertMatrixShape(value) {
  const topKeys = ["entries", "matrixId", "schemaVersion", "supportStatement"],
    entryKeys = [
      "architecture",
      "decision",
      "languageMode",
      "modelId",
      "packageId",
      "platform",
      "profileId",
      "providerId",
      "recipeFileName",
    ];
  if (
    !value ||
    Object.keys(value).sort().join(",") !== topKeys.join(",") ||
    value.schemaVersion !== 1 ||
    value.matrixId !== "voice-runtime-darwin-arm64-v1" ||
    value.supportStatement !== "macOS Apple Silicon only" ||
    !Array.isArray(value.entries) ||
    value.entries.length !== 2
  )
    throw new Error("Current Release Matrix shape is invalid.");
  for (const entry of value.entries)
    if (
      !entry ||
      Object.keys(entry).sort().join(",") !== entryKeys.join(",") ||
      !["english", "chinese"].includes(entry.profileId) ||
      !["en", "zh"].includes(entry.languageMode) ||
      entry.platform !== "darwin" ||
      entry.architecture !== "arm64" ||
      !["preserve", "select"].includes(entry.decision) ||
      !/^[A-Za-z0-9._-]+$/.test(entry.packageId) ||
      !/^[A-Za-z0-9._-]+$/.test(entry.providerId) ||
      !/^[A-Za-z0-9._-]+$/.test(entry.modelId) ||
      entry.recipeFileName !== `${entry.profileId}-darwin-arm64-v1.json`
    )
      throw new Error("Current Release Matrix entry is invalid.");
}

export function assertExactMatrixRows(matrix, rows) {
  const expected = matrix.entries.map(matrixEntryKey);
  const actual = rows.map(matrixEntryKey);
  if (
    actual.length !== expected.length ||
    new Set(actual).size !== actual.length ||
    expected.some((key) => !actual.includes(key))
  )
    throw new Error(
      "Artifact does not contain the exact Current Release Matrix.",
    );
  for (const entry of matrix.entries) {
    const row = rows.find(
      (item) => matrixEntryKey(item) === matrixEntryKey(entry),
    );
    for (const key of [
      "profileId",
      "languageMode",
      "platform",
      "architecture",
      "packageId",
      "providerId",
      "modelId",
      "decision",
    ])
      if (
        (key === "decision" && row?.candidateDecision !== undefined
          ? row.candidateDecision
          : row?.[key]) !== entry[key]
      )
        throw new Error(
          `Current matrix identity mismatch: ${matrixEntryKey(entry)}/${key}`,
        );
  }
}
