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
} from "../../build/lib/files.mjs";
import {
  CANDIDATE_MANIFEST_PATH,
  verifyQualifiedCandidate,
} from "../qualified-release-candidate.mjs";
import { verifyCandidateApplicability } from "../assess-qualified-candidate.mjs";
import { loadSourceClosurePolicy } from "../source-closure.mjs";
import {
  assertExactMatrixRows,
  loadCurrentReleaseMatrix,
} from "../current-release-matrix.mjs";

const run = promisify(execFile);

export async function assembleReleaseEvidence({
  candidate,
  promotionRecord,
  applicability,
  runtimeVersion,
  releaseTag,
  maintainedMainCommit,
  output,
}) {
  assertReleaseIdentity(runtimeVersion, releaseTag, maintainedMainCommit);
  const candidateRoot = path.resolve(candidate),
    manifest = await verifyQualifiedCandidate(candidateRoot),
    promotion = await readAndValidate(
      promotionRecord,
      "contracts/release/candidate-promotion-record-v1.schema.json",
      "Candidate Promotion Record",
      true,
    ),
    applicabilityValue = await verifyCandidateApplicability({
      candidate: candidateRoot,
      promotionRecord,
      applicability,
      finalMainCommit: maintainedMainCommit,
    }),
    qsetPath = path.join(candidateRoot, "qualification-set-v2.json"),
    qset = await readAndValidate(
      qsetPath,
      "contracts/release/qualification-set-v2.schema.json",
      "Qualification Set",
    ),
    matrix = await loadCurrentReleaseMatrix(),
    { value: closurePolicy, sha256: closurePolicySha256 } =
      await loadSourceClosurePolicy();
  if (
    manifest.packageVersion !== runtimeVersion ||
    manifest.decision !== "promoted" ||
    promotion.candidateManifest.sha256 !==
      (await shaFile(path.join(candidateRoot, CANDIDATE_MANIFEST_PATH))) ||
    applicabilityValue.decision !== "reuse-permitted" ||
    applicabilityValue.finalMainCommit !== maintainedMainCommit ||
    qset.functionalDecision !== "pass" ||
    qset.releaseMatrix.sha256 !== matrix.sha256 ||
    JSON.stringify(qset.releaseMatrix) !==
      JSON.stringify(manifest.releaseMatrix) ||
    JSON.stringify(qset.profileResourcePolicy) !==
      JSON.stringify(matrix.value.profileResourcePolicy)
  )
    throw new Error("Verified candidate release binding mismatch.");
  assertExactMatrixRows(matrix.value, qset.profiles);
  await assertTagAbsent(releaseTag);
  const history = await readJson(
    path.join(ROOT, "release/evidence/candidate-history-v1.json"),
  );
  for (const item of history.candidates)
    if (
      (await shaFile(
        path.join(ROOT, "evidence/selection-study", item.resultPath),
      )) !== item.resultDigest
    )
      throw new Error(`Candidate evidence mismatch: ${item.candidateId}`);
  const evidence = {
    schemaVersion: 2,
    artifactKind: "release-qualification-evidence",
    intendedRelease: { runtimeVersion, releaseTag },
    sourceCommit: maintainedMainCommit,
    runnerCommit: qset.runnerCommit,
    testCommit: qset.testCommit,
    qualifiedSourceCommit: qset.sourceCommit,
    qualificationAuthority: {
      sourceCommit: qset.sourceCommit,
      runnerCommit: qset.runnerCommit,
      testCommit: qset.testCommit,
      apiApprovalCommit: manifest.approval.apiApprovalCommit,
      apiRevision: manifest.approval.apiRevision,
    },
    candidatePromotionRecord: await fileIdentity(
      promotionRecord,
      "v1.0.0.json",
    ),
    qualifiedCandidate: await fileIdentity(
      path.join(candidateRoot, CANDIDATE_MANIFEST_PATH),
      CANDIDATE_MANIFEST_PATH,
    ),
    sourceClosure: {
      policy: {
        policyId: closurePolicy.policyId,
        fileName: "relevant-source-closure-v1.json",
        sha256: closurePolicySha256,
      },
      applicability: {
        ...(await fileIdentity(
          applicability,
          "release-candidate-applicability-v1.json",
        )),
        decision: "reuse-permitted",
      },
    },
    releaseMatrix: qset.releaseMatrix,
    profileResourcePolicy: qset.profileResourcePolicy,
    qualificationSet: await fileIdentity(qsetPath, "qualification-set-v2.json"),
    mainReachability: {
      maintainedMainCommit,
      releaseCommit: manifest.approval.apiApprovalCommit,
      reachable: true,
    },
    selectionStudy: {
      id: history.selectionStudyId,
      sha256: await shaFile(
        path.join(ROOT, "evidence/selection-study/SHA256SUMS.txt"),
      ),
    },
    candidateHistory: history.candidates.map(
      ({ resultPath: _, ...item }) => item,
    ),
    profileQualifications: qset.profiles,
    expectedProviderArchives: manifest.providerArchives,
    limitations: [
      ...new Set(qset.profiles.flatMap((item) => item.limitations)),
    ],
    functionalDecision: "pass",
    performanceAssessment: qset.performanceAssessment,
  };
  await validate(
    evidence,
    "contracts/release/release-qualification-evidence-v2.schema.json",
    "Release Qualification Evidence",
  );
  await writeJson(path.resolve(output), evidence);
  return evidence;
}

async function fileIdentity(file, fileName) {
  const resolved = path.resolve(file),
    info = await fs.lstat(resolved);
  if (!info.isFile() || info.isSymbolicLink())
    throw new Error(`Release input is not an ordinary file: ${fileName}`);
  return { fileName, sizeBytes: info.size, sha256: await shaFile(resolved) };
}

async function readAndValidate(file, schema, label, formats = false) {
  const value = await readJson(path.resolve(file));
  await validate(value, schema, label, formats);
  return value;
}

async function validate(value, schemaPath, label, formats = false) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  if (formats) addFormats(ajv);
  const check = ajv.compile(await readJson(path.join(ROOT, schemaPath)));
  if (!check(value))
    throw new Error(`${label} invalid: ${JSON.stringify(check.errors)}`);
}

function assertReleaseIdentity(runtimeVersion, releaseTag, main) {
  if (
    !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(runtimeVersion) ||
    releaseTag !== `v${runtimeVersion}` ||
    !/^(?!0{40})[a-f0-9]{40}$/.test(main)
  )
    throw new Error("Invalid intended release identity.");
}

async function assertTagAbsent(tag) {
  try {
    await run("git", ["rev-parse", "--verify", `refs/tags/${tag}`], {
      cwd: ROOT,
    });
  } catch {
    return;
  }
  throw new Error("Pre-tag evidence cannot be generated after tag creation.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "candidate",
    "promotion-record",
    "applicability",
    "runtime-version",
    "release-tag",
    "maintained-main-commit",
    "output",
  ]);
  await assembleReleaseEvidence({
    candidate: args.candidate,
    promotionRecord: args["promotion-record"],
    applicability: args.applicability,
    runtimeVersion: args["runtime-version"],
    releaseTag: args["release-tag"],
    maintainedMainCommit: args["maintained-main-commit"],
    output: args.output,
  });
}
