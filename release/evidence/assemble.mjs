#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";
import { assertIntegratedReleaseCommit } from "./main-reachability.mjs";
import {
  assertExactMatrixRows,
  loadCurrentReleaseMatrix,
} from "../current-release-matrix.mjs";
import {
  providerArchiveSetDigest,
  verifyExactProviderArchiveSet,
} from "../provider-archive-set.mjs";

const run = promisify(execFile);

export async function assembleReleaseEvidence({
  qualificationSetPath,
  assets,
  runtimeVersion,
  releaseTag,
  maintainedMainCommit,
  output,
}) {
  if (
    !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(runtimeVersion) ||
    releaseTag !== `v${runtimeVersion}` ||
    !/^(?!0{40})[a-f0-9]{40}$/.test(maintainedMainCommit)
  )
    throw new Error("Invalid intended release identity.");
  const qset = await readJson(qualificationSetPath),
    matrix = await loadCurrentReleaseMatrix(),
    qsetSchema = await readJson(
      path.join(ROOT, "contracts/release/qualification-set-v2.schema.json"),
    );
  validate(qsetSchema, qset, "Qualification Set");
  if (
    qset.functionalDecision !== "pass" ||
    qset.packageVersion !== runtimeVersion ||
    qset.releaseMatrix.sha256 !== matrix.sha256 ||
    JSON.stringify(qset.profileResourcePolicy) !==
      JSON.stringify(matrix.value.profileResourcePolicy)
  )
    throw new Error("Integrated Qualification Set release binding mismatch.");
  assertExactMatrixRows(matrix.value, qset.profiles);
  await assertIntegratedReleaseCommit({
    repository: ROOT,
    releaseCommit: qset.sourceCommit,
    maintainedMainCommit,
  });
  await assertTagAbsent(releaseTag);
  const historyPath = path.join(
    ROOT,
    "release/evidence/candidate-history-v1.json",
  );
  const history = await readJson(historyPath);
  for (const candidate of history.candidates)
    if (
      (await shaFile(
        path.join(ROOT, "evidence/selection-study", candidate.resultPath),
      )) !== candidate.resultDigest
    )
      throw new Error(`Candidate evidence mismatch: ${candidate.candidateId}`);
  const items = await verifyExactProviderArchiveSet(
    assets,
    qset.profiles.map((profile) => profile.archive),
  );
  const qsetInfo = await fs.stat(qualificationSetPath);
  const evidence = {
    schemaVersion: 2,
    artifactKind: "release-qualification-evidence",
    intendedRelease: { runtimeVersion, releaseTag },
    sourceCommit: qset.sourceCommit,
    runnerCommit: qset.runnerCommit,
    testCommit: qset.testCommit,
    releaseMatrix: qset.releaseMatrix,
    profileResourcePolicy: qset.profileResourcePolicy,
    qualificationSet: {
      fileName: "qualification-set-v2.json",
      sizeBytes: qsetInfo.size,
      sha256: await shaFile(qualificationSetPath),
    },
    mainReachability: {
      maintainedMainCommit,
      releaseCommit: qset.sourceCommit,
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
    expectedProviderArchives: {
      sha256: providerArchiveSetDigest(items),
      items,
    },
    limitations: [
      ...new Set(qset.profiles.flatMap((item) => item.limitations)),
    ],
    functionalDecision: "pass",
    performanceAssessment: qset.performanceAssessment,
  };
  const schema = await readJson(
    path.join(
      ROOT,
      "contracts/release/release-qualification-evidence-v2.schema.json",
    ),
  );
  validate(schema, evidence, "Release Qualification Evidence");
  await writeJson(path.resolve(output), evidence);
  return evidence;
}

function validate(schema, value, label) {
  const check = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!check(value))
    throw new Error(`${label} invalid: ${JSON.stringify(check.errors)}`);
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
    "qualification-set",
    "assets",
    "runtime-version",
    "release-tag",
    "maintained-main-commit",
    "output",
  ]);
  await assembleReleaseEvidence({
    qualificationSetPath: path.resolve(args["qualification-set"]),
    assets: path.resolve(args.assets),
    runtimeVersion: args["runtime-version"],
    releaseTag: args["release-tag"],
    maintainedMainCommit: args["maintained-main-commit"],
    output: path.resolve(args.output),
  });
}
