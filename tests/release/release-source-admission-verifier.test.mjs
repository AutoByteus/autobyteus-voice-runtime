import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { writeJson } from "../../build/lib/files.mjs";
import {
  canonicalDigest,
  ordinaryFileIdentity,
} from "../../release/release-contract.mjs";
import { verifyReleaseSourceAdmission } from "../../release/verify-release-source-admission.mjs";

const run = promisify(execFile),
  root = path.resolve(import.meta.dirname, "../..");

test("release admission reopens and cross-binds every focused authority", async () => {
  const repository = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-admission-"),
  );
  try {
    await fs.mkdir(path.join(repository, "contracts/release"), {
      recursive: true,
    });
    await fs.copyFile(
      path.join(root, "contracts/release/relevant-source-closure-v2.json"),
      path.join(
        repository,
        "contracts/release/relevant-source-closure-v2.json",
      ),
    );
    for (const args of [
      ["init", "-q"],
      ["config", "user.email", "test@example.invalid"],
      ["config", "user.name", "Test"],
      ["add", "."],
      ["commit", "-qm", "fixture"],
    ])
      await run("git", args, { cwd: repository });
    const commit = (
        await run("git", ["rev-parse", "HEAD"], { cwd: repository })
      ).stdout.trim(),
      qsetPath = path.join(repository, "qset.json"),
      projectionPath = path.join(repository, "projection.json"),
      verificationPath = path.join(repository, "projection-verification.json"),
      profiles = [
        profileFixture("english", "1"),
        profileFixture("chinese", "2"),
      ];
    await writeJson(qsetPath, {
      schemaVersion: 3,
      artifactKind: "focused-qualification-set",
      sourceCommit: commit,
      decision: "pass",
      profiles,
    });
    await writeJson(projectionPath, {
      schemaVersion: 3,
      artifactKind: "branch-catalog-projection",
      sourceCommit: commit,
      qualificationSet: await ordinaryFileIdentity(qsetPath),
      profiles,
      decision: "pass",
    });
    await writeJson(verificationPath, {
      schemaVersion: 3,
      artifactKind: "branch-catalog-projection-verification",
      projection: await ordinaryFileIdentity(projectionPath),
      sourceCommit: commit,
      profileCount: 2,
      decision: "pass",
    });
    const closurePaths = [];
    for (const profileId of ["english", "chinese"]) {
      const file = path.join(repository, `${profileId}-closure.json`);
      await writeJson(file, executionClosureFixture(profileId, commit));
      closurePaths.push(file);
    }
    const admissionPath = path.join(repository, "admission.json"),
      admission = {
        schemaVersion: 3,
        artifactKind: "release-source-admission",
        focusedSourceCommit: commit,
        finalMainCommit: commit,
        ancestryVerified: true,
        changedPaths: [],
        changedPathsSha256: canonicalDigest([]),
        qualificationSet: await ordinaryFileIdentity(qsetPath),
        branchProjection: await ordinaryFileIdentity(projectionPath),
        projectionVerification: await ordinaryFileIdentity(verificationPath),
        executionClosureVerifications: await Promise.all(
          closurePaths.map((file) => ordinaryFileIdentity(file)),
        ),
        profiles: profiles.map((profile) => ({
          profileId: profile.profileId,
          focusedHostSourceClosureSha256: profile.hostSourceClosureSha256,
          finalHostSourceClosureSha256: profile.hostSourceClosureSha256,
          equal: true,
        })),
        decision: "reuse-permitted",
      };
    await writeJson(admissionPath, admission);
    await verifyReleaseSourceAdmission({
      repository,
      admission: admissionPath,
      finalMainCommit: commit,
    });
    await fs.appendFile(qsetPath, " ");
    await assert.rejects(
      verifyReleaseSourceAdmission({
        repository,
        admission: admissionPath,
        finalMainCommit: commit,
      }),
      /identity differs/,
    );
  } finally {
    await fs.rm(repository, { recursive: true, force: true });
  }
});

function profileFixture(profileId, digit) {
  const identity = (fileName, value) => ({
    fileName,
    sizeBytes: 1,
    sha256: value.repeat(64),
  });
  return {
    profileId,
    hostArchive: identity(`${profileId}.zip`, digit),
    hostSourceClosureSha256: digit.repeat(64),
    modelAdmissionRootSha256: "3".repeat(64),
    modelManifest: identity(`${profileId}-model.json`, "4"),
    compatibilityPairSha256: "5".repeat(64),
    hostDescriptorSha256: "6".repeat(64),
    hostFileManifestSha256: "7".repeat(64),
    hostSourceClosureSizeBytes: 1,
  };
}

function executionClosureFixture(profileId, commit) {
  const execution = {
    sourceCommit: commit,
    inferenceCoreSha256: "1".repeat(64),
    configurationSha256: "2".repeat(64),
    modelManifestSha256: "3".repeat(64),
    trustedOutputSha256: "4".repeat(64),
  };
  return {
    schemaVersion: 2,
    artifactKind: "profile-execution-closure",
    profileId,
    historical: execution,
    current: execution,
    adapterExclusions: ["catalog-and-install-paths"],
    comparison: {
      inferenceCoreEqual: true,
      pathNeutralConfigurationEqual: true,
      modelIdentityEqual: true,
      outputEvidenceEqual: true,
      adapterExclusionsExact: true,
    },
    decision: "reuse-permitted",
  };
}
