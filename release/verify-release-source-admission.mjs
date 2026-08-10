#!/usr/bin/env node
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parsePairs, ROOT } from "../build/lib/files.mjs";
import {
  canonicalDigest,
  deepEqual,
  ordinaryFileIdentity,
  readValidated,
  writeArtifact,
} from "./release-contract.mjs";
import {
  admissionProfilesMatchFocused,
  assertCommit,
  assertWorkingTreeFileMatchesCommit,
  focusedAuthorityPathsAtRepository,
  FOCUSED_AUTHORITY_MEMBERS,
  gitOrdinaryFileIdentity,
  PROTECTED_ADMISSION_PATHS,
  readFocusedAuthorityBundle,
  readGitJson,
  RELEASE_SOURCE_ADMISSION_PATH,
} from "./release-admission-contract.mjs";
import {
  changedSourcePaths,
  isAncestor,
  loadSourceClosurePolicy,
  sourceClosureDecision,
} from "./source-closure.mjs";

const run = promisify(execFile);

export async function verifyReleaseAdmissionLineage({
  repository = ROOT,
  workflowCheckoutCommit,
}) {
  assertCommit(workflowCheckoutCommit);
  await assertMaintainedMainCheckout(repository, workflowCheckoutCommit);
  const admissionPath = path.join(repository, RELEASE_SOURCE_ADMISSION_PATH),
    admission = await readValidated(
      admissionPath,
      "contracts/release/release-source-admission-v4.schema.json",
      "Release Source Admission 4",
    ),
    checkedAdmissionIdentity = await assertWorkingTreeFileMatchesCommit({
      repository,
      commit: workflowCheckoutCommit,
      relativePath: RELEASE_SOURCE_ADMISSION_PATH,
    }),
    admissionIdentity = {
      ...checkedAdmissionIdentity,
      fileName: path.basename(RELEASE_SOURCE_ADMISSION_PATH),
    },
    focusedAncestor = await isAncestor(
      repository,
      admission.focusedSourceCommit,
      admission.admittedSourceCommit,
    ),
    admittedAncestor = await isAncestor(
      repository,
      admission.admittedSourceCommit,
      workflowCheckoutCommit,
    );
  if (
    admission.decision !== "reuse-permitted" ||
    !admission.ancestryVerified ||
    !focusedAncestor ||
    !admittedAncestor
  )
    throw new Error("Release Admission 4 source lineage is invalid.");

  const authorityPromotionCommit = await deriveAuthorityPromotionCommit({
      repository,
      admittedSourceCommit: admission.admittedSourceCommit,
      workflowCheckoutCommit,
    }),
    protectedMembers = await verifyProtectedLineage({
      repository,
      authorityPromotionCommit,
      workflowCheckoutCommit,
    }),
    { value: policy, identity: policyIdentity } = await loadSourceClosurePolicy(
      {
        repository,
        commit: workflowCheckoutCommit,
      },
    ),
    admittedChanges = await changedSourcePaths({
      repository,
      from: admission.focusedSourceCommit,
      to: admission.admittedSourceCommit,
      policy,
    }),
    postPromotionChanges = await changedSourcePaths({
      repository,
      from: authorityPromotionCommit,
      to: workflowCheckoutCommit,
      policy,
    }),
    matrixRelative = "contracts/catalog/current-release-matrix-v2.json",
    matrix = {
      value: await readGitJson({
        repository,
        commit: workflowCheckoutCommit,
        relativePath: matrixRelative,
        schema: "contracts/catalog/current-release-matrix-v2.schema.json",
        label: "Current Release Matrix 2",
      }),
      identity: await gitOrdinaryFileIdentity({
        repository,
        commit: workflowCheckoutCommit,
        relativePath: matrixRelative,
      }),
    },
    expectedIdentities = Object.fromEntries(
      FOCUSED_AUTHORITY_MEMBERS.map((member) => [
        member.key,
        admission[member.key],
      ]),
    ),
    authority = await readFocusedAuthorityBundle({
      paths: focusedAuthorityPathsAtRepository(repository),
      focusedSourceCommit: admission.focusedSourceCommit,
      expectedIdentities,
      currentReleaseMatrix: matrix,
    });
  if (
    !deepEqual(admission.sourceClosurePolicy, policyIdentity) ||
    !deepEqual(admission.currentReleaseMatrix, matrix.identity) ||
    !deepEqual(admission.changedPaths, admittedChanges) ||
    admission.changedPathsSha256 !== canonicalDigest(admittedChanges) ||
    sourceClosureDecision(admittedChanges) !== "reuse-permitted" ||
    sourceClosureDecision(postPromotionChanges) !== "reuse-permitted" ||
    !admissionProfilesMatchFocused(admission.profiles, authority.profiles)
  )
    throw new Error("Release Admission 4 independent subject check failed.");

  return {
    admission,
    admissionPath,
    admissionIdentity,
    authorityPromotionCommit,
    protectedMembers,
    policyIdentity,
    admittedChanges,
    postPromotionChanges,
    booleans: {
      focusedAncestorOfAdmitted: true,
      admittedAncestorOfPromotion: true,
      promotionSingleParent: true,
      promotionDirectChild: true,
      promotionExactAdditions: true,
      promotionUnique: true,
      promotionAncestorOfWorkflow: true,
      workflowCheckoutVerified: true,
      maintainedMainVerified: true,
      protectedMembersImmutable: true,
    },
  };
}

export async function verifyReleaseSourceAdmission({
  repository = ROOT,
  workflowCheckoutCommit,
  checkoutHostClosures,
  output,
}) {
  const lineage = await verifyReleaseAdmissionLineage({
      repository,
      workflowCheckoutCommit,
    }),
    profiles = [];
  for (const admitted of lineage.admission.profiles) {
    const observed = checkoutHostClosures.find(
      (item) => item.profileId === admitted.profileId,
    );
    if (!observed?.file)
      throw new Error(`Missing ${admitted.profileId} checkout host closure.`);
    const closure = await readValidated(
        observed.file,
        "contracts/package/host-source-closure-v1.schema.json",
        "Host Source Closure 1",
      ),
      identity = await ordinaryFileIdentity(observed.file);
    if (closure.profileId !== admitted.profileId)
      throw new Error("Checkout Host Source Closure profile mismatch.");
    const checkout = {
      sizeBytes: identity.sizeBytes,
      sha256: identity.sha256,
    };
    if (
      !deepEqual(admitted.focusedHostSourceClosure, checkout) ||
      !deepEqual(admitted.admittedHostSourceClosure, checkout)
    )
      throw new Error("Checkout Host Source Closure differs from admission.");
    profiles.push({
      profileId: admitted.profileId,
      focusedHostSourceClosure: admitted.focusedHostSourceClosure,
      admittedHostSourceClosure: admitted.admittedHostSourceClosure,
      workflowHostSourceClosure: checkout,
      focusedToAdmittedEqual: true,
      admittedToWorkflowEqual: true,
    });
  }
  const value = {
    schemaVersion: 1,
    artifactKind: "release-admission-verification",
    releaseSourceAdmission: lineage.admissionIdentity,
    focusedSourceCommit: lineage.admission.focusedSourceCommit,
    admittedSourceCommit: lineage.admission.admittedSourceCommit,
    authorityPromotionCommit: lineage.authorityPromotionCommit,
    workflowCheckoutCommit,
    sourceClosurePolicy: lineage.policyIdentity,
    protectedMembers: lineage.protectedMembers,
    admittedRange: {
      changedPaths: lineage.admittedChanges,
      changedPathsSha256: canonicalDigest(lineage.admittedChanges),
      decision: sourceClosureDecision(lineage.admittedChanges),
    },
    postPromotionRange: {
      changedPaths: lineage.postPromotionChanges,
      changedPathsSha256: canonicalDigest(lineage.postPromotionChanges),
      decision: sourceClosureDecision(lineage.postPromotionChanges),
    },
    profiles,
    checks: lineage.booleans,
    decision: "pass",
  };
  return writeArtifact(
    output,
    value,
    "contracts/release/release-admission-verification-v1.schema.json",
    "Release Admission Verification 1",
  );
}

async function deriveAuthorityPromotionCommit({
  repository,
  admittedSourceCommit,
  workflowCheckoutCommit,
}) {
  const commits = await ancestryCommits(
      repository,
      admittedSourceCommit,
      workflowCheckoutCommit,
    ),
    candidates = [];
  for (const commit of commits) {
    const parents = await commitParents(repository, commit);
    if (
      parents.length === 1 &&
      parents[0] === admittedSourceCommit &&
      (await hasExactPromotionDelta(repository, admittedSourceCommit, commit))
    )
      candidates.push(commit);
  }
  if (candidates.length !== 1)
    throw new Error("Unique direct-child authority promotion was not found.");
  return candidates[0];
}

async function hasExactPromotionDelta(repository, parent, commit) {
  const rows = await rawChanges(repository, parent, commit);
  return deepEqual(
    rows,
    PROTECTED_ADMISSION_PATHS.map((relativePath) => ({
      status: "A",
      path: relativePath,
    })),
  );
}

async function verifyProtectedLineage({
  repository,
  authorityPromotionCommit,
  workflowCheckoutCommit,
}) {
  const promotionParents = await commitParents(
    repository,
    authorityPromotionCommit,
  );
  if (promotionParents.length !== 1)
    throw new Error("Authority promotion must have exactly one parent.");
  if (
    !(await isAncestor(
      repository,
      authorityPromotionCommit,
      workflowCheckoutCommit,
    ))
  )
    throw new Error("Workflow checkout does not descend from promotion.");

  for (const relativePath of PROTECTED_ADMISSION_PATHS) {
    const promoted = await gitBlobId(
        repository,
        authorityPromotionCommit,
        relativePath,
      ),
      current = await gitBlobId(
        repository,
        workflowCheckoutCommit,
        relativePath,
      );
    if (promoted !== current)
      throw new Error(`Protected authority changed: ${relativePath}`);
  }
  const later = await ancestryCommits(
    repository,
    authorityPromotionCommit,
    workflowCheckoutCommit,
  );
  for (const commit of later) {
    for (const parent of await commitParents(repository, commit)) {
      if (!(await isAncestor(repository, authorityPromotionCommit, parent)))
        continue;
      for (const relativePath of PROTECTED_ADMISSION_PATHS)
        if (
          (await gitBlobId(repository, commit, relativePath)) !==
          (await gitBlobId(repository, parent, relativePath))
        )
          throw new Error(
            `Protected authority mutated on R-bearing lineage: ${relativePath}`,
          );
    }
  }
  const identities = [];
  for (const relativePath of PROTECTED_ADMISSION_PATHS)
    identities.push(
      await assertWorkingTreeFileMatchesCommit({
        repository,
        commit: workflowCheckoutCommit,
        relativePath,
      }),
    );
  return identities;
}

async function assertMaintainedMainCheckout(repository, expectedCommit) {
  const head = await revParse(repository, "HEAD"),
    maintainedMain = await revParse(repository, "origin/main"),
    trackedStatus = (
      await run("git", ["status", "--porcelain=v1", "--untracked-files=no"], {
        cwd: repository,
      })
    ).stdout;
  if (
    head !== expectedCommit ||
    maintainedMain !== expectedCommit ||
    trackedStatus !== ""
  )
    throw new Error("Workflow checkout is not clean maintained main W.");
}

async function ancestryCommits(repository, from, to) {
  if (from === to) return [];
  const stdout = (
    await run(
      "git",
      ["rev-list", "--ancestry-path", "--reverse", `${from}..${to}`],
      { cwd: repository },
    )
  ).stdout.trim();
  return stdout ? stdout.split("\n") : [];
}

async function commitParents(repository, commit) {
  const line = (
    await run("git", ["show", "-s", "--format=%P", commit], {
      cwd: repository,
    })
  ).stdout.trim();
  return line ? line.split(" ") : [];
}

async function rawChanges(repository, from, to) {
  const { stdout } = await run(
      "git",
      ["diff", "--name-status", "--no-renames", "-z", from, to],
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

async function gitBlobId(repository, commit, relativePath) {
  return revParse(repository, `${commit}:${relativePath}`);
}

async function revParse(repository, subject) {
  return (
    await run("git", ["rev-parse", "--verify", subject], { cwd: repository })
  ).stdout.trim();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const modeIndex = process.argv.indexOf("--mode"),
    mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : null;
  if (mode === "lineage") {
    const args = parsePairs(process.argv.slice(2), [
      "repository",
      "workflow-checkout-commit",
      "mode",
    ]);
    await verifyReleaseAdmissionLineage({
      repository: args.repository,
      workflowCheckoutCommit: args["workflow-checkout-commit"],
    });
  } else if (mode === "complete") {
    const args = parsePairs(process.argv.slice(2), [
      "repository",
      "workflow-checkout-commit",
      "mode",
      "english-host-source-closure",
      "chinese-host-source-closure",
      "output",
    ]);
    await verifyReleaseSourceAdmission({
      repository: args.repository,
      workflowCheckoutCommit: args["workflow-checkout-commit"],
      checkoutHostClosures: [
        { profileId: "english", file: args["english-host-source-closure"] },
        { profileId: "chinese", file: args["chinese-host-source-closure"] },
      ],
      output: args.output,
    });
  } else throw new Error("Release admission verifier mode is invalid.");
}
