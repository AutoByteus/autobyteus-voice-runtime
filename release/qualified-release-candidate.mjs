#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  parsePairs,
  readJson,
  regularFiles,
  ROOT,
  sha256,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import {
  ACCEPTED_AGGREGATE,
  ACCEPTED_API_EVIDENCE,
  ACCEPTED_ARCHIVES,
  PROFILE_QUALIFICATION_API_APPROVAL_COMMIT,
  QUALIFIED_SOURCE_COMMIT,
  RECOVERY_WORKFLOW_PATH,
  RELEASE_MATRIX,
} from "./recovery-authority.mjs";
import {
  aggregateCandidateSubjects,
  preliminaryAdmissionReference,
  verifyAggregateAuthority,
  verifyCandidateAdmission,
} from "./candidate-authority.mjs";
import {
  RECOVERY_MANIFEST_PATH,
  RECOVERY_MEMBER_ALLOWLIST,
  RECOVERY_RESULT_PATH,
  assertExactRecoveryDirectory,
  recoveryRawListDigest,
  verifyRecoveryManifest,
} from "./recovery-evidence.mjs";
import { verifyQualifiedArchiveRecoveryResult } from "./recover-qualified-voice-archives.mjs";
import { validateRecoveryResult } from "./recovery-result.mjs";
import { gitFileSha256 } from "./recovery-git-identity.mjs";

export const CANDIDATE_MANIFEST_PATH = "qualified-release-candidate-v1.json";
export const CANDIDATE_MEMBERS = Object.freeze(
  [
    CANDIDATE_MANIFEST_PATH,
    ...RECOVERY_MEMBER_ALLOWLIST,
    "qualification-set-v2.json",
    "branch-catalog-projection-v2.json",
    "branch-catalog-projection-verification-v2.json",
    ...ACCEPTED_API_EVIDENCE.map((item) => item.fileName),
    ...ACCEPTED_ARCHIVES.map((item) => `assets/${item.fileName}`),
  ].sort(compareUtf8),
);

export async function assembleQualifiedCandidate({
  candidate,
  promotionInput,
  authority = productionAuthority(),
}) {
  const root = path.resolve(candidate);
  await assertCandidateMembers(root, false, authority);
  const context = await verifyCandidateInputs(root, authority),
    manifest = await candidateManifest(context, promotionInput);
  await validate(
    manifest,
    "contracts/release/qualified-release-candidate-v1.schema.json",
    "Qualified Release Candidate",
  );
  await writeJson(path.join(root, CANDIDATE_MANIFEST_PATH), manifest);
  await verifyQualifiedCandidate(root, { authority });
  return manifest;
}

export async function verifyQualifiedCandidate(
  candidate,
  { authority = productionAuthority() } = {},
) {
  const root = path.resolve(candidate);
  await assertCandidateMembers(root, true, authority);
  const manifest = await readJson(path.join(root, CANDIDATE_MANIFEST_PATH));
  await validate(
    manifest,
    "contracts/release/qualified-release-candidate-v1.schema.json",
    "Qualified Release Candidate",
  );
  const context = await verifyCandidateInputs(root, authority),
    expected = await candidateManifest(context, {
      archiveRecoveryWorkflow: manifest.archiveRecovery.workflow,
      promotionCommit: manifest.promotion.approvalCommit,
      profileQualificationApiApprovalCommit:
        manifest.profileQualificationAuthority.apiApprovalCommit,
      aggregateAuthority: manifest.aggregateAuthority,
    });
  if (JSON.stringify(manifest) !== JSON.stringify(expected))
    throw new Error(
      "Qualified candidate does not match independent recomputation.",
    );
  return manifest;
}

export async function writeCandidatePromotionRecord({
  candidate,
  recordInput,
  output,
  authority = productionAuthority(),
}) {
  const manifest = await verifyQualifiedCandidate(candidate, { authority }),
    manifestPath = path.join(path.resolve(candidate), CANDIDATE_MANIFEST_PATH),
    info = await fs.stat(manifestPath),
    record = {
      schemaVersion: 1,
      packageVersion: manifest.packageVersion,
      repository: manifest.repository,
      workflow: recordInput.workflow,
      artifact: recordInput.artifact,
      candidateManifest: {
        fileName: CANDIDATE_MANIFEST_PATH,
        sizeBytes: info.size,
        sha256: await shaFile(manifestPath),
      },
    };
  if (
    record.workflow.path !== manifest.promotion.workflowPath ||
    record.workflow.headSha !== manifest.promotion.approvalCommit ||
    record.artifact.name !==
      `qualified-release-candidate-v1.0.0-${manifest.promotion.approvalCommit}`
  )
    throw new Error("Candidate promotion record lineage mismatch.");
  await validate(
    record,
    "contracts/release/candidate-promotion-record-v1.schema.json",
    "Candidate Promotion Record",
    true,
  );
  await writeJson(path.resolve(output), record);
  return record;
}

async function verifyCandidateInputs(root, authority) {
  await assertExactRecoveryDirectory(root);
  const recoveryResult = await verifyRecovery(root, authority),
    { identity: recoveryManifest, items: rawEvidence } =
      await verifyRecoveryManifest(root, recoveryResult.evidenceManifest),
    qsetPath = path.join(root, "qualification-set-v2.json"),
    projectionPath = path.join(root, "branch-catalog-projection-v2.json"),
    verificationPath = path.join(
      root,
      "branch-catalog-projection-verification-v2.json",
    ),
    qset = await readJson(qsetPath),
    projection = await readJson(projectionPath),
    projectionVerification = await readJson(verificationPath);
  for (const expected of authority.archives) {
    const recovered = recoveryResult.profileRecoveries.find(
        (item) => item.profileId === expected.profileId,
      ),
      archive = recovered?.archive,
      rawProfile = await readJson(
        path.join(
          root,
          `recovery/${expected.profileId}-profile-recovery-v1.json`,
        ),
      );
    if (
      recovered?.outcome !== "succeeded" ||
      recovered.build.attempted !== 1 ||
      recovered.build.completed !== 1 ||
      archive?.status !== "accepted" ||
      !archive.exactMatch ||
      archive.fileName !== expected.fileName ||
      archive.expectedSizeBytes !== expected.sizeBytes ||
      archive.observedSizeBytes !== expected.sizeBytes ||
      archive.expectedSha256 !== expected.sha256 ||
      archive.observedSha256 !== expected.sha256 ||
      archive.descriptorSourceCommit !== authority.sourceCommit ||
      JSON.stringify(rawProfile.profileRecovery) !== JSON.stringify(recovered)
    )
      throw new Error(
        `Recovery Result archive mismatch: ${expected.profileId}`,
      );
  }
  await validate(
    qset,
    "contracts/release/qualification-set-v2.schema.json",
    "Qualification Set",
  );
  await validate(
    projection,
    "contracts/catalog/branch-catalog-projection-v2.schema.json",
    "Branch Projection",
  );
  await validate(
    projectionVerification,
    "contracts/catalog/branch-catalog-projection-verification-v2.schema.json",
    "Branch Projection Verification",
  );
  const qsetIdentity = await fileIdentity(
      qsetPath,
      "qualification-set-v2.json",
    ),
    projectionIdentity = await fileIdentity(
      projectionPath,
      "branch-catalog-projection-v2.json",
    ),
    verificationIdentity = await fileIdentity(
      verificationPath,
      "branch-catalog-projection-verification-v2.json",
    );
  if (
    qset.sourceCommit !== authority.sourceCommit ||
    projection.sourceCommit !== authority.sourceCommit ||
    recoveryResult.qualifiedAuthority.sourceCommit !== authority.sourceCommit ||
    qset.functionalDecision !== "pass" ||
    projectionVerification.decision !== "pass" ||
    projection.qualificationSet.sha256 !== qsetIdentity.sha256 ||
    projectionVerification.qualificationSetSha256 !== qsetIdentity.sha256 ||
    projectionVerification.projectionSha256 !== projectionIdentity.sha256 ||
    JSON.stringify(qset.releaseMatrix) !==
      JSON.stringify(authority.releaseMatrix) ||
    JSON.stringify(projection.releaseMatrix) !==
      JSON.stringify(authority.releaseMatrix)
  )
    throw new Error("Accepted aggregate evidence lineage mismatch.");
  assertIdentity(qsetIdentity, authority.aggregate.qualificationSet);
  assertIdentity(projectionIdentity, authority.aggregate.branchProjection);
  assertIdentity(
    verificationIdentity,
    authority.aggregate.branchProjectionVerification,
  );
  const apiEvidenceManifests = [];
  for (const expected of authority.apiEvidence) {
    const observed = await fileIdentity(
      path.join(root, expected.fileName),
      expected.fileName,
    );
    assertIdentity(observed, expected);
    apiEvidenceManifests.push({
      apiRevision: expected.apiRevision,
      ...observed,
    });
  }
  const providerArchives = [];
  for (const expected of authority.archives) {
    const observed = await fileIdentity(
      path.join(root, "assets", expected.fileName),
      expected.fileName,
    );
    assertIdentity(observed, expected);
    providerArchives.push(observed);
  }
  providerArchives.sort((left, right) =>
    compareUtf8(left.fileName, right.fileName),
  );
  if (
    projection.assetSet.sha256 !== archiveListDigest(providerArchives) ||
    JSON.stringify(projection.assetSet.items) !==
      JSON.stringify(providerArchives)
  )
    throw new Error("Candidate archive set does not match Branch Projection.");
  return {
    root,
    recoveryResult,
    recoveryManifest,
    rawEvidence,
    qset,
    qsetIdentity,
    projectionIdentity,
    verificationIdentity,
    apiEvidenceManifests,
    providerArchives,
    recoveryRun: await readJson(
      path.join(root, "recovery/recovery-run-v1.json"),
    ),
    authority,
  };
}

async function candidateManifest(context, promotionInput) {
  const {
      root,
      recoveryResult,
      recoveryManifest,
      rawEvidence,
      qset,
      qsetIdentity,
      projectionIdentity,
      verificationIdentity,
      apiEvidenceManifests,
      providerArchives,
      recoveryRun,
      authority,
    } = context,
    resultIdentity = await fileIdentity(
      path.join(root, RECOVERY_RESULT_PATH),
      RECOVERY_RESULT_PATH,
    );
  assertPromotionInput(promotionInput, authority, qset);
  const admission = recoveryRun.preliminarySourceAdmission,
    admissionReference = preliminaryAdmissionReference(admission);
  await verifyCandidateAdmission({
    admission,
    reference: admissionReference,
    repository: authority.repository,
    expectedAdmission: authority.preliminarySourceAdmission,
  });
  const verifiedAggregate = await verifyAggregateAuthority({
    reference: promotionInput.aggregateAuthority,
    admission,
    subjects: aggregateCandidateSubjects({
      promotionCommit: promotionInput.promotionCommit,
      acceptedArchives: authority.archives,
      providerArchives,
      qset,
      currentAggregate: {
        qualificationSet: qsetIdentity,
        branchProjection: projectionIdentity,
        branchProjectionVerification: verificationIdentity,
      },
      priorAggregate: authority.aggregate,
    }),
    repository: authority.repository,
    fixture: authority.aggregateAuthorityFixture,
  });
  if (
    promotionInput.archiveRecoveryWorkflow.headSha !==
    recoveryResult.controller.commit
  )
    throw new Error(
      "Recovery workflow head does not match its Result controller.",
    );
  return {
    schemaVersion: 1,
    artifactKind: "qualified-release-candidate",
    repository: "AutoByteus/autobyteus-voice-runtime",
    packageVersion: "1.0.0",
    decision: "promoted",
    archiveRecovery: {
      result: { ...resultIdentity, decision: recoveryResult.decision },
      evidenceManifest: recoveryManifest,
      rawEvidence: {
        sha256: recoveryRawListDigest(rawEvidence),
        items: rawEvidence,
      },
      workflow: promotionInput.archiveRecoveryWorkflow,
    },
    preliminarySourceAdmission: admissionReference,
    profileQualificationAuthority: {
      sourceCommit: qset.sourceCommit,
      runnerCommit: qset.runnerCommit,
      testCommit: qset.testCommit,
      apiApprovalCommit: promotionInput.profileQualificationApiApprovalCommit,
      apiRevision: "API-REV-017",
      apiDecision: "pass",
    },
    aggregateAuthority: verifiedAggregate.reference,
    releaseMatrix: authority.releaseMatrix,
    qualificationSet: qsetIdentity,
    branchProjection: projectionIdentity,
    branchProjectionVerification: {
      ...verificationIdentity,
      decision: "pass",
    },
    apiEvidenceManifests,
    providerArchives: {
      sha256: archiveListDigest(providerArchives),
      items: providerArchives,
    },
    sourceClosures: admission.closures.reviewed,
    promotion: {
      approvalCommit: promotionInput.promotionCommit,
      workflowPath: ".github/workflows/promote-qualified-voice-candidate.yml",
      workflowSha256: authority.production
        ? await gitFileSha256(
            promotionInput.promotionCommit,
            ".github/workflows/promote-qualified-voice-candidate.yml",
          )
        : await shaFile(
            path.join(
              ROOT,
              ".github/workflows/promote-qualified-voice-candidate.yml",
            ),
          ),
    },
  };
}

async function verifyRecovery(root, authority) {
  if (authority.production) return verifyQualifiedArchiveRecoveryResult(root);
  const result = await readJson(path.join(root, RECOVERY_RESULT_PATH));
  await validateRecoveryResult(result, root);
  if (result.decision !== "pass")
    throw new Error("Recovery Result is not Pass.");
  await verifyRecoveryManifest(root, result.evidenceManifest);
  return result;
}

async function assertCandidateMembers(root, includeManifest, authority) {
  const expected = [
    ...(includeManifest ? [CANDIDATE_MANIFEST_PATH] : []),
    ...RECOVERY_MEMBER_ALLOWLIST,
    "qualification-set-v2.json",
    "branch-catalog-projection-v2.json",
    "branch-catalog-projection-verification-v2.json",
    ...authority.apiEvidence.map((item) => item.fileName),
    ...authority.archives.map((item) => `assets/${item.fileName}`),
  ].sort(compareUtf8);
  const actual = await regularFiles(root);
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error("Candidate bundle member closure is not exact.");
}

function assertPromotionInput(input, authority, qset) {
  const workflow = input?.archiveRecoveryWorkflow;
  if (
    !/^(?!0{40})[a-f0-9]{40}$/.test(input?.promotionCommit) ||
    !/^(?!0{40})[a-f0-9]{40}$/.test(
      input?.profileQualificationApiApprovalCommit,
    ) ||
    workflow?.path !== RECOVERY_WORKFLOW_PATH ||
    !Number.isSafeInteger(workflow.runId) ||
    workflow.runId < 1 ||
    !/^(?!0{40})[a-f0-9]{40}$/.test(workflow.headSha) ||
    !Number.isSafeInteger(workflow.artifactId) ||
    workflow.artifactId < 1 ||
    workflow.artifactName !==
      `qualified-archive-recovery-v1.0.0-${workflow.runId}` ||
    input?.aggregateAuthority?.decision !== "pass" ||
    qset.sourceCommit !== authority.sourceCommit
  )
    throw new Error("Candidate promotion input is invalid.");
  if (
    authority.production &&
    input.profileQualificationApiApprovalCommit !==
      PROFILE_QUALIFICATION_API_APPROVAL_COMMIT
  )
    throw new Error("Historical profile qualification authority changed.");
}

async function fileIdentity(file, fileName) {
  const info = await fs.lstat(file);
  if (!info.isFile() || info.isSymbolicLink())
    throw new Error(`Candidate member is not an ordinary file: ${fileName}`);
  return { fileName, sizeBytes: info.size, sha256: await shaFile(file) };
}

function assertIdentity(observed, expected) {
  if (
    observed.fileName !== expected.fileName ||
    observed.sizeBytes !== expected.sizeBytes ||
    observed.sha256 !== expected.sha256
  )
    throw new Error(`Candidate member identity mismatch: ${expected.fileName}`);
}

function archiveListDigest(items) {
  return sha256(Buffer.from(JSON.stringify(items)));
}

async function validate(value, schemaPath, label, formats = false) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  if (formats) addFormats(ajv);
  const check = ajv.compile(await readJson(path.join(ROOT, schemaPath)));
  if (!check(value))
    throw new Error(`${label} invalid: ${JSON.stringify(check.errors)}`);
}

function productionAuthority() {
  return {
    production: true,
    repository: ROOT,
    sourceCommit: QUALIFIED_SOURCE_COMMIT,
    releaseMatrix: RELEASE_MATRIX,
    aggregate: ACCEPTED_AGGREGATE,
    apiEvidence: ACCEPTED_API_EVIDENCE,
    archives: ACCEPTED_ARCHIVES,
  };
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), ["operation", "candidate"]);
  if (args.operation === "assemble") {
    if (!args.input) throw new Error("Missing --input.");
    await assembleQualifiedCandidate({
      candidate: args.candidate,
      promotionInput: await readJson(path.resolve(args.input)),
    });
  } else if (args.operation === "verify") {
    await verifyQualifiedCandidate(args.candidate);
  } else if (args.operation === "record") {
    if (!args.input || !args.output)
      throw new Error("Missing record input/output.");
    await writeCandidatePromotionRecord({
      candidate: args.candidate,
      recordInput: await readJson(path.resolve(args.input)),
      output: args.output,
    });
  } else throw new Error("Unknown candidate operation.");
}
