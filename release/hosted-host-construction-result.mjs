#!/usr/bin/env node
import path from "node:path";
import { parsePairs } from "../build/lib/files.mjs";
import {
  deepEqual,
  ordinaryFileIdentity,
  readValidated,
  writeArtifact,
} from "./release-contract.mjs";

export async function assembleHostConstructionResult({
  sourceAdmission,
  finalMainCommit,
  builds,
  output,
}) {
  const admission = await readValidated(
    sourceAdmission,
    "contracts/release/release-source-admission-v3.schema.json",
    "Release Source Admission 3",
  );
  if (
    admission.decision !== "reuse-permitted" ||
    admission.finalMainCommit !== finalMainCommit
  )
    throw new Error("Host construction requires admitted final main.");
  const profiles = [];
  for (const profileId of ["english", "chinese"]) {
    const item = builds.find((candidate) => candidate.profileId === profileId);
    if (!item || item.failureCategory) {
      profiles.push({
        profileId,
        attempted: Boolean(item?.attempted),
        completed: false,
        outcome: item?.failureCategory ? "failed" : "unattempted",
        failureCategory: item?.failureCategory ?? "prior-profile-failed",
        details: null,
      });
      continue;
    }
    const report = await readValidated(
        item.buildReport,
        "contracts/build/host-build-report-v2.schema.json",
        "Host Build Report 2",
      ),
      verification = await readValidated(
        item.hostVerification,
        "contracts/build/host-verification-v2.schema.json",
        "Host Verification 2",
      ),
      focused = item.focusedProfile,
      hostedArchive = await ordinaryFileIdentity(item.archive),
      admittedProfile = admission.profiles.find(
        (profile) => profile.profileId === profileId,
      );
    if (
      !admittedProfile ||
      report.sourceCommit !== finalMainCommit ||
      report.profileId !== profileId ||
      focused.profileId !== profileId ||
      !deepEqual(report.archive, {
        ...hostedArchive,
        extractedSizeBytes: report.archive.extractedSizeBytes,
        entryCount: report.archive.entryCount,
      }) ||
      !deepEqual(hostedArchive, focused.hostArchive) ||
      report.hostSourceClosure.sha256 !== focused.hostSourceClosureSha256 ||
      report.hostSourceClosure.sha256 !==
        admittedProfile.finalHostSourceClosureSha256 ||
      verification.hostPackageId !== report.hostPackageId ||
      verification.archiveSha256 !== hostedArchive.sha256 ||
      verification.descriptorSha256 !== report.descriptor.sha256 ||
      verification.fileManifestSha256 !== report.fileManifest.sha256 ||
      verification.extractedSizeBytes !== report.archive.extractedSizeBytes ||
      verification.entryCount !== report.archive.entryCount ||
      report.productTestsExecuted !== 0 ||
      report.modelBytesDownloaded !== 0 ||
      report.providersLaunched !== 0
    )
      throw new Error("Hosted host differs from focused host authority.");
    profiles.push({
      profileId,
      attempted: true,
      completed: true,
      outcome: "succeeded",
      failureCategory: null,
      details: {
        focusedSourceCommit: admission.focusedSourceCommit,
        buildReport: await ordinaryFileIdentity(item.buildReport),
        hostVerification: await ordinaryFileIdentity(item.hostVerification),
        focusedArchive: focused.hostArchive,
        hostedArchive,
        wholeArchiveEqual: true,
        focusedHostSourceClosureSha256: focused.hostSourceClosureSha256,
        hostedHostSourceClosureSha256: report.hostSourceClosure.sha256,
        closureEqual: true,
        provenance: {
          recipe: report.recipe,
          inputManifest: report.inputManifest,
          inputProvenance: report.inputProvenance,
          hostBuildEnvironment: report.hostBuildEnvironment,
          toolProvenance: report.toolProvenance,
          hostSourceClosure: report.hostSourceClosure,
          modelAdmissionRoot: report.modelAdmissionRoot,
          compatibilityRequirement: report.compatibilityRequirement,
          descriptor: report.descriptor,
          fileManifest: report.fileManifest,
          noticeInventory: report.noticeInventory,
        },
        executionCounts: {
          productTestsExecuted: 0,
          modelBytesDownloaded: 0,
          providersLaunched: 0,
        },
      },
    });
  }
  const decision = profiles.every((profile) => profile.outcome === "succeeded")
    ? "pass"
    : profiles.some((profile) => profile.outcome === "failed")
      ? "fail"
      : "blocked";
  return writeArtifact(
    output,
    {
      schemaVersion: 2,
      artifactKind: "hosted-host-construction-result",
      sourceAdmission: await ordinaryFileIdentity(sourceAdmission),
      finalMainCommit,
      runner: { label: "macos-26", platform: "darwin", architecture: "arm64" },
      profiles,
      decision,
    },
    "contracts/release/hosted-host-construction-result-v2.schema.json",
    "Hosted Host Construction Result 2",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "source-admission",
    "final-main-commit",
    "english-build",
    "english-archive",
    "english-verification",
    "english-focused-profile",
    "chinese-build",
    "chinese-archive",
    "chinese-verification",
    "chinese-focused-profile",
    "output",
  ]);
  const readProfile = async (file) =>
    (await import("../build/lib/files.mjs")).readJson(path.resolve(file));
  await assembleHostConstructionResult({
    sourceAdmission: args["source-admission"],
    finalMainCommit: args["final-main-commit"],
    builds: [
      {
        profileId: "english",
        buildReport: args["english-build"],
        archive: args["english-archive"],
        hostVerification: args["english-verification"],
        focusedProfile: await readProfile(args["english-focused-profile"]),
      },
      {
        profileId: "chinese",
        buildReport: args["chinese-build"],
        archive: args["chinese-archive"],
        hostVerification: args["chinese-verification"],
        focusedProfile: await readProfile(args["chinese-focused-profile"]),
      },
    ],
    output: args.output,
  });
}
