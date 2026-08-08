import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  readJson,
  sha256,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";
import {
  RAW_RECOVERY_MEMBERS,
  writeRecoveryManifest,
} from "../../release/recovery-evidence.mjs";
import { aggregateAuthorityReference } from "../../release/candidate-authority.mjs";
import { canonicalObjectSha256 } from "../../release/source-closure.mjs";

const root = path.resolve(import.meta.dirname, "../.."),
  evidence = path.join(
    root,
    "tickets/done/voice-input-runtime-reliability/api-e2e-evidence",
  ),
  controllerCommit = "a".repeat(40),
  apiApprovalCommit = "b".repeat(40),
  digest = (seed) => sha256(Buffer.from(seed));

export async function qualifiedCandidateFixture() {
  const temp = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-candidate-fixture-"),
    ),
    candidate = path.join(temp, "candidate");
  await fs.mkdir(path.join(candidate, "assets"), { recursive: true });
  await fs.mkdir(path.join(candidate, "api-evidence"), { recursive: true });
  await fs.mkdir(path.join(candidate, "recovery"), { recursive: true });
  const qset = await readJson(
      path.join(evidence, "api-rev-017/aggregate/qualification-set-v2.json"),
    ),
    projection = await readJson(
      path.join(
        evidence,
        "api-rev-017/aggregate/branch-catalog-projection-v2.json",
      ),
    ),
    verification = await readJson(
      path.join(
        evidence,
        "api-rev-017/aggregate/branch-catalog-projection-verification-v2.json",
      ),
    ),
    archives = [];
  for (const profile of qset.profiles) {
    const bytes = Buffer.from(`${profile.profileId} fixture archive\n`),
      fileName = profile.archive.fileName,
      identity = { fileName, sizeBytes: bytes.length, sha256: sha256(bytes) };
    await fs.writeFile(path.join(candidate, "assets", fileName), bytes);
    Object.assign(profile.archive, identity);
    const entry = projection.entries.find(
      (item) => item.profileId === profile.profileId,
    );
    entry.archive.fileName = fileName;
    entry.archive.sha256 = identity.sha256;
    entry.archive.compressedSizeBytes = identity.sizeBytes;
    archives.push({ profileId: profile.profileId, ...identity });
  }
  const qsetPath = path.join(candidate, "qualification-set-v2.json");
  await writeJson(qsetPath, qset);
  const qsetSha256 = await shaFile(qsetPath),
    archiveItems = archives
      .map(({ profileId: _, ...item }) => item)
      .sort((left, right) =>
        Buffer.compare(Buffer.from(left.fileName), Buffer.from(right.fileName)),
      );
  projection.qualificationSet.sha256 = qsetSha256;
  projection.assetSet = {
    sha256: sha256(Buffer.from(JSON.stringify(archiveItems))),
    items: archiveItems,
  };
  const projectionPath = path.join(
    candidate,
    "branch-catalog-projection-v2.json",
  );
  await writeJson(projectionPath, projection);
  verification.qualificationSetSha256 = qsetSha256;
  verification.projectionSha256 = await shaFile(projectionPath);
  verification.assetSetSha256 = projection.assetSet.sha256;
  const verificationPath = path.join(
    candidate,
    "branch-catalog-projection-verification-v2.json",
  );
  await writeJson(verificationPath, verification);
  const aggregate = {
    qualificationSet: await identity(qsetPath, "qualification-set-v2.json"),
    branchProjection: await identity(
      projectionPath,
      "branch-catalog-projection-v2.json",
    ),
    branchProjectionVerification: await identity(
      verificationPath,
      "branch-catalog-projection-verification-v2.json",
    ),
  };
  const apiEvidence = [];
  for (const revision of ["016", "017", "018"]) {
    const apiRevision = `API-REV-${revision}`,
      fileName = `api-evidence/api-rev-${revision}-SHA256SUMS.txt`,
      file = path.join(candidate, fileName);
    await fs.writeFile(file, `${apiRevision} retained evidence\n`);
    apiEvidence.push({ apiRevision, ...(await identity(file, fileName)) });
  }
  const sourceClosures = {
      profile: {
        closureId: "profile-closure-v1",
        inventorySha256: digest("profile-inventory"),
        treeSha256: digest("profile-tree"),
      },
      qualificationAuthority: {
        closureId: "qualification-authority-closure-v1",
        inventorySha256: digest("qualification-inventory"),
        treeSha256: digest("qualification-tree"),
      },
    },
    preliminarySourceAdmission = {
      schemaVersion: 1,
      artifactKind: "preliminary-source-admission",
      policy: {
        policyId: "voice-runtime-relevant-source-closure-v1",
        fileName: "contracts/release/relevant-source-closure-v1.json",
        sha256: digest("policy"),
      },
      acceptedAuthorityCommit: apiApprovalCommit,
      reviewedControllerCommit: controllerCommit,
      acceptedAuthorityIsAncestor: true,
      acceptedAuthorityMatchesPolicy: true,
      closures: {
        accepted: sourceClosures,
        reviewed: sourceClosures,
        unchanged: { profile: true, qualificationAuthority: true },
      },
      changedPaths: [
        {
          status: "M",
          path: "release/recover-qualified-voice-archives.mjs",
          category: "release-pipeline-only",
        },
      ],
      changedPathsSha256: canonicalObjectSha256([
        {
          status: "M",
          path: "release/recover-qualified-voice-archives.mjs",
          category: "release-pipeline-only",
        },
      ]),
      decision: "reuse-permitted",
    },
    archiveRows = archives.map((item, index) => ({
      profileId: item.profileId,
      sequence: index + 1,
      outcome: "succeeded",
      build: { planned: 1, attempted: 1, completed: 1 },
      archive: {
        status: "accepted",
        fileName: item.fileName,
        expectedSizeBytes: item.sizeBytes,
        observedSizeBytes: item.sizeBytes,
        expectedSha256: item.sha256,
        observedSha256: item.sha256,
        descriptorSha256: qset.profiles.find(
          (profile) => profile.profileId === item.profileId,
        ).descriptorSha256,
        fileManifestSha256: qset.profiles.find(
          (profile) => profile.profileId === item.profileId,
        ).fileManifestSha256,
        descriptorSourceCommit: qset.sourceCommit,
        buildReportSha256: digest(`${item.profileId}-build-report`),
        provenanceSha256: digest(`${item.profileId}-provenance`),
        exactMatch: true,
      },
    })),
    execution = {
      profileBuilds: {
        planned: 2,
        attempted: 2,
        completed: 2,
        succeeded: 2,
        failed: 0,
        unattempted: 0,
      },
      providerStarts: 0,
      inferenceRequests: 0,
      corpusRuns: 0,
      coldTrials: 0,
      warmPreparationTrials: 0,
      warmRequestTrials: 0,
    };
  for (const [index, fileName] of RAW_RECOVERY_MEMBERS.entries()) {
    const file = path.join(candidate, fileName);
    if (fileName.endsWith(".log")) await fs.writeFile(file, `build ${index}\n`);
    else if (fileName.endsWith("profile-recovery-v1.json")) {
      const profileId = fileName.includes("english") ? "english" : "chinese",
        profileRecovery = archiveRows.find(
          (item) => item.profileId === profileId,
        );
      await writeJson(file, {
        schemaVersion: 1,
        qualifiedSourceCommit: qset.sourceCommit,
        releaseMatrix: qset.releaseMatrix,
        accepted: { profileId },
        profileRecovery,
      });
    } else if (fileName.endsWith("recovery-run-v1.json"))
      await writeJson(file, {
        schemaVersion: 1,
        preliminarySourceAdmission,
        execution,
      });
    else await writeJson(file, { schemaVersion: 1, sequence: index });
  }
  const evidenceManifest = await writeRecoveryManifest(candidate),
    result = {
      schemaVersion: 1,
      artifactKind: "qualified-archive-recovery-result",
      repository: "AutoByteus/autobyteus-voice-runtime",
      packageVersion: "1.0.0",
      decision: "pass",
      qualifiedAuthority: {
        sourceCommit: qset.sourceCommit,
        apiRevision: "API-REV-017",
        ...aggregate,
      },
      controller: {
        commit: controllerCommit,
        workflowPath: ".github/workflows/recover-qualified-voice-archives.yml",
        workflowSha256: digest("recovery-workflow"),
        recoveryOwnerSha256: digest("recovery-owner"),
      },
      runner: {
        status: "verified",
        ownership: "organization-managed",
        platform: "darwin",
        architecture: "arm64",
        runnerGroup: "voice-runtime-recovery",
        runnerId: "org-managed-voice-recovery-fixture",
        environmentSha256: digest("runner-environment"),
      },
      closedInputs: {
        releaseMatrixSha256: qset.releaseMatrix.sha256,
        items: archives.map((item) => ({
          profileId: item.profileId,
          recipeSha256: digest(`${item.profileId}-recipe`),
          provenanceSha256: digest(`${item.profileId}-input-provenance`),
          repositoryBuildLockSha256: digest(`${item.profileId}-lock`),
          nativeBuildEnvironmentSha256: digest("native-environment"),
          goToolchainRootTreeSha256: digest("go-root"),
        })),
      },
      profileRecoveries: archiveRows,
      execution,
      evidenceManifest,
    };
  await writeJson(
    path.join(candidate, "recovery/qualified-archive-recovery-result-v1.json"),
    result,
  );
  const aggregateRecord = {
      schemaVersion: 1,
      artifactKind: "aggregate-api-renewal",
      repository: "AutoByteus/autobyteus-voice-runtime",
      packageVersion: "1.0.0",
      reviewedSourceCommit: apiApprovalCommit,
      reviewedTestCommit: controllerCommit,
      api: {
        revision: "API-REV-999",
        decision: "pass",
        coverageReport: {
          repositoryPath:
            "tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md",
          gitBlobSha256: digest("coverage-blob"),
          contentSha256: digest("coverage-content"),
        },
        profileExecutionCount: 0,
      },
      profileClosure: sourceClosures.profile,
      retainedProfiles: archives.map((item) => ({
        profileId: item.profileId,
        archive: {
          fileName: item.fileName,
          sizeBytes: item.sizeBytes,
          sha256: item.sha256,
        },
        profileEvidence: {
          fileName: `${item.profileId}-profile-evidence.json`,
          sizeBytes: 1,
          sha256: digest(`${item.profileId}-profile-evidence`),
        },
      })),
      aggregateEvidence: {
        qualificationSet: aggregateItem(aggregate.qualificationSet),
        branchProjection: aggregateItem(aggregate.branchProjection),
        branchProjectionVerification: aggregateItem(
          aggregate.branchProjectionVerification,
        ),
      },
      qualificationAuthority: sourceClosures.qualificationAuthority,
    },
    aggregateBytes = Buffer.from(
      `${JSON.stringify(aggregateRecord, null, 2)}\n`,
    ),
    aggregateAuthority = aggregateAuthorityReference({
      record: aggregateRecord,
      bytes: aggregateBytes,
      recordCommit: apiApprovalCommit,
    }),
    authority = {
      production: false,
      repository: root,
      sourceCommit: qset.sourceCommit,
      releaseMatrix: qset.releaseMatrix,
      aggregate,
      apiEvidence,
      archives,
      preliminarySourceAdmission,
      aggregateAuthorityFixture: {
        record: aggregateRecord,
        bytes: aggregateBytes,
        reference: aggregateAuthority,
      },
    },
    promotionInput = {
      archiveRecoveryWorkflow: {
        path: ".github/workflows/recover-qualified-voice-archives.yml",
        runId: 123,
        headSha: controllerCommit,
        artifactId: 456,
        artifactName: "qualified-archive-recovery-v1.0.0-123",
      },
      promotionCommit: apiApprovalCommit,
      profileQualificationApiApprovalCommit: controllerCommit,
      aggregateAuthority,
    };
  return {
    temp,
    candidate,
    authority,
    promotionInput,
    sourceClosures,
    qset,
    preliminarySourceAdmission,
    aggregateRecord,
  };
}

function aggregateItem(identityValue) {
  return {
    current: identityValue,
    prior: identityValue,
    byteIdentical: true,
  };
}

async function identity(file, fileName) {
  const info = await fs.stat(file);
  return { fileName, sizeBytes: info.size, sha256: await shaFile(file) };
}
