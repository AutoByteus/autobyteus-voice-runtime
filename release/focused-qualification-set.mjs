#!/usr/bin/env node
import path from "node:path";
import { parsePairs, readJson, shaFile } from "../build/lib/files.mjs";
import { loadCurrentReleaseMatrix } from "./current-release-matrix.mjs";
import {
  compareNames,
  ordinaryFileIdentity,
  readValidated,
  writeArtifact,
} from "./release-contract.mjs";

export async function assembleFocusedQualificationSet({
  sourceCommit,
  profileInputs,
  output,
}) {
  if (!/^(?!0{40})[a-f0-9]{40}$/.test(sourceCommit))
    throw new Error("Focused source commit is invalid.");
  const matrix = await loadCurrentReleaseMatrix(),
    profiles = [];
  for (const file of profileInputs) {
    const value = await readJson(path.resolve(file)),
      closure = await readValidated(
        value.executionClosureVerificationPath,
        "contracts/qualification/profile-execution-closure-v2.schema.json",
        "Profile Execution Closure 2",
      );
    if (
      closure.profileId !== value.profileId ||
      closure.current.sourceCommit !== sourceCommit ||
      closure.decision !== "reuse-permitted" ||
      (await shaFile(value.executionClosureVerificationPath)) !==
        value.executionClosureVerificationSha256
    )
      throw new Error("Focused profile execution authority mismatch.");
    profiles.push({
      profileId: value.profileId,
      hostArchive: await ordinaryFileIdentity(value.hostArchivePath),
      hostSourceClosureSha256: value.hostSourceClosureSha256,
      hostSourceClosureSizeBytes: value.hostSourceClosureSizeBytes,
      hostDescriptorSha256: value.hostDescriptorSha256,
      hostFileManifestSha256: value.hostFileManifestSha256,
      modelAdmissionRootSha256: value.modelAdmissionRootSha256,
      modelManifest: await ordinaryFileIdentity(value.modelManifestPath),
      compatibilityPairSha256: value.compatibilityPairSha256,
    });
  }
  profiles.sort((left, right) => compareNames(left.profileId, right.profileId));
  if (
    profiles.length !== 2 ||
    matrix.value.entries.some(
      (entry) =>
        !profiles.some(
          (profile) =>
            profile.profileId === entry.profileId &&
            profile.modelManifest.fileName === entry.modelManifest.fileName &&
            profile.modelManifest.sha256 === entry.modelManifest.sha256 &&
            profile.modelAdmissionRootSha256 ===
              entry.modelAdmissionRoot.sha256,
        ),
    )
  )
    throw new Error("Focused qualification does not match Matrix 2.");
  return writeArtifact(
    output,
    {
      schemaVersion: 3,
      artifactKind: "focused-qualification-set",
      sourceCommit,
      decision: "pass",
      profiles,
    },
    "contracts/release/focused-qualification-set-v3.schema.json",
    "Focused Qualification Set 3",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "source-commit",
    "english",
    "chinese",
    "output",
  ]);
  await assembleFocusedQualificationSet({
    sourceCommit: args["source-commit"],
    profileInputs: [args.english, args.chinese],
    output: args.output,
  });
}
