import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readJson, ROOT } from "../build/lib/files.mjs";
import {
  canonicalDigest,
  compareNames,
  deepEqual,
  ordinaryFileIdentity,
  writeArtifact,
} from "./release-contract.mjs";
import {
  assertCommit,
  gitOrdinaryFileIdentity,
  readFocusedAuthorityBundle,
  readGitJson,
} from "./release-admission-contract.mjs";

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

export async function loadSourceClosurePolicy({
  repository = ROOT,
  commit,
} = {}) {
  const file = path.join(repository, SOURCE_CLOSURE_POLICY_PATH),
    value = commit
      ? await readGitJson({
          repository,
          commit,
          relativePath: SOURCE_CLOSURE_POLICY_PATH,
          label: "Relevant Source Closure Policy 2",
        })
      : await readJson(file);
  assertPolicy(value);
  const identity = commit
    ? await gitOrdinaryFileIdentity({
        repository,
        commit,
        relativePath: SOURCE_CLOSURE_POLICY_PATH,
      })
    : await ordinaryFileIdentity(file);
  return { value, identity, sha256: identity.sha256 };
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
  admittedSourceCommit,
  focusedAuthorities,
  admittedHostClosures,
  output,
}) {
  assertCommit(focusedSourceCommit);
  assertCommit(admittedSourceCommit);
  const ancestor = await isAncestor(
      repository,
      focusedSourceCommit,
      admittedSourceCommit,
    ),
    { value: policy, identity: policyIdentity } = await loadSourceClosurePolicy(
      {
        repository,
        commit: admittedSourceCommit,
      },
    ),
    changedPaths = await changedSourcePaths({
      repository,
      from: focusedSourceCommit,
      to: admittedSourceCommit,
      policy,
    }),
    matrixRelative = "contracts/catalog/current-release-matrix-v2.json",
    matrix = {
      value: await readGitJson({
        repository,
        commit: admittedSourceCommit,
        relativePath: matrixRelative,
        schema: "contracts/catalog/current-release-matrix-v2.schema.json",
        label: "Current Release Matrix 2",
      }),
      identity: await gitOrdinaryFileIdentity({
        repository,
        commit: admittedSourceCommit,
        relativePath: matrixRelative,
      }),
    },
    authority = await readFocusedAuthorityBundle({
      paths: focusedAuthorities,
      focusedSourceCommit,
      currentReleaseMatrix: matrix,
    }),
    profiles = authority.profiles.map((profile) => {
      const observed = admittedHostClosures.find(
        (item) => item.profileId === profile.profileId,
      );
      if (!observed) throw new Error("Admitted Host Source Closure is absent.");
      const admitted = {
        sizeBytes: observed.sizeBytes,
        sha256: observed.sha256,
      };
      const equal = deepEqual(profile.focusedHostSourceClosure, admitted);
      return {
        ...profile,
        admittedHostSourceClosure: admitted,
        equal,
      };
    });
  let decision = sourceClosureDecision(changedPaths);
  if (
    !ancestor ||
    profiles.length !== 2 ||
    profiles.some((profile) => !profile.equal)
  )
    decision = "blocked";
  const value = {
    schemaVersion: 4,
    artifactKind: "release-source-admission",
    focusedSourceCommit,
    admittedSourceCommit,
    sourceClosurePolicy: policyIdentity,
    currentReleaseMatrix: matrix.identity,
    ancestryVerified: ancestor,
    changedPaths,
    changedPathsSha256: canonicalDigest(changedPaths),
    focusedQualificationSet: authority.identities.focusedQualificationSet,
    branchCatalogProjection: authority.identities.branchCatalogProjection,
    branchCatalogProjectionVerification:
      authority.identities.branchCatalogProjectionVerification,
    englishExecutionClosure: authority.identities.englishExecutionClosure,
    chineseExecutionClosure: authority.identities.chineseExecutionClosure,
    profiles,
    decision,
  };
  await writeArtifact(
    output,
    value,
    "contracts/release/release-source-admission-v4.schema.json",
    "Release Source Admission 4",
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
export async function isAncestor(repository, ancestor, descendant) {
  return run("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
    cwd: repository,
  }).then(
    () => true,
    () => false,
  );
}
