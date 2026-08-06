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
  for (const [index, fileName] of RAW_RECOVERY_MEMBERS.entries()) {
    const file = path.join(candidate, fileName);
    if (fileName.endsWith(".log")) await fs.writeFile(file, `build ${index}\n`);
    else await writeJson(file, { schemaVersion: 1, sequence: index });
  }
  const evidenceManifest = await writeRecoveryManifest(candidate),
    archiveRows = archives.map((item) => ({
      profileId: item.profileId,
      buildCount: 1,
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
    })),
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
      archives: archiveRows,
      execution: {
        packageBuildsPerProfile: 1,
        providerStarts: 0,
        inferenceRequests: 0,
        corpusRuns: 0,
        coldTrials: 0,
        warmPreparationTrials: 0,
        warmRequestTrials: 0,
      },
      evidenceManifest,
    };
  await writeJson(
    path.join(candidate, "recovery/qualified-archive-recovery-result-v1.json"),
    result,
  );
  const authority = {
      production: false,
      sourceCommit: qset.sourceCommit,
      releaseMatrix: qset.releaseMatrix,
      aggregate,
      apiEvidence,
      archives,
    },
    sourceClosures = {
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
    promotionInput = {
      archiveRecoveryWorkflow: {
        path: ".github/workflows/recover-qualified-voice-archives.yml",
        runId: 123,
        headSha: controllerCommit,
        artifactId: 456,
        artifactName: "qualified-archive-recovery-v1.0.0-123",
      },
      apiApprovalCommit,
      sourceClosures,
    };
  return {
    temp,
    candidate,
    authority,
    promotionInput,
    sourceClosures,
    qset,
  };
}

async function identity(file, fileName) {
  const info = await fs.stat(file);
  return { fileName, sizeBytes: info.size, sha256: await shaFile(file) };
}
