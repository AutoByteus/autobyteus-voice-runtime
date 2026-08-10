#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parsePairs, ROOT } from "../build/lib/files.mjs";
import {
  canonicalDigest,
  deepEqual,
  ordinaryFileIdentity,
  readValidated,
} from "./release-contract.mjs";
import {
  admissionProfilesMatchFocused,
  assertCommit,
  FOCUSED_AUTHORITY_MEMBERS,
  gitOrdinaryFileIdentity,
  PROTECTED_ADMISSION_PATHS,
  readFocusedAuthorityBundle,
  readGitJson,
  RELEASE_SOURCE_ADMISSION_PATH,
  sameContentIdentity,
} from "./release-admission-contract.mjs";
import {
  changedSourcePaths,
  isAncestor,
  loadSourceClosurePolicy,
  sourceClosureDecision,
} from "./source-closure.mjs";

const run = promisify(execFile);

export async function promoteReleaseAuthority({
  repository = ROOT,
  admission,
  focusedAuthorities,
  apiChecksums,
}) {
  const value = await readValidated(
    admission,
    "contracts/release/release-source-admission-v4.schema.json",
    "Release Source Admission 4",
  );
  assertCommit(value.admittedSourceCommit);
  await assertCleanAdmittedCheckout(repository, value.admittedSourceCommit);
  const validation = await validateAdmittedAuthority({
    repository,
    admission: value,
    focusedAuthorities,
  });
  await verifyApiChecksumAuthority(
    apiChecksums,
    FOCUSED_AUTHORITY_MEMBERS.map((member) => ({
      file: focusedAuthorities[member.key],
      identity: validation.authority.identities[member.key],
    })),
  );

  for (const relativePath of PROTECTED_ADMISSION_PATHS)
    await assertAbsent(path.join(repository, relativePath));
  const targetDirectory = path.join(
    repository,
    path.dirname(RELEASE_SOURCE_ADMISSION_PATH),
  );
  await fs.mkdir(targetDirectory, { recursive: true });
  await fs.copyFile(
    admission,
    path.join(repository, RELEASE_SOURCE_ADMISSION_PATH),
  );
  for (const member of FOCUSED_AUTHORITY_MEMBERS)
    await fs.copyFile(
      focusedAuthorities[member.key],
      path.join(repository, member.targetPath),
    );

  for (const member of FOCUSED_AUTHORITY_MEMBERS) {
    const promoted = await ordinaryFileIdentity(
      path.join(repository, member.targetPath),
    );
    if (
      !sameContentIdentity(
        promoted,
        validation.authority.identities[member.key],
      )
    )
      throw new Error(`${member.label} changed during authority promotion.`);
  }
  await run("git", ["add", "--", ...PROTECTED_ADMISSION_PATHS], {
    cwd: repository,
  });
  const staged = await stagedChanges(repository);
  if (
    !deepEqual(
      staged,
      PROTECTED_ADMISSION_PATHS.map((relativePath) => ({
        status: "A",
        path: relativePath,
      })),
    )
  )
    throw new Error(
      "Authority promotion did not stage the exact six additions.",
    );
  return { admittedSourceCommit: value.admittedSourceCommit, staged };
}

async function validateAdmittedAuthority({
  repository,
  admission,
  focusedAuthorities,
}) {
  const { value: policy, identity: policyIdentity } =
      await loadSourceClosurePolicy({
        repository,
        commit: admission.admittedSourceCommit,
      }),
    matrixRelative = "contracts/catalog/current-release-matrix-v2.json",
    matrix = {
      value: await readGitJson({
        repository,
        commit: admission.admittedSourceCommit,
        relativePath: matrixRelative,
        schema: "contracts/catalog/current-release-matrix-v2.schema.json",
        label: "Current Release Matrix 2",
      }),
      identity: await gitOrdinaryFileIdentity({
        repository,
        commit: admission.admittedSourceCommit,
        relativePath: matrixRelative,
      }),
    },
    changes = await changedSourcePaths({
      repository,
      from: admission.focusedSourceCommit,
      to: admission.admittedSourceCommit,
      policy,
    }),
    ancestor = await isAncestor(
      repository,
      admission.focusedSourceCommit,
      admission.admittedSourceCommit,
    ),
    expectedIdentities = Object.fromEntries(
      FOCUSED_AUTHORITY_MEMBERS.map((member) => [
        member.key,
        admission[member.key],
      ]),
    ),
    authority = await readFocusedAuthorityBundle({
      paths: focusedAuthorities,
      focusedSourceCommit: admission.focusedSourceCommit,
      expectedIdentities,
      currentReleaseMatrix: matrix,
    });
  if (
    admission.decision !== "reuse-permitted" ||
    !admission.ancestryVerified ||
    !ancestor ||
    !deepEqual(admission.sourceClosurePolicy, policyIdentity) ||
    !deepEqual(admission.currentReleaseMatrix, matrix.identity) ||
    !deepEqual(admission.changedPaths, changes) ||
    admission.changedPathsSha256 !== canonicalDigest(changes) ||
    sourceClosureDecision(changes) !== "reuse-permitted" ||
    !admissionProfilesMatchFocused(admission.profiles, authority.profiles)
  )
    throw new Error("Release Source Admission 4 does not admit source D.");
  return { authority };
}

async function verifyApiChecksumAuthority(file, subjects) {
  await ordinaryFileIdentity(file);
  const text = await fs.readFile(path.resolve(file), "utf8"),
    rows = text
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const match = /^([a-f0-9]{64})  \.\/([^\r\n]+)$/.exec(line);
        if (!match)
          throw new Error("API checksum authority grammar is invalid.");
        return { sha256: match[1], path: match[2] };
      });
  for (const subject of subjects) {
    const expectedName = path.basename(subject.file),
      matches = rows.filter((row) => path.basename(row.path) === expectedName);
    if (matches.length !== 1 || matches[0].sha256 !== subject.identity.sha256)
      throw new Error(`API checksum authority does not bind ${expectedName}.`);
  }
}

async function assertCleanAdmittedCheckout(repository, admittedSourceCommit) {
  const head = (
      await run("git", ["rev-parse", "HEAD"], { cwd: repository })
    ).stdout.trim(),
    status = (
      await run("git", ["status", "--porcelain=v1"], { cwd: repository })
    ).stdout;
  if (head !== admittedSourceCommit || status !== "")
    throw new Error("Authority promotion requires clean HEAD exactly at D.");
}

async function assertAbsent(file) {
  try {
    await fs.lstat(file);
    throw new Error(`Protected authority path already exists: ${file}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function stagedChanges(repository) {
  const { stdout } = await run(
      "git",
      ["diff", "--cached", "--name-status", "--no-renames", "-z", "HEAD"],
      { cwd: repository },
    ),
    fields = stdout.split("\0").filter(Boolean),
    rows = [];
  for (let index = 0; index < fields.length; index += 2)
    rows.push({ status: fields[index], path: fields[index + 1] });
  return rows.sort((left, right) =>
    Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "repository",
    "admission",
    "focused-qualification-set",
    "branch-projection",
    "projection-verification",
    "english-execution-closure",
    "chinese-execution-closure",
    "api-checksums",
  ]);
  await promoteReleaseAuthority({
    repository: args.repository,
    admission: args.admission,
    focusedAuthorities: {
      focusedQualificationSet: args["focused-qualification-set"],
      branchCatalogProjection: args["branch-projection"],
      branchCatalogProjectionVerification: args["projection-verification"],
      englishExecutionClosure: args["english-execution-closure"],
      chineseExecutionClosure: args["chinese-execution-closure"],
    },
    apiChecksums: args["api-checksums"],
  });
}
