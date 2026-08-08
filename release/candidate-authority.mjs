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
  repository = ROOT,
  fixture,
}) {
  assertAggregateReference(reference);
  let bytes, record;
  if (fixture) {
    if (
      fixture.reference &&
      JSON.stringify(reference) !== JSON.stringify(fixture.reference)
    )
      throw new Error("Aggregate API authority reference is not exact.");
    ({ bytes, record } = fixture);
  } else {
    const result = await run(
      "git",
      ["show", `${reference.recordCommit}:${reference.recordPath}`],
      { cwd: repository, encoding: "buffer", maxBuffer: 16 * 1024 * 1024 },
    );
    bytes = result.stdout;
    record = JSON.parse(bytes.toString("utf8"));
  }
  if (
    sha256(bytes) !== reference.gitBlobSha256 ||
    canonicalObjectSha256(record) !== reference.canonicalContentSha256
  )
    throw new Error("Aggregate API authority byte identity is invalid.");
  await validateRecord(record);
  if (
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
  return record;
}

export function aggregateAuthorityReference({ record, bytes, recordCommit }) {
  return {
    recordPath: AGGREGATE_AUTHORITY_PATH,
    recordCommit,
    gitBlobSha256: sha256(bytes),
    canonicalContentSha256: canonicalObjectSha256(record),
    apiRevision: record.api.revision,
    decision: record.api.decision,
    testedCommit: record.reviewedSourceCommit,
    qualificationAuthority: record.qualificationAuthority,
  };
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
    value.decision !== "pass"
  )
    throw new Error("Aggregate API authority reference is invalid.");
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
