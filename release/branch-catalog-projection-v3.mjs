#!/usr/bin/env node
import { parsePairs } from "../build/lib/files.mjs";
import {
  ordinaryFileIdentity,
  readValidated,
  writeArtifact,
} from "./release-contract.mjs";

export async function projectBranchCatalog({ qualificationSet, output }) {
  const qset = await readValidated(
    qualificationSet,
    "contracts/release/focused-qualification-set-v3.schema.json",
    "Focused Qualification Set 3",
  );
  if (qset.decision !== "pass")
    throw new Error("Branch projection requires passing focused evidence.");
  return writeArtifact(
    output,
    {
      schemaVersion: 3,
      artifactKind: "branch-catalog-projection",
      sourceCommit: qset.sourceCommit,
      qualificationSet: await ordinaryFileIdentity(
        qualificationSet,
        "focused-qualification-set-v3.json",
      ),
      profiles: qset.profiles,
      decision: "pass",
    },
    "contracts/catalog/branch-catalog-projection-v3.schema.json",
    "Branch Catalog Projection 3",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "qualification-set",
    "output",
  ]);
  await projectBranchCatalog({
    qualificationSet: args["qualification-set"],
    output: args.output,
  });
}
