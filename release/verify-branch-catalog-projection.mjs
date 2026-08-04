#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import { composeCatalogEntryIdentity } from "./catalog-entry-identity.mjs";
import {
  assertExactMatrixRows,
  loadCurrentReleaseMatrix,
  matrixEntryKey,
} from "./current-release-matrix.mjs";
import {
  providerArchiveSetDigest,
  verifyExactProviderArchiveSet,
} from "./provider-archive-set.mjs";

export async function verifyBranchCatalogProjection({
  projectionPath,
  qualificationSetPath,
  assets,
  output,
}) {
  const result = {
    schemaVersion: 2,
    decision: "fail",
    failureCategory: null,
    releaseMatrixSha256: null,
    qualificationSetSha256: null,
    projectionSha256: null,
    assetSetSha256: null,
  };
  let work;
  try {
    const matrix = await loadCurrentReleaseMatrix();
    result.releaseMatrixSha256 = matrix.sha256;
    result.qualificationSetSha256 = await shaFile(qualificationSetPath);
    result.projectionSha256 = await shaFile(projectionPath);
    const projection = await readJson(projectionPath),
      qset = await readJson(qualificationSetPath);
    result.assetSetSha256 = projection.assetSet?.sha256 ?? null;
    await validateArtifact(
      qset,
      "contracts/release/qualification-set-v2.schema.json",
      "Qualification Set",
    );
    await validateArtifact(
      projection,
      "contracts/catalog/branch-catalog-projection-v2.schema.json",
      "Branch Catalog Projection",
    );
    if (
      qset.functionalDecision !== "pass" ||
      qset.releaseMatrix.matrixId !== matrix.value.matrixId ||
      qset.releaseMatrix.sha256 !== matrix.sha256 ||
      JSON.stringify(qset.profileResourcePolicy) !==
        JSON.stringify(matrix.value.profileResourcePolicy)
    )
      throw categorized("qualification-set-mismatch");
    assertExactMatrixRows(matrix.value, qset.profiles);
    const items = await verifyExactProviderArchiveSet(
        assets,
        qset.profiles.map((profile) => profile.archive),
      ),
      entries = [];
    for (const matrixEntry of matrix.value.entries) {
      const profile = qset.profiles.find(
        (item) => matrixEntryKey(item) === matrixEntryKey(matrixEntry),
      );
      entries.push(await composeCatalogEntryIdentity(matrixEntry, profile));
    }
    const expectedProjection = {
      schemaVersion: 2,
      artifactKind: "branch-catalog-projection",
      sourceCommit: qset.sourceCommit,
      packageVersion: qset.packageVersion,
      releaseMatrix: qset.releaseMatrix,
      profileResourcePolicy: qset.profileResourcePolicy,
      qualificationSet: {
        fileName: "qualification-set-v2.json",
        sha256: result.qualificationSetSha256,
      },
      performanceAssessments: qset.profiles.map(
        ({ profileId, performanceAssessment }) => ({
          profileId,
          ...performanceAssessment,
        }),
      ),
      entries,
      assetSet: { sha256: providerArchiveSetDigest(items), items },
    };
    work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-branch-projection-"));
    const expectedPath = path.join(work, "projection.json");
    await writeJson(expectedPath, expectedProjection);
    if (
      !Buffer.from(await fs.readFile(projectionPath)).equals(
        await fs.readFile(expectedPath),
      )
    )
      throw categorized("projection-byte-mismatch");
    result.decision = "pass";
  } catch (error) {
    result.failureCategory = error.failureCategory ?? classify(error);
  } finally {
    if (work) await fs.rm(work, { recursive: true, force: true });
  }
  const schema = await readJson(
    path.join(
      ROOT,
      "contracts/catalog/branch-catalog-projection-verification-v2.schema.json",
    ),
  );
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(
    schema,
  );
  if (!validate(result))
    throw new Error(
      `Branch projection result invalid: ${JSON.stringify(validate.errors)}`,
    );
  await writeJson(path.resolve(output), result);
  if (result.decision !== "pass") {
    const error = new Error(
      `Branch projection verification failed: ${result.failureCategory}`,
    );
    error.code = "BRANCH_PROJECTION_FAILED";
    throw error;
  }
  return result;
}

async function validateArtifact(value, schemaPath, label) {
  const schema = await readJson(path.join(ROOT, schemaPath)),
    validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!validate(value))
    throw new Error(`${label} invalid: ${JSON.stringify(validate.errors)}`);
}

function categorized(failureCategory) {
  const error = new Error(failureCategory);
  error.failureCategory = failureCategory;
  return error;
}

function classify(error) {
  const message = String(error?.message ?? error);
  if (/ENOENT|missing/i.test(message)) return "input-missing";
  if (/schema|invalid/i.test(message)) return "schema-invalid";
  if (/archive|asset/i.test(message)) return "asset-mismatch";
  if (/matrix/i.test(message)) return "matrix-mismatch";
  if (/qualification/i.test(message)) return "qualification-set-mismatch";
  return "projection-recomputation-failed";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "projection",
    "qualification-set",
    "assets",
    "output",
  ]);
  await verifyBranchCatalogProjection({
    projectionPath: path.resolve(args.projection),
    qualificationSetPath: path.resolve(args["qualification-set"]),
    assets: path.resolve(args.assets),
    output: path.resolve(args.output),
  });
}
