import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { shaFile, writeJson } from "../../build/lib/files.mjs";
import { assembleHostConstructionResult } from "../../release/hosted-host-construction-result.mjs";
import {
  ordinaryFileIdentity,
  validateArtifact,
} from "../../release/release-contract.mjs";

const RESULT_SCHEMA =
  "contracts/release/hosted-host-construction-result-v3.schema.json";

test("host construction truthfully retains first-profile and pre-build failures", async () => {
  const temporary = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-host-construction-"),
    ),
    commit = "1".repeat(40),
    sourceAdmission = path.join(temporary, "source-admission.json"),
    releaseAdmissionVerification = path.join(
      temporary,
      "release-admission-verification.json",
    );
  try {
    await writeJson(sourceAdmission, admissionFixture(commit));
    await writeJson(
      releaseAdmissionVerification,
      verificationFixture(commit, await ordinaryFileIdentity(sourceAdmission)),
    );
    const failed = await assembleHostConstructionResult({
      sourceAdmission,
      releaseAdmissionVerification,
      workflowCheckoutCommit: commit,
      builds: [
        {
          profileId: "english",
          attempted: true,
          failureCategory: "host-build-failed",
        },
      ],
      output: path.join(temporary, "failed.json"),
    });
    assert.equal(failed.decision, "fail");
    assert.deepEqual(
      failed.profiles.map((profile) => ({
        profileId: profile.profileId,
        attempted: profile.attempted,
        outcome: profile.outcome,
        failureCategory: profile.failureCategory,
      })),
      [
        {
          profileId: "english",
          attempted: true,
          outcome: "failed",
          failureCategory: "host-build-failed",
        },
        {
          profileId: "chinese",
          attempted: false,
          outcome: "unattempted",
          failureCategory: "prior-profile-failed",
        },
      ],
    );
    await assert.rejects(
      validateArtifact(
        { ...failed, decision: "pass" },
        RESULT_SCHEMA,
        "contradictory hosted result",
      ),
    );
    const contradictoryOutcome = structuredClone(failed);
    contradictoryOutcome.profiles[0].completed = true;
    await assert.rejects(
      validateArtifact(
        contradictoryOutcome,
        RESULT_SCHEMA,
        "contradictory profile outcome",
      ),
    );
    const blocked = await assembleHostConstructionResult({
      sourceAdmission,
      releaseAdmissionVerification,
      workflowCheckoutCommit: commit,
      builds: [],
      output: path.join(temporary, "blocked.json"),
    });
    assert.equal(blocked.decision, "blocked");
    assert.ok(blocked.profiles.every((profile) => !profile.attempted));
    const builds = [];
    for (const [profileId, closureDigit] of [
      ["english", "6"],
      ["chinese", "7"],
    ]) {
      const archive = path.join(temporary, `${profileId}.zip`);
      await fs.writeFile(archive, profileId);
      const archiveIdentity = {
          fileName: `${profileId}.zip`,
          sizeBytes: profileId.length,
          sha256: await shaFile(archive),
        },
        reportPath = path.join(temporary, `${profileId}-build.json`),
        verificationPath = path.join(
          temporary,
          `${profileId}-verification.json`,
        ),
        report = buildReportFixture(
          profileId,
          commit,
          closureDigit.repeat(64),
          archiveIdentity,
        );
      await writeJson(reportPath, report);
      await writeJson(verificationPath, {
        schemaVersion: 2,
        hostPackageId: report.hostPackageId,
        hostRoot: "host",
        archiveSha256: archiveIdentity.sha256,
        descriptorSha256: report.descriptor.sha256,
        fileManifestSha256: report.fileManifest.sha256,
        extractedSizeBytes: report.archive.extractedSizeBytes,
        entryCount: report.archive.entryCount,
        modesVerified: true,
        descriptorSchemaValid: true,
        fileManifestSchemaValid: true,
        modelPayloadAbsent: true,
      });
      builds.push({
        profileId,
        attempted: true,
        archive,
        buildReport: reportPath,
        hostVerification: verificationPath,
        focusedProfile: {
          profileId,
          hostArchive: archiveIdentity,
          hostSourceClosureSha256: closureDigit.repeat(64),
        },
      });
    }
    const passingAdmission = admissionFixture(commit);
    for (const profile of passingAdmission.profiles)
      profile.hostArchive = builds.find(
        (build) => build.profileId === profile.profileId,
      ).focusedProfile.hostArchive;
    await writeJson(sourceAdmission, passingAdmission);
    await writeJson(
      releaseAdmissionVerification,
      verificationFixture(commit, await ordinaryFileIdentity(sourceAdmission)),
    );
    const passed = await assembleHostConstructionResult({
      sourceAdmission,
      releaseAdmissionVerification,
      workflowCheckoutCommit: commit,
      builds,
      output: path.join(temporary, "passed.json"),
    });
    assert.equal(passed.decision, "pass");
    assert.ok(
      passed.profiles.every(
        (profile) =>
          profile.completed &&
          profile.details.hostVerification.sha256.length === 64 &&
          profile.details.executionCounts.providersLaunched === 0,
      ),
    );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

function admissionFixture(commit) {
  const identity = (fileName, digit) => ({
    fileName,
    sizeBytes: 1,
    sha256: digit.repeat(64),
  });
  return {
    schemaVersion: 4,
    artifactKind: "release-source-admission",
    focusedSourceCommit: commit,
    admittedSourceCommit: commit,
    sourceClosurePolicy: identity("relevant-source-closure-v2.json", "d"),
    currentReleaseMatrix: identity("current-release-matrix-v2.json", "e"),
    ancestryVerified: true,
    changedPaths: [],
    changedPathsSha256: "0".repeat(64),
    focusedQualificationSet: identity("focused-qualification-set-v3.json", "1"),
    branchCatalogProjection: identity("branch-catalog-projection-v3.json", "2"),
    branchCatalogProjectionVerification: identity(
      "branch-catalog-projection-verification-v3.json",
      "3",
    ),
    englishExecutionClosure: identity(
      "english-profile-execution-closure-v2.json",
      "4",
    ),
    chineseExecutionClosure: identity(
      "chinese-profile-execution-closure-v2.json",
      "5",
    ),
    profiles: [
      admissionProfile("english", "6"),
      admissionProfile("chinese", "7"),
    ],
    decision: "reuse-permitted",
  };
}

function admissionProfile(profileId, closureDigit) {
  const identity = (fileName, digit) => ({
    fileName,
    sizeBytes: 1,
    sha256: digit.repeat(64),
  });
  return {
    profileId,
    hostPackageId: `voice.host.${profileId}`,
    providerId: `provider.${profileId}`,
    modelAssetId: `model.${profileId}`,
    hostArchive: identity(`${profileId}.zip`, "8"),
    hostDescriptorSha256: "9".repeat(64),
    hostFileManifestSha256: "a".repeat(64),
    modelAdmissionRootSha256: "b".repeat(64),
    modelManifest: identity(`${profileId}-model.json`, "c"),
    compatibilityPairSha256: "d".repeat(64),
    focusedHostSourceClosure: {
      sizeBytes: 1,
      sha256: closureDigit.repeat(64),
    },
    admittedHostSourceClosure: {
      sizeBytes: 1,
      sha256: closureDigit.repeat(64),
    },
    equal: true,
  };
}

function verificationFixture(commit, sourceAdmission) {
  const protectedNames = [
    "release/admission/v1.0.0-branch-catalog-projection-v3.json",
    "release/admission/v1.0.0-branch-catalog-projection-verification-v3.json",
    "release/admission/v1.0.0-chinese-profile-execution-closure-v2.json",
    "release/admission/v1.0.0-english-profile-execution-closure-v2.json",
    "release/admission/v1.0.0-focused-qualification-set-v3.json",
    "release/admission/v1.0.0-release-source-admission-v4.json",
  ];
  const checks = Object.fromEntries(
    [
      "focusedAncestorOfAdmitted",
      "admittedAncestorOfPromotion",
      "promotionSingleParent",
      "promotionDirectChild",
      "promotionExactAdditions",
      "promotionUnique",
      "promotionAncestorOfWorkflow",
      "workflowCheckoutVerified",
      "maintainedMainVerified",
      "protectedMembersImmutable",
    ].map((key) => [key, true]),
  );
  return {
    schemaVersion: 1,
    artifactKind: "release-admission-verification",
    releaseSourceAdmission: sourceAdmission,
    focusedSourceCommit: commit,
    admittedSourceCommit: commit,
    authorityPromotionCommit: commit,
    workflowCheckoutCommit: commit,
    sourceClosurePolicy: {
      fileName: "relevant-source-closure-v2.json",
      sizeBytes: 1,
      sha256: "d".repeat(64),
    },
    protectedMembers: protectedNames.map((fileName, index) => ({
      fileName,
      sizeBytes: 1,
      sha256: `${index + 1}`.repeat(64),
    })),
    admittedRange: {
      changedPaths: [],
      changedPathsSha256: "0".repeat(64),
      decision: "reuse-permitted",
    },
    postPromotionRange: {
      changedPaths: [],
      changedPathsSha256: "0".repeat(64),
      decision: "reuse-permitted",
    },
    profiles: [
      verificationProfile("english", "6"),
      verificationProfile("chinese", "7"),
    ],
    checks,
    decision: "pass",
  };
}

function verificationProfile(profileId, digit) {
  const closure = { sizeBytes: 1, sha256: digit.repeat(64) };
  return {
    profileId,
    focusedHostSourceClosure: closure,
    admittedHostSourceClosure: closure,
    workflowHostSourceClosure: closure,
    focusedToAdmittedEqual: true,
    admittedToWorkflowEqual: true,
  };
}

function buildReportFixture(profileId, commit, closure, archive) {
  const identity = (fileName, digit) => ({
    fileName,
    sizeBytes: 1,
    sha256: digit.repeat(64),
  });
  return {
    schemaVersion: 2,
    artifactKind: "host-build-report",
    profileId,
    sourceCommit: commit,
    hostSourceClosure: {
      fileName: "host-source-closure-v1.json",
      sizeBytes: 1,
      sha256: closure,
    },
    archive: { ...archive, extractedSizeBytes: 2, entryCount: 2 },
    descriptor: identity("runtime-host-v2.json", "1"),
    fileManifest: identity("host-files-v2.json", "2"),
    noticeInventory: identity("THIRD_PARTY_NOTICES.json", "3"),
    modelAdmissionRoot: identity("model-admission-root-v1.json", "4"),
    compatibilityRequirement: identity(
      "model-compatibility-requirement-v1.json",
      "5",
    ),
    productTestsExecuted: 0,
    recipe: identity("recipe.json", "6"),
    inputManifest: identity("inputs.json", "7"),
    inputProvenance: identity("provenance.json", "8"),
    hostBuildEnvironment: identity("environment.json", "9"),
    toolProvenance: identity("tools.json", "a"),
    hostPackageId: `voice.host.${profileId}`,
    providerId: `provider.${profileId}`,
    modelAssetId: `model.${profileId}`,
    packageVersion: "1.0.0",
    target: { platform: "darwin", architecture: "arm64" },
    launcher: identity("voice-provider", "b"),
    modelManager: identity("voice-model-manager", "c"),
    modelBytesDownloaded: 0,
    providersLaunched: 0,
  };
}
