#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import {
  CANDIDATE_MANIFEST_PATH,
  verifyQualifiedCandidate,
} from "./qualified-release-candidate.mjs";
import {
  changedSourcePaths,
  computeApprovedSourceClosures,
  loadSourceClosurePolicy,
  sourceClosureDecision,
  verifyFrozenSourceClosures,
} from "./source-closure.mjs";

const run = promisify(execFile);

export async function assessQualifiedCandidate({
  candidate,
  promotionRecord,
  finalMainCommit,
  repository = ROOT,
  output,
}) {
  const root = path.resolve(candidate),
    manifest = await verifyQualifiedCandidate(root),
    promotion = await readJson(path.resolve(promotionRecord)),
    approvalCommit = manifest.approval.apiApprovalCommit,
    { value: policy, sha256: policySha256 } = await loadSourceClosurePolicy(),
    frozen = await verifyFrozenSourceClosures({ repository, policy }),
    approvalReachable = await isAncestor(
      repository,
      approvalCommit,
      finalMainCommit,
    ),
    accepted = await computeApprovedSourceClosures({
      repository,
      commit: approvalCommit,
      policy,
    }),
    finalMain = await computeApprovedSourceClosures({
      repository,
      commit: finalMainCommit,
      policy,
    }),
    changedPaths = await changedSourcePaths({
      repository,
      from: approvalCommit,
      to: finalMainCommit,
      policy,
    }),
    promotionIdentity = await fileIdentity(promotionRecord, "v1.0.0.json");
  await validatePromotionRecord(promotion);
  const manifestPath = path.join(root, CANDIDATE_MANIFEST_PATH),
    manifestInfo = await fs.stat(manifestPath),
    manifestSha256 = await shaFile(manifestPath),
    promotionBound =
      promotion.workflow.headSha === approvalCommit &&
      promotion.artifact.name ===
        `qualified-release-candidate-v1.0.0-${approvalCommit}` &&
      promotion.candidateManifest.sizeBytes === manifestInfo.size &&
      promotion.candidateManifest.sha256 === manifestSha256;
  let decision = sourceClosureDecision(changedPaths);
  if (
    !approvalReachable ||
    !promotionBound ||
    JSON.stringify(accepted) !== JSON.stringify(manifest.sourceClosures) ||
    JSON.stringify(accepted) !== JSON.stringify(frozen) ||
    promotion.candidateManifest.sha256 !== manifestSha256
  )
    decision = "api-impact-review-required";
  if (JSON.stringify(finalMain.profile) !== JSON.stringify(frozen.profile))
    decision = "profile-qualification-required";
  else if (
    JSON.stringify(finalMain.qualificationAuthority) !==
      JSON.stringify(frozen.qualificationAuthority) &&
    decision !== "profile-qualification-required"
  )
    decision = "aggregate-api-renewal-required";
  const result = {
    schemaVersion: 1,
    artifactKind: "release-candidate-applicability",
    repository: "AutoByteus/autobyteus-voice-runtime",
    candidateManifest: {
      fileName: CANDIDATE_MANIFEST_PATH,
      sizeBytes: manifestInfo.size,
      sha256: manifestSha256,
    },
    promotionRecord: promotionIdentity,
    approvalCommit,
    finalMainCommit,
    approvalReachable,
    policy: {
      policyId: policy.policyId,
      fileName: "relevant-source-closure-v1.json",
      sha256: policySha256,
    },
    closures: {
      profile: closureComparison(frozen.profile, finalMain.profile),
      qualificationAuthority: closureComparison(
        frozen.qualificationAuthority,
        finalMain.qualificationAuthority,
      ),
    },
    changedPaths,
    decision,
  };
  await validate(result);
  await writeJson(path.resolve(output), result);
  if (decision !== "reuse-permitted")
    throw new Error(`Candidate applicability is ${decision}.`);
  return result;
}

export async function verifyCandidateApplicability({
  candidate,
  promotionRecord,
  applicability,
  finalMainCommit,
  repository = ROOT,
}) {
  const expectedPath = `${path.resolve(applicability)}.recomputed`;
  try {
    await assessQualifiedCandidate({
      candidate,
      promotionRecord,
      finalMainCommit,
      repository,
      output: expectedPath,
    });
    const observed = await fs.readFile(applicability),
      expected = await fs.readFile(expectedPath);
    if (!observed.equals(expected))
      throw new Error("Candidate applicability does not recompute exactly.");
    return await readJson(applicability);
  } finally {
    await fs.rm(expectedPath, { force: true });
  }
}

function closureComparison(accepted, finalMain) {
  return {
    accepted,
    finalMain,
    unchanged: JSON.stringify(accepted) === JSON.stringify(finalMain),
  };
}

async function isAncestor(repository, ancestor, descendant) {
  try {
    await run("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: repository,
    });
    return true;
  } catch {
    return false;
  }
}

async function validate(value) {
  const schema = await readJson(
      path.join(
        ROOT,
        "contracts/release/release-candidate-applicability-v1.schema.json",
      ),
    ),
    ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const check = ajv.compile(schema);
  if (!check(value))
    throw new Error(
      `Candidate Applicability invalid: ${JSON.stringify(check.errors)}`,
    );
}

async function validatePromotionRecord(value) {
  const schema = await readJson(
      path.join(
        ROOT,
        "contracts/release/candidate-promotion-record-v1.schema.json",
      ),
    ),
    ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const check = ajv.compile(schema);
  if (!check(value))
    throw new Error(
      `Candidate Promotion Record invalid: ${JSON.stringify(check.errors)}`,
    );
}

async function fileIdentity(file, fileName) {
  const resolved = path.resolve(file),
    info = await fs.lstat(resolved);
  if (!info.isFile() || info.isSymbolicLink())
    throw new Error("Applicability input is not an ordinary file.");
  return { fileName, sizeBytes: info.size, sha256: await shaFile(resolved) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "candidate",
    "promotion-record",
    "final-main-commit",
    "output",
  ]);
  await assessQualifiedCandidate({
    candidate: args.candidate,
    promotionRecord: args["promotion-record"],
    finalMainCommit: args["final-main-commit"],
    output: args.output,
  });
}
