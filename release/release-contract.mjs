import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  readJson,
  ROOT,
  sha256,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";

export const RELEASE_VERSION = "1.0.0";
export const RELEASE_TAG = "v1.0.0";
export const PUBLISHED_ASSET_NAMES = Object.freeze(
  [
    "THIRD_PARTY_NOTICES.json",
    "pretag-release-manifest-v4.json",
    "release-qualification-evidence-v4.json",
    "release-SHA256SUMS.txt",
    "voice-host-chinese-darwin-arm64-1.0.0.zip",
    "voice-host-english-darwin-arm64-1.0.0.zip",
    "voice-model-chinese-fun-asr-nano-gguf-q8-v1.json",
    "voice-model-english-whisper-small-mlx-fp16-v1.json",
    "voice-runtime-catalog-v4.json",
  ].sort(compareNames),
);

export const CHECKSUM_COVERED_NAMES = Object.freeze(
  PUBLISHED_ASSET_NAMES.filter((name) => name !== "release-SHA256SUMS.txt"),
);

export async function validateArtifact(value, schemaPath, label) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const check = ajv.compile(await readJson(path.join(ROOT, schemaPath)));
  if (!check(value))
    throw new Error(`${label} invalid: ${JSON.stringify(check.errors)}`);
  return value;
}

export async function ordinaryFileIdentity(
  file,
  fileName = path.basename(file),
) {
  const resolved = path.resolve(file),
    info = await fs.lstat(resolved);
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1)
    throw new Error(`Release input is not one ordinary file: ${fileName}`);
  return { fileName, sizeBytes: info.size, sha256: await shaFile(resolved) };
}

export async function readValidated(file, schema, label) {
  const value = await readJson(path.resolve(file));
  await validateArtifact(value, schema, label);
  return value;
}

export function assertExactNames(actual, expected, label) {
  const observed = [...actual].sort(compareNames),
    required = [...expected].sort(compareNames);
  if (
    new Set(observed).size !== observed.length ||
    !deepEqual(observed, required)
  )
    throw new Error(`${label} is not the exact required file-name set.`);
}

export function compareNames(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

export function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function canonicalDigest(value) {
  return sha256(Buffer.from(canonicalJson(value)));
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value)
    .sort(compareNames)
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

export async function writeChecksums(directory, output) {
  const rows = [];
  for (const fileName of CHECKSUM_COVERED_NAMES) {
    const identity = await ordinaryFileIdentity(path.join(directory, fileName));
    rows.push(identity);
  }
  assertExactNames(
    rows.map((item) => item.fileName),
    CHECKSUM_COVERED_NAMES,
    "Checksum coverage",
  );
  const text = rows
    .sort((left, right) => compareNames(left.fileName, right.fileName))
    .map((item) => `${item.sha256}  ${item.fileName}\n`)
    .join("");
  await fs.writeFile(path.resolve(output), text, { mode: 0o644 });
  return rows;
}

export async function parseAndVerifyChecksums(directory, checksumFile) {
  const text = await fs.readFile(path.resolve(checksumFile), "utf8"),
    rows = text
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const match = /^([a-f0-9]{64})  ([A-Za-z0-9._-]+)$/.exec(line);
        if (!match) throw new Error("Checksum manifest grammar is invalid.");
        return { sha256: match[1], fileName: match[2] };
      });
  assertExactNames(
    rows.map((item) => item.fileName),
    CHECKSUM_COVERED_NAMES,
    "Checksum coverage",
  );
  const identities = [];
  for (const row of rows) {
    const identity = await ordinaryFileIdentity(
      path.join(directory, row.fileName),
    );
    if (identity.sha256 !== row.sha256)
      throw new Error(`Checksum mismatch: ${row.fileName}`);
    identities.push(identity);
  }
  return identities.sort((left, right) =>
    compareNames(left.fileName, right.fileName),
  );
}

export async function writeArtifact(output, value, schema, label) {
  await validateArtifact(value, schema, label);
  await writeJson(path.resolve(output), value);
  return value;
}
