import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { sha256 } from "../build/lib/files.mjs";
import {
  compareNames,
  deepEqual,
  ordinaryFileIdentity,
  readValidated,
  validateArtifact,
} from "./release-contract.mjs";

const run = promisify(execFile);

export const RELEASE_ADMISSION_DIRECTORY = "release/admission";
export const RELEASE_SOURCE_ADMISSION_PATH = `${RELEASE_ADMISSION_DIRECTORY}/v1.0.0-release-source-admission-v4.json`;

export const FOCUSED_AUTHORITY_MEMBERS = Object.freeze([
  Object.freeze({
    key: "focusedQualificationSet",
    sourceFileName: "focused-qualification-set-v3.json",
    targetPath: `${RELEASE_ADMISSION_DIRECTORY}/v1.0.0-focused-qualification-set-v3.json`,
    schema: "contracts/release/focused-qualification-set-v3.schema.json",
    label: "Focused Qualification Set 3",
  }),
  Object.freeze({
    key: "branchCatalogProjection",
    sourceFileName: "branch-catalog-projection-v3.json",
    targetPath: `${RELEASE_ADMISSION_DIRECTORY}/v1.0.0-branch-catalog-projection-v3.json`,
    schema: "contracts/catalog/branch-catalog-projection-v3.schema.json",
    label: "Branch Catalog Projection 3",
  }),
  Object.freeze({
    key: "branchCatalogProjectionVerification",
    sourceFileName: "branch-catalog-projection-verification-v3.json",
    targetPath: `${RELEASE_ADMISSION_DIRECTORY}/v1.0.0-branch-catalog-projection-verification-v3.json`,
    schema:
      "contracts/catalog/branch-catalog-projection-verification-v3.schema.json",
    label: "Branch Catalog Projection Verification 3",
  }),
  Object.freeze({
    key: "englishExecutionClosure",
    sourceFileName: "english-profile-execution-closure-v2.json",
    targetPath: `${RELEASE_ADMISSION_DIRECTORY}/v1.0.0-english-profile-execution-closure-v2.json`,
    schema: "contracts/qualification/profile-execution-closure-v2.schema.json",
    label: "English Profile Execution Closure 2",
    profileId: "english",
  }),
  Object.freeze({
    key: "chineseExecutionClosure",
    sourceFileName: "chinese-profile-execution-closure-v2.json",
    targetPath: `${RELEASE_ADMISSION_DIRECTORY}/v1.0.0-chinese-profile-execution-closure-v2.json`,
    schema: "contracts/qualification/profile-execution-closure-v2.schema.json",
    label: "Chinese Profile Execution Closure 2",
    profileId: "chinese",
  }),
]);

export const PROTECTED_ADMISSION_PATHS = Object.freeze(
  [
    RELEASE_SOURCE_ADMISSION_PATH,
    ...FOCUSED_AUTHORITY_MEMBERS.map((member) => member.targetPath),
  ].sort(compareNames),
);

export async function readFocusedAuthorityBundle({
  paths,
  focusedSourceCommit,
  expectedIdentities,
  currentReleaseMatrix,
}) {
  assertCommit(focusedSourceCommit);
  const artifacts = {},
    identities = {};
  for (const member of FOCUSED_AUTHORITY_MEMBERS) {
    const file = paths[member.key];
    if (!file) throw new Error(`Missing ${member.label} path.`);
    artifacts[member.key] = await readValidated(
      file,
      member.schema,
      member.label,
    );
    identities[member.key] = await ordinaryFileIdentity(
      file,
      member.sourceFileName,
    );
    if (
      expectedIdentities &&
      !deepEqual(identities[member.key], expectedIdentities[member.key])
    )
      throw new Error(`${member.label} identity differs from Admission 4.`);
  }

  const qset = artifacts.focusedQualificationSet,
    projection = artifacts.branchCatalogProjection,
    verification = artifacts.branchCatalogProjectionVerification;
  if (
    qset.sourceCommit !== focusedSourceCommit ||
    projection.sourceCommit !== focusedSourceCommit ||
    verification.sourceCommit !== focusedSourceCommit ||
    qset.decision !== "pass" ||
    projection.decision !== "pass" ||
    verification.decision !== "pass" ||
    !sameContentIdentity(
      projection.qualificationSet,
      identities.focusedQualificationSet,
    ) ||
    !sameContentIdentity(
      verification.projection,
      identities.branchCatalogProjection,
    ) ||
    !deepEqual(projection.profiles, qset.profiles)
  )
    throw new Error("Focused aggregate authority is internally inconsistent.");

  const qsetProfiles = exactProfileMap(qset.profiles),
    matrixEntries = exactProfileMap(currentReleaseMatrix.value.entries);
  for (const member of FOCUSED_AUTHORITY_MEMBERS.filter(
    (candidate) => candidate.profileId,
  )) {
    const closure = artifacts[member.key],
      focusedProfile = qsetProfiles.get(member.profileId);
    if (
      closure.profileId !== member.profileId ||
      closure.current.sourceCommit !== focusedSourceCommit ||
      closure.current.modelManifestSha256 !==
        focusedProfile.modelManifest.sha256 ||
      closure.decision !== "reuse-permitted"
    )
      throw new Error(`${member.label} does not authorize focused reuse.`);
  }

  const profiles = ["english", "chinese"].map((profileId) => {
    const focused = qsetProfiles.get(profileId),
      matrix = matrixEntries.get(profileId);
    if (
      focused.modelAdmissionRootSha256 !== matrix.modelAdmissionRoot.sha256 ||
      focused.modelManifest.fileName !== matrix.modelManifest.fileName ||
      focused.modelManifest.sha256 !== matrix.modelManifest.sha256
    )
      throw new Error(`Focused ${profileId} subject differs from Matrix 2.`);
    return {
      profileId,
      hostPackageId: matrix.hostPackageId,
      providerId: matrix.providerId,
      modelAssetId: matrix.modelAssetId,
      hostArchive: focused.hostArchive,
      hostDescriptorSha256: focused.hostDescriptorSha256,
      hostFileManifestSha256: focused.hostFileManifestSha256,
      modelAdmissionRootSha256: focused.modelAdmissionRootSha256,
      modelManifest: focused.modelManifest,
      compatibilityPairSha256: focused.compatibilityPairSha256,
      focusedHostSourceClosure: {
        sizeBytes: focused.hostSourceClosureSizeBytes,
        sha256: focused.hostSourceClosureSha256,
      },
    };
  });
  return { artifacts, identities, profiles };
}

export function focusedAuthorityPathsAtRepository(repository) {
  return Object.fromEntries(
    FOCUSED_AUTHORITY_MEMBERS.map((member) => [
      member.key,
      path.join(repository, member.targetPath),
    ]),
  );
}

export async function gitOrdinaryFileIdentity({
  repository,
  commit,
  relativePath,
  fileName = path.basename(relativePath),
}) {
  assertCommit(commit);
  const entry = await gitTreeEntry(repository, commit, relativePath);
  if (entry.mode !== "100644" || entry.type !== "blob")
    throw new Error(`Git subject is not one ordinary file: ${relativePath}`);
  const bytes = await gitFileBytes(repository, commit, relativePath);
  return { fileName, sizeBytes: bytes.length, sha256: sha256(bytes) };
}

export async function readGitJson({
  repository,
  commit,
  relativePath,
  schema,
  label,
}) {
  const bytes = await gitFileBytes(repository, commit, relativePath);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label} is not JSON in commit ${commit}.`);
  }
  if (schema) await validateArtifact(value, schema, label);
  return value;
}

export async function assertWorkingTreeFileMatchesCommit({
  repository,
  commit,
  relativePath,
}) {
  const gitIdentity = await gitOrdinaryFileIdentity({
      repository,
      commit,
      relativePath,
      fileName: relativePath,
    }),
    workingIdentity = await ordinaryFileIdentity(
      path.join(repository, relativePath),
      relativePath,
    );
  if (!deepEqual(gitIdentity, workingIdentity))
    throw new Error(`Checked-out protected member differs: ${relativePath}`);
  return workingIdentity;
}

export function sameContentIdentity(left, right) {
  return left?.sizeBytes === right?.sizeBytes && left?.sha256 === right?.sha256;
}

export function admissionProfilesMatchFocused(admitted, focused) {
  return deepEqual(
    admitted,
    focused.map((profile) => ({
      ...profile,
      admittedHostSourceClosure: profile.focusedHostSourceClosure,
      equal: true,
    })),
  );
}

export function assertCommit(value) {
  if (!/^(?!0{40})[a-f0-9]{40}$/.test(value))
    throw new Error("Source commit is invalid.");
}

async function gitTreeEntry(repository, commit, relativePath) {
  const { stdout } = await run(
      "git",
      ["ls-tree", "-z", commit, "--", relativePath],
      { cwd: repository, encoding: "utf8" },
    ),
    match = /^(\d+) (\w+) ([a-f0-9]+)\t([^\0]+)\0$/.exec(stdout);
  if (!match || match[4] !== relativePath)
    throw new Error(`Git subject is missing: ${relativePath}`);
  return { mode: match[1], type: match[2], objectId: match[3] };
}

async function gitFileBytes(repository, commit, relativePath) {
  const { stdout } = await run("git", ["show", `${commit}:${relativePath}`], {
    cwd: repository,
    encoding: "buffer",
    maxBuffer: 32 * 1024 * 1024,
  });
  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

function exactProfileMap(rows) {
  const map = new Map(rows.map((row) => [row.profileId, row]));
  if (
    map.size !== 2 ||
    !map.has("english") ||
    !map.has("chinese") ||
    rows.length !== 2
  )
    throw new Error("Authority does not contain the exact two profiles.");
  return map;
}
