#!/usr/bin/env node
import { parsePairs } from "../build/lib/files.mjs";
import {
  deepEqual,
  ordinaryFileIdentity,
  readValidated,
  writeArtifact,
} from "./release-contract.mjs";

export async function verifyBranchProjection({
  qualificationSet,
  projection,
  output,
}) {
  const qset = await readValidated(
      qualificationSet,
      "contracts/release/focused-qualification-set-v3.schema.json",
      "Focused Qualification Set 3",
    ),
    value = await readValidated(
      projection,
      "contracts/catalog/branch-catalog-projection-v3.schema.json",
      "Branch Catalog Projection 3",
    ),
    qsetIdentity = await ordinaryFileIdentity(
      qualificationSet,
      "focused-qualification-set-v3.json",
    );
  if (
    qset.decision !== "pass" ||
    value.decision !== "pass" ||
    value.sourceCommit !== qset.sourceCommit ||
    !deepEqual(value.qualificationSet, qsetIdentity) ||
    !deepEqual(value.profiles, qset.profiles)
  )
    throw new Error("Branch Catalog Projection 3 verification failed.");
  return writeArtifact(
    output,
    {
      schemaVersion: 3,
      artifactKind: "branch-catalog-projection-verification",
      projection: await ordinaryFileIdentity(
        projection,
        "branch-catalog-projection-v3.json",
      ),
      sourceCommit: value.sourceCommit,
      profileCount: 2,
      decision: "pass",
    },
    "contracts/catalog/branch-catalog-projection-verification-v3.schema.json",
    "Branch Catalog Projection Verification 3",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "qualification-set",
    "projection",
    "output",
  ]);
  await verifyBranchProjection({
    qualificationSet: args["qualification-set"],
    projection: args.projection,
    output: args.output,
  });
}
