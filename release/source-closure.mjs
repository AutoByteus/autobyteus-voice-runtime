import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readJson, ROOT, shaFile } from "../build/lib/files.mjs";
import {
  canonicalDigest,
  compareNames,
  deepEqual,
  ordinaryFileIdentity,
  readValidated,
  writeArtifact,
} from "./release-contract.mjs";

const run = promisify(execFile);
export const SOURCE_CLOSURE_POLICY_PATH =
  "contracts/release/relevant-source-closure-v2.json";
const PRECEDENCE = [
  "profile-qualification-required",
  "focused-qualification-required",
  "aggregate-api-renewal-required",
  "release-pipeline-only",
  "documentation-record-only",
];

export async function loadSourceClosurePolicy({ repository = ROOT } = {}) {
  const file = path.join(repository, SOURCE_CLOSURE_POLICY_PATH),
    value = await readJson(file);
  assertPolicy(value);
  return { value, sha256: await shaFile(file) };
}

export function classifySourcePath(fileName, policy) {
  if (!isRepositoryPath(fileName)) throw new Error("Noncanonical source path.");
  const matches = policy.rules
    .filter(
      (rule) =>
        rule.exact.includes(fileName) ||
        rule.prefixes.some((prefix) => fileName.startsWith(prefix)),
    )
    .map((rule) => rule.classification);
  return strictest(matches, policy.defaultClassification);
}

export async function changedSourcePaths({
  repository = ROOT,
  from,
  to,
  policy,
}) {
  assertCommit(from);
  assertCommit(to);
  const { stdout } = await run(
      "git",
      ["diff", "--name-status", "--find-renames", "-z", from, to],
      { cwd: repository, maxBuffer: 32 * 1024 * 1024 },
    ),
    fields = stdout.split("\0"),
    changes = [];
  for (let index = 0; index < fields.length - 1; ) {
    const status = fields[index++][0];
    if (status === "R") {
      const oldPath = fields[index++],
        newPath = fields[index++];
      changes.push({
        status,
        oldPath,
        newPath,
        classification: strictest([
          classifySourcePath(oldPath, policy),
          classifySourcePath(newPath, policy),
        ]),
      });
    } else if (["A", "M", "D"].includes(status)) {
      const fileName = fields[index++];
      changes.push({
        status,
        path: fileName,
        classification: classifySourcePath(fileName, policy),
      });
    } else throw new Error("Unsupported source diff status.");
  }
  return changes.sort((left, right) =>
    compareNames(changeKey(left), changeKey(right)),
  );
}

export function sourceClosureDecision(changes) {
  const classification = strictest(
    changes.map((item) => item.classification),
    "release-pipeline-only",
  );
  if (
    ["release-pipeline-only", "documentation-record-only"].includes(
      classification,
    )
  )
    return "reuse-permitted";
  return classification === "aggregate-api-renewal-required"
    ? "api-impact-review-required"
    : classification;
}

export async function assembleReleaseSourceAdmission({
  repository = ROOT,
  focusedSourceCommit,
  finalMainCommit,
  qualificationSet,
  branchProjection,
  projectionVerification,
  executionClosureVerifications,
  finalHostClosures,
  output,
}) {
  assertCommit(focusedSourceCommit);
  assertCommit(finalMainCommit);
  const ancestor = await isAncestor(
      repository,
      focusedSourceCommit,
      finalMainCommit,
    ),
    { value: policy } = await loadSourceClosurePolicy({ repository }),
    changedPaths = await changedSourcePaths({
      repository,
      from: focusedSourceCommit,
      to: finalMainCommit,
      policy,
    }),
    qset = await readValidated(
      qualificationSet,
      "contracts/release/focused-qualification-set-v3.schema.json",
      "Focused Qualification Set 3",
    ),
    projection = await readValidated(
      branchProjection,
      "contracts/catalog/branch-catalog-projection-v3.schema.json",
      "Branch Catalog Projection 3",
    ),
    verification = await readValidated(
      projectionVerification,
      "contracts/catalog/branch-catalog-projection-verification-v3.schema.json",
      "Branch Catalog Projection Verification 3",
    );
  if (
    !ancestor ||
    qset.sourceCommit !== focusedSourceCommit ||
    projection.sourceCommit !== focusedSourceCommit ||
    verification.sourceCommit !== focusedSourceCommit ||
    qset.decision !== "pass" ||
    projection.decision !== "pass" ||
    verification.decision !== "pass"
  )
    throw new Error("Release source admission evidence lineage mismatch.");
  const executionIdentities = [];
  for (const file of executionClosureVerifications) {
    const closure = await readValidated(
      file,
      "contracts/qualification/profile-execution-closure-v2.schema.json",
      "Profile Execution Closure 2",
    );
    if (
      closure.decision !== "reuse-permitted" ||
      closure.current.sourceCommit !== focusedSourceCommit
    )
      throw new Error("Execution closure does not authorize focused reuse.");
    executionIdentities.push(await ordinaryFileIdentity(file));
  }
  const profiles = qset.profiles.map((profile) => {
    const observed = finalHostClosures.find(
      (item) => item.profileId === profile.profileId,
    );
    if (!observed || observed.sha256 !== profile.hostSourceClosureSha256)
      throw new Error(
        "Final Host Source Closure differs from focused authority.",
      );
    return {
      profileId: profile.profileId,
      focusedHostSourceClosureSha256: profile.hostSourceClosureSha256,
      finalHostSourceClosureSha256: observed.sha256,
      equal: true,
    };
  });
  let decision = sourceClosureDecision(changedPaths);
  if (!ancestor || profiles.length !== 2) decision = "blocked";
  const value = {
    schemaVersion: 3,
    artifactKind: "release-source-admission",
    focusedSourceCommit,
    finalMainCommit,
    ancestryVerified: ancestor,
    changedPaths,
    changedPathsSha256: canonicalDigest(changedPaths),
    qualificationSet: await ordinaryFileIdentity(qualificationSet),
    branchProjection: await ordinaryFileIdentity(branchProjection),
    projectionVerification: await ordinaryFileIdentity(projectionVerification),
    executionClosureVerifications: executionIdentities.sort((left, right) =>
      compareNames(left.fileName, right.fileName),
    ),
    profiles,
    decision,
  };
  await writeArtifact(
    output,
    value,
    "contracts/release/release-source-admission-v3.schema.json",
    "Release Source Admission 3",
  );
  if (decision !== "reuse-permitted") {
    const error = new Error(`Release source admission blocked: ${decision}`);
    error.code = "SOURCE_ADMISSION_BLOCKED";
    throw error;
  }
  return value;
}

function strictest(categories, fallback = "api-impact-review-required") {
  const values = new Set(categories);
  return PRECEDENCE.find((item) => values.has(item)) ?? fallback;
}
function changeKey(item) {
  return item.status === "R"
    ? `R\0${item.oldPath}\0${item.newPath}`
    : `${item.status}\0${item.path}`;
}
function isRepositoryPath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !value.split("/").some((item) => !item || item === "." || item === "..")
  );
}
function assertPolicy(value) {
  if (
    value?.schemaVersion !== 2 ||
    value.policyId !== "voice-runtime-relevant-source-closure-v2" ||
    value.defaultClassification !== "api-impact-review-required" ||
    !deepEqual(value.precedence, PRECEDENCE) ||
    !Array.isArray(value.rules)
  )
    throw new Error("Relevant Source Closure 2 policy is invalid.");
}
function assertCommit(value) {
  if (!/^(?!0{40})[a-f0-9]{40}$/.test(value))
    throw new Error("Source commit is invalid.");
}
export async function isAncestor(repository, ancestor, descendant) {
  return run("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
    cwd: repository,
  }).then(
    () => true,
    () => false,
  );
}
