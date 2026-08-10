#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parsePairs, readJson, shaFile } from "../build/lib/files.mjs";
import {
  canonicalDigest,
  compareNames,
  deepEqual,
  writeArtifact,
} from "./release-contract.mjs";

export async function deriveExecutionSubject({ repository, subject }) {
  assertSubjectShape(subject);
  const rows = [];
  for (const item of [...subject.inferenceCoreFiles].sort((left, right) =>
    compareNames(left.path, right.path),
  )) {
    const file = path.join(path.resolve(repository), item.path),
      info = await fs.lstat(file);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== item.sizeBytes)
      throw new Error(`Inference-core file identity invalid: ${item.path}`);
    const observed = await shaFile(file);
    if (observed !== item.sha256)
      throw new Error(`Inference-core file digest mismatch: ${item.path}`);
    rows.push(item);
  }
  return {
    sourceCommit: subject.sourceCommit,
    inferenceCoreSha256: canonicalDigest(rows),
    configurationSha256: subject.configurationSha256,
    modelManifestSha256: subject.modelManifestSha256,
    trustedOutputSha256: subject.trustedOutputSha256,
  };
}

export async function verifyProfileExecutionClosure({
  repository,
  historicalSubject,
  currentSubject,
  output,
}) {
  const historicalInput = await readJson(historicalSubject),
    currentInput = await readJson(currentSubject);
  if (historicalInput.profileId !== currentInput.profileId)
    throw new Error("Execution-closure profiles differ.");
  const historical = await deriveExecutionSubject({
      repository,
      subject: historicalInput,
    }),
    current = await deriveExecutionSubject({
      repository,
      subject: currentInput,
    }),
    adapterExclusionsExact = deepEqual(
      historicalInput.adapterExclusions,
      currentInput.adapterExclusions,
    ),
    comparison = {
      inferenceCoreEqual:
        historical.inferenceCoreSha256 === current.inferenceCoreSha256,
      pathNeutralConfigurationEqual:
        historical.configurationSha256 === current.configurationSha256,
      modelIdentityEqual:
        historical.modelManifestSha256 === current.modelManifestSha256,
      outputEvidenceEqual:
        historical.trustedOutputSha256 === current.trustedOutputSha256,
      adapterExclusionsExact,
    },
    result = {
      schemaVersion: 2,
      artifactKind: "profile-execution-closure",
      profileId: currentInput.profileId,
      historical,
      current,
      adapterExclusions: currentInput.adapterExclusions,
      comparison,
      decision: Object.values(comparison).every(Boolean)
        ? "reuse-permitted"
        : "qualification-required",
    };
  return writeArtifact(
    output,
    result,
    "contracts/qualification/profile-execution-closure-v2.schema.json",
    "Profile Execution Closure 2",
  );
}

function assertSubjectShape(subject) {
  if (
    !/^(?!0{40})[a-f0-9]{40}$/.test(subject?.sourceCommit) ||
    !["english", "chinese"].includes(subject.profileId) ||
    !Array.isArray(subject.inferenceCoreFiles) ||
    subject.inferenceCoreFiles.length === 0 ||
    !Array.isArray(subject.adapterExclusions) ||
    subject.adapterExclusions.length === 0 ||
    new Set(subject.adapterExclusions).size !== subject.adapterExclusions.length
  )
    throw new Error("Execution-closure subject is invalid.");
  const excluded = new Set(subject.adapterExclusions);
  for (const item of subject.inferenceCoreFiles) {
    if (
      !isRepositoryPath(item.path) ||
      excluded.has(item.path) ||
      !Number.isSafeInteger(item.sizeBytes) ||
      item.sizeBytes < 1 ||
      !/^[a-f0-9]{64}$/.test(item.sha256)
    )
      throw new Error("Execution-closure inference-core row is invalid.");
  }
  for (const digest of [
    subject.configurationSha256,
    subject.modelManifestSha256,
    subject.trustedOutputSha256,
  ])
    if (!/^[a-f0-9]{64}$/.test(digest))
      throw new Error("Execution-closure subject digest is invalid.");
}

function isRepositoryPath(value) {
  return (
    typeof value === "string" &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !value.split("/").some((item) => !item || item === "." || item === "..")
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "repository",
    "historical-subject",
    "current-subject",
    "output",
  ]);
  await verifyProfileExecutionClosure({
    repository: args.repository,
    historicalSubject: args["historical-subject"],
    currentSubject: args["current-subject"],
    output: args.output,
  });
}
