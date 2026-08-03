#!/usr/bin/env node
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import {
  assertExactMatrixRows,
  loadCurrentReleaseMatrix,
  matrixEntryKey,
} from "./current-release-matrix.mjs";
import { composeCatalogEntryIdentity } from "./catalog-entry-identity.mjs";

export async function buildReleaseCatalog({
  qualificationSetPath,
  releaseEvidencePath,
  releaseTag,
  baseUrl,
  output,
}) {
  if (
    !/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(releaseTag) ||
    !/^https:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+$/.test(baseUrl)
  )
    throw new Error("Invalid catalog release distribution identity.");
  const qset = await readJson(qualificationSetPath),
    evidence = await readJson(releaseEvidencePath),
    matrix = await loadCurrentReleaseMatrix();
  await validate(
    qset,
    "contracts/release/qualification-set-v2.schema.json",
    "Qualification Set",
  );
  await validate(
    evidence,
    "contracts/release/release-qualification-evidence-v2.schema.json",
    "Release Evidence",
  );
  if (
    qset.artifactKind !== "qualification-set" ||
    evidence.artifactKind !== "release-qualification-evidence" ||
    qset.functionalDecision !== "pass" ||
    evidence.functionalDecision !== "pass" ||
    evidence.performanceAssessment !== qset.performanceAssessment ||
    evidence.qualificationSet.sha256 !==
      (await shaFile(qualificationSetPath)) ||
    evidence.intendedRelease.releaseTag !== releaseTag ||
    evidence.intendedRelease.runtimeVersion !== qset.packageVersion ||
    evidence.sourceCommit !== qset.sourceCommit ||
    evidence.releaseMatrix.sha256 !== matrix.sha256 ||
    JSON.stringify(evidence.profileQualifications) !==
      JSON.stringify(qset.profiles) ||
    JSON.stringify(evidence.expectedProviderArchives.items) !==
      JSON.stringify(
        qset.profiles
          .map((item) => ({
            fileName: item.archive.fileName,
            sizeBytes: item.archive.sizeBytes,
            sha256: item.archive.sha256,
          }))
          .sort((left, right) =>
            Buffer.compare(
              Buffer.from(left.fileName),
              Buffer.from(right.fileName),
            ),
          ),
      )
  )
    throw new Error("Catalog input digest/lineage mismatch.");
  assertExactMatrixRows(matrix.value, qset.profiles);
  const entries = [];
  for (const matrixEntry of matrix.value.entries) {
    const profile = qset.profiles.find(
      (item) => matrixEntryKey(item) === matrixEntryKey(matrixEntry),
    );
    const identity = await composeCatalogEntryIdentity(matrixEntry, profile);
    entries.push({
      ...identity,
      archive: {
        ...identity.archive,
        url: `${baseUrl.replace(/\/$/, "")}/${releaseTag}/${identity.archive.fileName}`,
      },
    });
  }
  const catalog = {
    schemaVersion: 3,
    runtimeId: "voice-input",
    runtimeVersion: qset.packageVersion,
    sourceCommit: qset.sourceCommit,
    releaseTag,
    releaseMatrix: qset.releaseMatrix,
    releaseEvidence: {
      fileName: "release-qualification-evidence-v2.json",
      sha256: await shaFile(releaseEvidencePath),
    },
    entries,
  };
  await validate(
    catalog,
    "contracts/catalog/voice-runtime-catalog-v3.schema.json",
    "Catalog 3",
  );
  await writeJson(path.resolve(output), catalog);
  return catalog;
}

async function validate(value, schemaPath, label) {
  const schema = await readJson(path.join(ROOT, schemaPath));
  const check = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!check(value))
    throw new Error(`${label} invalid: ${JSON.stringify(check.errors)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "qualification-set",
    "release-evidence",
    "release-tag",
    "base-url",
    "output",
  ]);
  await buildReleaseCatalog({
    qualificationSetPath: path.resolve(args["qualification-set"]),
    releaseEvidencePath: path.resolve(args["release-evidence"]),
    releaseTag: args["release-tag"],
    baseUrl: args["base-url"],
    output: path.resolve(args.output),
  });
}
