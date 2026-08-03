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
import {
  providerArchiveSetDigest,
  verifyExactProviderArchiveSet,
} from "./provider-archive-set.mjs";

export async function composeBranchCatalogProjection({
  qualificationSetPath,
  assets,
  output,
}) {
  const matrix = await loadCurrentReleaseMatrix(),
    qset = await readJson(qualificationSetPath);
  await validate(
    qset,
    "contracts/release/qualification-set-v1.schema.json",
    "Qualification Set",
  );
  if (
    qset.decision !== "pass" ||
    qset.releaseMatrix.matrixId !== matrix.value.matrixId ||
    qset.releaseMatrix.sha256 !== matrix.sha256
  )
    throw new Error("Branch projection Qualification Set binding mismatch.");
  assertExactMatrixRows(matrix.value, qset.profiles);
  const entries = [];
  for (const matrixEntry of matrix.value.entries) {
    const profile = qset.profiles.find(
      (item) => matrixEntryKey(item) === matrixEntryKey(matrixEntry),
    );
    entries.push(await composeCatalogEntryIdentity(matrixEntry, profile));
  }
  const items = await verifyExactProviderArchiveSet(
    assets,
    qset.profiles.map((profile) => profile.archive),
  );
  const result = {
    schemaVersion: 1,
    artifactKind: "branch-catalog-projection",
    sourceCommit: qset.sourceCommit,
    packageVersion: qset.packageVersion,
    releaseMatrix: qset.releaseMatrix,
    qualificationSet: {
      fileName: "qualification-set-v1.json",
      sha256: await shaFile(qualificationSetPath),
    },
    entries,
    assetSet: { sha256: providerArchiveSetDigest(items), items },
  };
  await validate(
    result,
    "contracts/catalog/branch-catalog-projection-v1.schema.json",
    "Branch Catalog Projection",
  );
  await writeJson(path.resolve(output), result);
  return result;
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
    "assets",
    "output",
  ]);
  await composeBranchCatalogProjection({
    qualificationSetPath: path.resolve(args["qualification-set"]),
    assets: path.resolve(args.assets),
    output: path.resolve(args.output),
  });
}
