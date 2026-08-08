import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readJson, ROOT, sha256, shaFile } from "../build/lib/files.mjs";

const run = promisify(execFile);
const DECISION_ORDER = [
  "profile-qualification-required",
  "aggregate-api-renewal-required",
  "api-impact-review-required",
  "release-pipeline-only",
  "documentation-or-record-only",
];
export const SOURCE_CLOSURE_POLICY_PATH =
  "contracts/release/relevant-source-closure-v1.json";

export async function loadSourceClosurePolicy({ repository = ROOT } = {}) {
  const file = path.join(repository, SOURCE_CLOSURE_POLICY_PATH),
    policy = await readJson(file);
  assertPolicy(policy);
  return { value: policy, sha256: await shaFile(file) };
}

export function classifySourcePath(fileName, policy) {
  if (!isCanonicalRepositoryPath(fileName))
    throw new Error("Source-closure path is noncanonical.");
  const matches = new Set();
  for (const rule of policy.rules)
    if (
      rule.exact.includes(fileName) ||
      rule.prefixes.some((prefix) => fileName.startsWith(prefix))
    )
      matches.add(rule.category);
  return strictestCategory([...matches], policy.defaultCategory);
}

export async function computeSourceClosure({
  repository = ROOT,
  commit,
  closure,
  policy,
}) {
  assertCommit(commit);
  const records = await gitInventory(repository, commit),
    selected = records.filter((item) =>
      closure.categories.includes(classifySourcePath(item.path, policy)),
    ),
    included = await materializeBlobDigests(repository, selected),
    inventory = included.map((item) => item.path);
  return {
    closureId: closure.closureId,
    inventorySha256: sha256(Buffer.from(`${JSON.stringify(inventory)}\n`)),
    treeSha256: sha256(Buffer.from(`${JSON.stringify(included)}\n`)),
  };
}

export async function computeApprovedSourceClosures({
  repository = ROOT,
  commit,
  policy,
}) {
  const result = {};
  for (const key of ["profile", "qualificationAuthority"])
    result[key] = await computeSourceClosure({
      repository,
      commit,
      closure: policy.closures[key],
      policy,
    });
  return result;
}

export async function verifyFrozenSourceClosures({
  repository = ROOT,
  policy,
}) {
  const result = {};
  for (const key of ["profile", "qualificationAuthority"]) {
    const closure = policy.closures[key],
      observed = await computeSourceClosure({
        repository,
        commit: closure.baseCommit,
        closure,
        policy,
      }),
      expected = expectedClosure(closure);
    if (!deepEqual(observed, expected))
      throw new Error(`Frozen ${key} source closure does not reproduce.`);
    result[key] = observed;
  }
  return result;
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
      { cwd: repository, maxBuffer: 16 * 1024 * 1024 },
    ),
    fields = stdout.split("\0"),
    changes = [];
  for (let index = 0; index < fields.length - 1; ) {
    const rawStatus = fields[index++],
      status = rawStatus[0];
    if (!["A", "D", "M", "R"].includes(status))
      throw new Error("Source-closure diff contains an unsupported status.");
    if (status === "R") {
      const oldPath = fields[index++],
        newPath = fields[index++];
      changes.push({
        status,
        oldPath,
        newPath,
        category: strictestCategory([
          classifySourcePath(oldPath, policy),
          classifySourcePath(newPath, policy),
        ]),
      });
    } else {
      const fileName = fields[index++];
      changes.push({
        status,
        path: fileName,
        category: classifySourcePath(fileName, policy),
      });
    }
  }
  const sorted = changes.sort(compareChangeRows);
  assertCanonicalChangedPaths(sorted, policy);
  return sorted;
}

export async function assessPreliminarySourceAdmission({
  repository = ROOT,
  acceptedAuthorityCommit,
  reviewedControllerCommit,
  policy,
  policySha256,
}) {
  assertPolicy(policy);
  assertCommit(acceptedAuthorityCommit);
  assertCommit(reviewedControllerCommit);
  if (!/^[a-f0-9]{64}$/.test(policySha256))
    throw new Error("Source-closure policy identity is invalid.");
  const acceptedAuthorityIsAncestor = await isAncestor(
      repository,
      acceptedAuthorityCommit,
      reviewedControllerCommit,
    ),
    accepted = await computeApprovedSourceClosures({
      repository,
      commit: acceptedAuthorityCommit,
      policy,
    }),
    reviewed = await computeApprovedSourceClosures({
      repository,
      commit: reviewedControllerCommit,
      policy,
    }),
    changedPaths = await changedSourcePaths({
      repository,
      from: acceptedAuthorityCommit,
      to: reviewedControllerCommit,
      policy,
    }),
    expected = {
      profile: expectedClosure(policy.closures.profile),
      qualificationAuthority: expectedClosure(
        policy.closures.qualificationAuthority,
      ),
    },
    acceptedAuthorityMatchesPolicy =
      acceptedAuthorityCommit ===
        policy.closures.qualificationAuthority.baseCommit &&
      deepEqual(accepted, expected);
  let decision = sourceClosureDecision(changedPaths);
  if (!acceptedAuthorityIsAncestor || !acceptedAuthorityMatchesPolicy)
    decision = "api-impact-review-required";
  else if (!deepEqual(accepted.profile, reviewed.profile))
    decision = "profile-qualification-required";
  else if (
    !deepEqual(
      accepted.qualificationAuthority,
      reviewed.qualificationAuthority,
    ) &&
    decision !== "profile-qualification-required"
  )
    decision = "aggregate-api-renewal-required";
  return {
    schemaVersion: 1,
    artifactKind: "preliminary-source-admission",
    policy: {
      policyId: policy.policyId,
      fileName: SOURCE_CLOSURE_POLICY_PATH,
      sha256: policySha256,
    },
    acceptedAuthorityCommit,
    reviewedControllerCommit,
    acceptedAuthorityIsAncestor,
    acceptedAuthorityMatchesPolicy,
    closures: {
      accepted,
      reviewed,
      unchanged: {
        profile: deepEqual(accepted.profile, reviewed.profile),
        qualificationAuthority: deepEqual(
          accepted.qualificationAuthority,
          reviewed.qualificationAuthority,
        ),
      },
    },
    changedPaths,
    changedPathsSha256: canonicalObjectSha256(changedPaths),
    decision,
  };
}

export function assertCanonicalChangedPaths(changes, policy) {
  if (!Array.isArray(changes))
    throw new Error("Source-closure changed paths must be an array.");
  const seen = new Set();
  for (const item of changes) {
    const keys = Object.keys(item),
      rename = item.status === "R",
      expectedKeys = rename
        ? ["status", "oldPath", "newPath", "category"]
        : ["status", "path", "category"];
    if (!deepEqual(keys.sort(compareUtf8), expectedKeys.sort(compareUtf8)))
      throw new Error("Source-closure changed row is not canonical.");
    if (rename) {
      if (
        !isCanonicalRepositoryPath(item.oldPath) ||
        !isCanonicalRepositoryPath(item.newPath) ||
        item.category !==
          strictestCategory([
            classifySourcePath(item.oldPath, policy),
            classifySourcePath(item.newPath, policy),
          ])
      )
        throw new Error("Source-closure rename row is invalid.");
    } else if (
      !["A", "D", "M"].includes(item.status) ||
      !isCanonicalRepositoryPath(item.path) ||
      item.category !== classifySourcePath(item.path, policy)
    )
      throw new Error("Source-closure changed row is invalid.");
    const key = canonicalJson(item);
    if (seen.has(key))
      throw new Error("Source-closure changed rows contain a duplicate.");
    seen.add(key);
  }
  for (let index = 1; index < changes.length; index++)
    if (compareChangeRows(changes[index - 1], changes[index]) >= 0)
      throw new Error("Source-closure changed rows are not canonical.");
}

export function sourceClosureDecision(changes) {
  const category = strictestCategory(changes.map((item) => item.category));
  return ["release-pipeline-only", "documentation-or-record-only"].includes(
    category,
  )
    ? "reuse-permitted"
    : category;
}

export function canonicalObjectSha256(value) {
  return sha256(Buffer.from(canonicalJson(value)));
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value)
    .sort(compareUtf8)
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

async function gitInventory(repository, commit) {
  const { stdout } = await run(
    "git",
    ["ls-tree", "-r", "-z", "--full-tree", commit],
    { cwd: repository, maxBuffer: 32 * 1024 * 1024 },
  );
  const entries = stdout
    .split("\0")
    .filter(Boolean)
    .map((line) => {
      const match = /^(\d{6}) blob ([a-f0-9]{40})\t(.+)$/.exec(line);
      if (
        !match ||
        !["100644", "100755"].includes(match[1]) ||
        !isCanonicalRepositoryPath(match[3])
      )
        throw new Error("Git source closure contains an unsupported entry.");
      return { path: match[3], mode: match[1], object: match[2] };
    })
    .sort((left, right) => compareUtf8(left.path, right.path));
  const folded = new Set();
  for (const entry of entries) {
    const key = entry.path.normalize("NFC").toLocaleLowerCase("en-US");
    if (folded.has(key))
      throw new Error("Git source closure contains a case-fold collision.");
    folded.add(key);
  }
  return entries;
}

async function materializeBlobDigests(repository, entries) {
  const result = [];
  for (const entry of entries) {
    const { stdout: bytes } = await run(
      "git",
      ["cat-file", "blob", entry.object],
      { cwd: repository, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 },
    );
    result.push({
      path: entry.path,
      mode: entry.mode,
      blobSha256: sha256(bytes),
    });
  }
  return result;
}

async function isAncestor(repository, ancestor, descendant) {
  return run("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
    cwd: repository,
  }).then(
    () => true,
    () => false,
  );
}

function strictestCategory(categories, fallback = "release-pipeline-only") {
  const present = new Set(categories);
  return DECISION_ORDER.find((category) => present.has(category)) ?? fallback;
}

function expectedClosure(closure) {
  return {
    closureId: closure.closureId,
    inventorySha256: closure.inventorySha256,
    treeSha256: closure.treeSha256,
  };
}

function compareChangeRows(left, right) {
  return compareUtf8(changeSortKey(left), changeSortKey(right));
}

function changeSortKey(item) {
  return item.status === "R"
    ? `${item.status}\0${item.oldPath}\0${item.newPath}`
    : `${item.status}\0${item.path}`;
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertPolicy(policy) {
  if (
    policy?.schemaVersion !== 1 ||
    policy.policyId !== "voice-runtime-relevant-source-closure-v1" ||
    policy.defaultCategory !== "api-impact-review-required" ||
    new Set(policy.precedence).size !== 4 ||
    !Array.isArray(policy.rules) ||
    !policy.closures?.profile ||
    !policy.closures?.qualificationAuthority
  )
    throw new Error("Relevant Source Closure policy is invalid.");
}

function isCanonicalRepositoryPath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 512 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !value.split("/").some((part) => !part || part === "." || part === "..")
  );
}

function assertCommit(value) {
  if (!/^(?!0{40})[a-f0-9]{40}$/.test(value))
    throw new Error("Source closure commit is invalid.");
}
