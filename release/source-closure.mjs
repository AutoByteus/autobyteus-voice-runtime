import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readJson, ROOT, sha256, shaFile } from "../build/lib/files.mjs";

const run = promisify(execFile);
export const SOURCE_CLOSURE_POLICY_PATH =
  "contracts/release/relevant-source-closure-v1.json";

export async function loadSourceClosurePolicy() {
  const policy = await readJson(path.join(ROOT, SOURCE_CLOSURE_POLICY_PATH));
  assertPolicy(policy);
  return {
    value: policy,
    sha256: await shaFile(path.join(ROOT, SOURCE_CLOSURE_POLICY_PATH)),
  };
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
  return (
    policy.precedence.find((category) => matches.has(category)) ??
    policy.defaultCategory
  );
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
      expected = {
        closureId: closure.closureId,
        inventorySha256: closure.inventorySha256,
        treeSha256: closure.treeSha256,
      };
    if (JSON.stringify(observed) !== JSON.stringify(expected))
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
  );
  const fields = stdout.split("\0"),
    changes = [];
  for (let index = 0; index < fields.length - 1; ) {
    const status = fields[index++],
      previousPath = /^[RC]/.test(status) ? fields[index++] : null,
      fileName = fields[index++];
    for (const subject of [previousPath, fileName].filter(Boolean))
      changes.push({
        status,
        path: subject,
        category: classifySourcePath(subject, policy),
      });
  }
  return changes.sort((left, right) =>
    Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)),
  );
}

export function sourceClosureDecision(changes) {
  const categories = new Set(changes.map((item) => item.category));
  if (categories.has("profile-qualification-required"))
    return "profile-qualification-required";
  if (categories.has("aggregate-api-renewal-required"))
    return "aggregate-api-renewal-required";
  if (categories.has("api-impact-review-required"))
    return "api-impact-review-required";
  return "reuse-permitted";
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
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)),
    );
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
      {
        cwd: repository,
        encoding: "buffer",
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    result.push({
      path: entry.path,
      mode: entry.mode,
      blobSha256: sha256(bytes),
    });
  }
  return result;
}

function assertPolicy(policy) {
  if (
    policy?.schemaVersion !== 1 ||
    policy.policyId !== "voice-runtime-relevant-source-closure-v1" ||
    policy.defaultCategory !== "api-impact-review-required" ||
    new Set(policy.precedence).size !== 4 ||
    !Array.isArray(policy.rules)
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
