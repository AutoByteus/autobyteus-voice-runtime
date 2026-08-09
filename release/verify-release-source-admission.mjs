#!/usr/bin/env node
import path from "node:path";
import { parsePairs } from "../build/lib/files.mjs";
import {
  canonicalDigest,
  compareNames,
  deepEqual,
  ordinaryFileIdentity,
  readValidated,
} from "./release-contract.mjs";
import {
  changedSourcePaths,
  isAncestor,
  loadSourceClosurePolicy,
  sourceClosureDecision,
} from "./source-closure.mjs";

export async function verifyReleaseSourceAdmission({
  repository,
  admission,
  finalMainCommit,
}) {
  const value = await readValidated(
      admission,
      "contracts/release/release-source-admission-v3.schema.json",
      "Release Source Admission 3",
    ),
    { value: policy } = await loadSourceClosurePolicy({ repository }),
    ancestryVerified = await isAncestor(
      repository,
      value.focusedSourceCommit,
      finalMainCommit,
    ),
    changedPaths = await changedSourcePaths({
      repository,
      from: value.focusedSourceCommit,
      to: finalMainCommit,
      policy,
    }),
    evidence = await verifyBoundEvidence(
      value,
      path.dirname(path.resolve(admission)),
    );
  if (
    value.decision !== "reuse-permitted" ||
    value.finalMainCommit !== finalMainCommit ||
    !value.ancestryVerified ||
    !ancestryVerified ||
    !deepEqual(value.changedPaths, changedPaths) ||
    value.changedPathsSha256 !== canonicalDigest(changedPaths) ||
    value.profiles.length !== 2 ||
    value.profiles.some(
      (profile) =>
        !profile.equal ||
        profile.focusedHostSourceClosureSha256 !==
          profile.finalHostSourceClosureSha256,
    ) ||
    sourceClosureDecision(changedPaths) !== "reuse-permitted" ||
    !evidence
  )
    throw new Error(
      "Release Source Admission 3 independent verification failed.",
    );
  return value;
}

async function verifyBoundEvidence(admission, directory) {
  const open = async (identity, schema, label) => {
      const file = path.join(directory, identity.fileName),
        observed = await ordinaryFileIdentity(file);
      if (!deepEqual(observed, identity))
        throw new Error(`${label} identity differs from source admission.`);
      return readValidated(file, schema, label);
    },
    qset = await open(
      admission.qualificationSet,
      "contracts/release/focused-qualification-set-v3.schema.json",
      "Focused Qualification Set 3",
    ),
    projection = await open(
      admission.branchProjection,
      "contracts/catalog/branch-catalog-projection-v3.schema.json",
      "Branch Catalog Projection 3",
    ),
    verification = await open(
      admission.projectionVerification,
      "contracts/catalog/branch-catalog-projection-verification-v3.schema.json",
      "Branch Catalog Projection Verification 3",
    ),
    expectedProfiles = qset.profiles.map((profile) => ({
      profileId: profile.profileId,
      focusedHostSourceClosureSha256: profile.hostSourceClosureSha256,
      finalHostSourceClosureSha256: profile.hostSourceClosureSha256,
      equal: true,
    }));
  if (
    qset.decision !== "pass" ||
    projection.decision !== "pass" ||
    verification.decision !== "pass" ||
    qset.sourceCommit !== admission.focusedSourceCommit ||
    projection.sourceCommit !== admission.focusedSourceCommit ||
    verification.sourceCommit !== admission.focusedSourceCommit ||
    !sameBytes(projection.qualificationSet, admission.qualificationSet) ||
    !deepEqual(projection.profiles, qset.profiles) ||
    !sameBytes(verification.projection, admission.branchProjection) ||
    !deepEqual(admission.profiles, expectedProfiles)
  )
    throw new Error(
      "Release source admission aggregate evidence is inconsistent.",
    );
  const closureProfiles = [];
  for (const identity of admission.executionClosureVerifications) {
    const closure = await open(
      identity,
      "contracts/qualification/profile-execution-closure-v2.schema.json",
      "Profile Execution Closure 2",
    );
    if (
      closure.decision !== "reuse-permitted" ||
      closure.current.sourceCommit !== admission.focusedSourceCommit
    )
      throw new Error("Release source admission execution closure is invalid.");
    closureProfiles.push(closure.profileId);
  }
  closureProfiles.sort(compareNames);
  if (!deepEqual(closureProfiles, ["chinese", "english"]))
    throw new Error(
      "Release source admission execution profiles are incomplete.",
    );
  return true;
}

function sameBytes(left, right) {
  return left.sizeBytes === right.sizeBytes && left.sha256 === right.sha256;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "repository",
    "admission",
    "final-main-commit",
  ]);
  await verifyReleaseSourceAdmission({
    repository: args.repository,
    admission: args.admission,
    finalMainCommit: args["final-main-commit"],
  });
}
