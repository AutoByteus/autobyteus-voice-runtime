import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import path from "node:path";
import { readJson, ROOT, sha256 } from "../build/lib/files.mjs";
import {
  assessPreliminarySourceAdmission,
  canonicalObjectSha256,
  loadSourceClosurePolicy,
} from "./source-closure.mjs";

const run = promisify(execFile);
export const AGGREGATE_AUTHORITY_PATH =
  "release/candidates/authority/v1.0.0-aggregate-api-renewal-v1.json";
const COVERAGE_REPORT_PATH =
  "tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md";
const PROFILE_EVIDENCE_ROOT =
  "tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016";
const CURRENT_COVERAGE_SUBJECT_HEADING =
  "## Aggregate API Renewal Current Subjects";

export function preliminaryAdmissionReference(admission) {
  assertAdmission(admission);
  return {
    fileName: "recovery/recovery-run-v1.json",
    jsonPointer: "/preliminarySourceAdmission",
    canonicalSha256: canonicalObjectSha256(admission),
    policy: admission.policy,
    acceptedAuthorityCommit: admission.acceptedAuthorityCommit,
    reviewedControllerCommit: admission.reviewedControllerCommit,
    decision: admission.decision,
  };
}

export async function verifyCandidateAdmission({
  admission,
  reference,
  repository = ROOT,
  expectedAdmission,
}) {
  assertAdmission(admission);
  const expectedReference = preliminaryAdmissionReference(admission);
  if (JSON.stringify(reference) !== JSON.stringify(expectedReference))
    throw new Error("Candidate preliminary admission reference is invalid.");
  let recomputed = expectedAdmission;
  if (!recomputed) {
    const loaded = await loadSourceClosurePolicy({ repository });
    if (
      admission.policy.policyId !== loaded.value.policyId ||
      admission.policy.fileName !==
        "contracts/release/relevant-source-closure-v1.json" ||
      admission.policy.sha256 !== loaded.sha256
    )
      throw new Error("Candidate preliminary admission policy is invalid.");
    recomputed = await assessPreliminarySourceAdmission({
      repository,
      acceptedAuthorityCommit: admission.acceptedAuthorityCommit,
      reviewedControllerCommit: admission.reviewedControllerCommit,
      policy: loaded.value,
      policySha256: loaded.sha256,
    });
  }
  if (
    JSON.stringify(admission) !== JSON.stringify(recomputed) ||
    admission.decision !== "reuse-permitted"
  )
    throw new Error("Candidate preliminary admission does not recompute.");
  return admission;
}

export async function verifyAggregateAuthority({
  reference,
  admission,
  subjects,
  repository = ROOT,
  fixture,
}) {
  assertAggregateReference(reference);
  assertAggregateSubjects(subjects);
  const resolved = await resolveRecord(reference, repository, fixture),
    record = resolved.record;
  await validateRecord(record);
  const verifiedReference = aggregateAuthorityReference({
    record,
    bytes: resolved.bytes,
    recordCommit: reference.recordCommit,
  });
  if (JSON.stringify(reference) !== JSON.stringify(verifiedReference))
    throw new Error("Aggregate API authority reference is not exact.");
  assertAggregateAdmission(record, reference, admission, subjects);
  await verifyCommitLineage({
    record,
    reference,
    admission,
    promotionCommit: subjects.promotionCommit,
    repository,
    fixture: fixture?.commitLineage,
  });
  await verifyCoverageReport({
    record,
    reference,
    repository,
    fixture: fixture?.coverageReport,
  });
  await verifyRetainedProfiles({
    record,
    subjects,
    reference,
    repository,
    fixture: fixture?.profileEvidence,
  });
  verifyAggregateEvidence(record.aggregateEvidence, subjects);
  return { record, reference: verifiedReference };
}

export function aggregateAuthorityReference({ record, bytes, recordCommit }) {
  return {
    recordPath: AGGREGATE_AUTHORITY_PATH,
    recordCommit,
    gitBlobSha256: gitBlobSha256(bytes),
    canonicalContentSha256: canonicalObjectSha256(record),
    apiRevision: record.api.revision,
    decision: record.api.decision,
    testedCommit: record.reviewedSourceCommit,
    qualificationAuthority: record.qualificationAuthority,
  };
}

export function gitBlobSha256(bytes) {
  const body = Buffer.from(bytes);
  return sha256(
    Buffer.concat([Buffer.from(`blob ${body.length}\0`, "utf8"), body]),
  );
}

export function aggregateCandidateSubjects({
  promotionCommit,
  acceptedArchives,
  providerArchives,
  qset,
  currentAggregate,
  priorAggregate,
}) {
  const retainedProfiles = acceptedArchives.map((accepted) => {
    const archive = providerArchives.find(
        (item) => item.fileName === accepted.fileName,
      ),
      profile = qset.profiles.find(
        (item) => item.profileId === accepted.profileId,
      );
    if (!archive || !profile?.qualificationSummary)
      throw new Error("Aggregate API candidate profile subject is missing.");
    return {
      profileId: accepted.profileId,
      archive,
      profileEvidence: {
        fileName: profile.qualificationSummary.fileName,
        sha256: profile.qualificationSummary.sha256,
      },
    };
  });
  return {
    promotionCommit,
    retainedProfiles,
    aggregate: { current: currentAggregate, prior: priorAggregate },
  };
}

async function resolveRecord(reference, repository, fixture) {
  if (fixture) {
    if (
      fixture.reference &&
      JSON.stringify(reference) !== JSON.stringify(fixture.reference)
    )
      throw new Error("Aggregate API authority reference is not exact.");
    return { bytes: Buffer.from(fixture.bytes), record: fixture.record };
  }
  const bytes = await gitFileBytes(
    reference.recordCommit,
    reference.recordPath,
    repository,
  );
  return { bytes, record: JSON.parse(bytes.toString("utf8")) };
}

function assertAggregateAdmission(record, reference, admission, subjects) {
  if (
    reference.recordCommit !== admission.acceptedAuthorityCommit ||
    subjects.promotionCommit !== admission.reviewedControllerCommit ||
    record.repository !== "AutoByteus/autobyteus-voice-runtime" ||
    record.packageVersion !== "1.0.0" ||
    record.api.revision !== reference.apiRevision ||
    record.api.decision !== reference.decision ||
    record.reviewedSourceCommit !== reference.testedCommit ||
    record.api.profileExecutionCount !== 0 ||
    JSON.stringify(record.qualificationAuthority) !==
      JSON.stringify(reference.qualificationAuthority) ||
    JSON.stringify(record.qualificationAuthority) !==
      JSON.stringify(admission.closures.accepted.qualificationAuthority) ||
    JSON.stringify(record.profileClosure) !==
      JSON.stringify(admission.closures.accepted.profile)
  )
    throw new Error("Aggregate API authority does not bind the admission.");
}

async function verifyCommitLineage({
  record,
  reference,
  admission,
  promotionCommit,
  repository,
  fixture,
}) {
  if (fixture) {
    const expected = {
      reviewedSourceCommit: record.reviewedSourceCommit,
      reviewedTestCommit: record.reviewedTestCommit,
      recordCommit: reference.recordCommit,
      promotionCommit,
    };
    if (
      JSON.stringify(fixture.subjects) !== JSON.stringify(expected) ||
      fixture.sourceIsAncestorOfTest !== true ||
      fixture.recordIsAncestorOfPromotion !== true
    )
      throw new Error("Aggregate API reviewed commit lineage is invalid.");
    return;
  }
  const parents = (
    await run("git", ["show", "-s", "--format=%P", reference.recordCommit], {
      cwd: repository,
      encoding: "utf8",
    })
  ).stdout
    .trim()
    .split(/\s+/);
  if (
    parents.length !== 1 ||
    parents[0] !== record.reviewedTestCommit ||
    !(await isAncestor(
      record.reviewedSourceCommit,
      record.reviewedTestCommit,
      repository,
    )) ||
    !(await isAncestor(reference.recordCommit, promotionCommit, repository)) ||
    promotionCommit !== admission.reviewedControllerCommit
  )
    throw new Error("Aggregate API reviewed commit lineage is invalid.");
}

async function verifyCoverageReport({
  record,
  reference,
  repository,
  fixture,
}) {
  const declared = record.api.coverageReport;
  if (declared.repositoryPath !== COVERAGE_REPORT_PATH)
    throw new Error("Aggregate API coverage report path is invalid.");
  const bytes = fixture
    ? Buffer.from(fixture.bytes)
    : await gitFileBytes(
        reference.recordCommit,
        declared.repositoryPath,
        repository,
      );
  if (
    declared.gitBlobSha256 !== gitBlobSha256(bytes) ||
    declared.contentSha256 !== sha256(bytes)
  )
    throw new Error("Aggregate API coverage report identity is invalid.");
  const currentSubjects = currentCoverageReportSubjects(bytes.toString("utf8")),
    expectedSubjects = {
      apiRevision: record.api.revision,
      reviewedSourceCommit: record.reviewedSourceCommit,
      reviewedTestCommit: record.reviewedTestCommit,
    };
  if (JSON.stringify(currentSubjects) !== JSON.stringify(expectedSubjects))
    throw new Error("Aggregate API coverage report subject is invalid.");
}

function currentCoverageReportSubjects(text) {
  const lines = text.split(/\r?\n/),
    headings = lines.flatMap((line, index) =>
      line === CURRENT_COVERAGE_SUBJECT_HEADING ? [index] : [],
    );
  if (headings.length !== 1)
    throw new Error("Aggregate API coverage report subject is invalid.");
  const start = headings[0] + 1,
    nextHeading = lines.findIndex(
      (line, index) => index >= start && /^#{1,6} /.test(line),
    ),
    section = lines
      .slice(start, nextHeading === -1 ? lines.length : nextHeading)
      .filter((line) => line.length > 0),
    patterns = [
      ["apiRevision", /^- API Revision: `(API-REV-[0-9]{3,})`$/],
      [
        "reviewedSourceCommit",
        /^- Reviewed Source Commit: `((?!0{40})[a-f0-9]{40})`$/,
      ],
      [
        "reviewedTestCommit",
        /^- Reviewed Test Commit: `((?!0{40})[a-f0-9]{40})`$/,
      ],
    ];
  if (section.length !== patterns.length)
    throw new Error("Aggregate API coverage report subject is invalid.");
  return Object.fromEntries(
    patterns.map(([key, pattern], index) => {
      const match = section[index].match(pattern);
      if (!match)
        throw new Error("Aggregate API coverage report subject is invalid.");
      return [key, match[1]];
    }),
  );
}

async function verifyRetainedProfiles({
  record,
  subjects,
  reference,
  repository,
  fixture,
}) {
  for (const [index, expected] of subjects.retainedProfiles.entries()) {
    const retained = record.retainedProfiles[index];
    if (
      retained.profileId !== expected.profileId ||
      JSON.stringify(retained.archive) !== JSON.stringify(expected.archive) ||
      retained.profileEvidence.fileName !== expected.profileEvidence.fileName ||
      retained.profileEvidence.sha256 !== expected.profileEvidence.sha256
    )
      throw new Error("Aggregate API retained profile identity is invalid.");
    const independentlyResolved = fixture?.[index]
      ? fixture[index]
      : await profileEvidenceIdentity(
          retained.profileId,
          retained.profileEvidence.fileName,
          reference.recordCommit,
          repository,
        );
    if (
      JSON.stringify(retained.profileEvidence) !==
      JSON.stringify(independentlyResolved)
    )
      throw new Error("Aggregate API retained profile evidence is invalid.");
  }
}

function verifyAggregateEvidence(actual, subjects) {
  for (const key of [
    "qualificationSet",
    "branchProjection",
    "branchProjectionVerification",
  ]) {
    const current = subjects.aggregate.current[key],
      prior = subjects.aggregate.prior[key],
      expected = {
        current,
        prior,
        byteIdentical: JSON.stringify(current) === JSON.stringify(prior),
      };
    if (JSON.stringify(actual[key]) !== JSON.stringify(expected))
      throw new Error(`Aggregate API ${key} identity is invalid.`);
  }
}

async function profileEvidenceIdentity(
  profileId,
  fileName,
  commit,
  repository,
) {
  const expectedName = "qualification-summary-v2.json";
  if (fileName !== expectedName)
    throw new Error("Aggregate API profile evidence filename is invalid.");
  const bytes = await gitFileBytes(
    commit,
    `${PROFILE_EVIDENCE_ROOT}/${profileId}-darwin-arm64/${fileName}`,
    repository,
  );
  return { fileName, sizeBytes: bytes.length, sha256: sha256(bytes) };
}

async function gitFileBytes(commit, fileName, repository) {
  if (
    !/^(?!0{40})[a-f0-9]{40}$/.test(commit) ||
    !/^[A-Za-z0-9._/-]+$/.test(fileName) ||
    fileName.startsWith("/") ||
    fileName.split("/").some((part) => !part || part === "." || part === "..")
  )
    throw new Error("Aggregate API Git identity input is invalid.");
  const result = await run("git", ["show", `${commit}:${fileName}`], {
    cwd: repository,
    encoding: "buffer",
    maxBuffer: 16 * 1024 * 1024,
  });
  return result.stdout;
}

async function isAncestor(ancestor, descendant, repository) {
  try {
    await run("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: repository,
    });
    return true;
  } catch {
    return false;
  }
}

function assertAdmission(value) {
  if (
    value?.schemaVersion !== 1 ||
    value.artifactKind !== "preliminary-source-admission" ||
    value.decision !== "reuse-permitted" ||
    !Array.isArray(value.changedPaths) ||
    value.changedPathsSha256 !== canonicalObjectSha256(value.changedPaths)
  )
    throw new Error("Preliminary Source Admission is invalid.");
}

function assertAggregateReference(value) {
  if (
    value?.recordPath !== AGGREGATE_AUTHORITY_PATH ||
    !/^(?!0{40})[a-f0-9]{40}$/.test(value.recordCommit) ||
    !/^[a-f0-9]{64}$/.test(value.gitBlobSha256) ||
    !/^[a-f0-9]{64}$/.test(value.canonicalContentSha256) ||
    !/^API-REV-[0-9]{3,}$/.test(value.apiRevision) ||
    value.decision !== "pass" ||
    !/^(?!0{40})[a-f0-9]{40}$/.test(value.testedCommit) ||
    value.qualificationAuthority?.closureId !==
      "qualification-authority-closure-v1"
  )
    throw new Error("Aggregate API authority reference is invalid.");
}

function assertAggregateSubjects(value) {
  if (
    !/^(?!0{40})[a-f0-9]{40}$/.test(value?.promotionCommit) ||
    value.retainedProfiles?.length !== 2 ||
    value.retainedProfiles[0]?.profileId !== "english" ||
    value.retainedProfiles[1]?.profileId !== "chinese" ||
    !value.aggregate?.current ||
    !value.aggregate?.prior
  )
    throw new Error("Aggregate API candidate subjects are invalid.");
}

async function validateRecord(record) {
  const schema = await readJson(
      path.join(ROOT, "contracts/release/aggregate-api-renewal-v1.schema.json"),
    ),
    validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!validate(record))
    throw new Error(
      `Aggregate API Renewal Record invalid: ${JSON.stringify(validate.errors)}`,
    );
}
