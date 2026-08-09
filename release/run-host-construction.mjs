#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parsePairs, readJson, ROOT } from "../build/lib/files.mjs";
import { deriveHostSourceClosure } from "../build/host-source-closure.mjs";
import { assembleHostConstructionResult } from "./hosted-host-construction-result.mjs";
import { loadCurrentReleaseMatrix } from "./current-release-matrix.mjs";
import { readValidated } from "./release-contract.mjs";

const run = promisify(execFile);

export async function runHostConstruction({
  sourceAdmission,
  qualificationSet,
  finalMainCommit,
  inputsRoot,
  assets,
  audit,
  go,
  buildEnvironment,
  version,
  output,
}) {
  const admission = await readValidated(
      sourceAdmission,
      "contracts/release/release-source-admission-v3.schema.json",
      "Release Source Admission 3",
    ),
    qset = await readValidated(
      qualificationSet,
      "contracts/release/focused-qualification-set-v3.schema.json",
      "Focused Qualification Set 3",
    ),
    matrix = await loadCurrentReleaseMatrix(),
    native = await readJson(buildEnvironment),
    builds = [];
  await fs.mkdir(assets, { recursive: true });
  await fs.mkdir(audit, { recursive: true });
  for (const profileId of ["english", "chinese"]) {
    const focusedProfile = qset.profiles.find(
        (profile) => profile.profileId === profileId,
      ),
      archive = path.join(
        assets,
        `voice-host-${profileId}-darwin-arm64-${version}.zip`,
      ),
      verification = path.join(audit, `${profileId}-host-verification-v2.json`),
      entry = matrix.value.entries.find((row) => row.profileId === profileId),
      recipePath = path.join(
        ROOT,
        "build/input-recipes",
        entry.hostRecipeFileName,
      ),
      item = { profileId, focusedProfile, attempted: false };
    try {
      const closure = await deriveHostSourceClosure({
        profileId,
        recipePath,
        inputManifestPath: path.join(inputsRoot, profileId, "SHA256SUMS.json"),
        buildEnvironment: native,
        admissionRootPath: path.join(
          inputsRoot,
          profileId,
          "host-authority/model-admission-root-v1.json",
        ),
        compatibilityPath: path.join(
          inputsRoot,
          profileId,
          "host-authority/model-compatibility-requirement-v1.json",
        ),
        outputPath: path.join(
          audit,
          `${profileId}-prebuild-host-source-closure-v1.json`,
        ),
      });
      const admitted = admission.profiles.find(
        (profile) => profile.profileId === profileId,
      );
      if (
        !focusedProfile ||
        !admitted ||
        closure.sha256 !== focusedProfile.hostSourceClosureSha256 ||
        closure.sha256 !== admitted.finalHostSourceClosureSha256
      )
        throw new Error("focused host source closure mismatch");
      item.expectedHostSourceClosure = closure.sha256;
      item.attempted = true;
    } catch {
      item.failureCategory = "host-source-closure-mismatch";
      builds.push(item);
      await fs.rm(path.join(inputsRoot, profileId), {
        recursive: true,
        force: true,
      });
      break;
    }
    try {
      await run(
        process.execPath,
        [
          "build/host-package-assembler.mjs",
          "--profile",
          profileId,
          "--target",
          "darwin-arm64",
          "--inputs",
          path.join(inputsRoot, profileId),
          "--output",
          archive,
          "--go",
          go,
          "--build-environment",
          buildEnvironment,
          "--expected-host-source-closure",
          item.expectedHostSourceClosure,
          "--source-commit",
          finalMainCommit,
          "--version",
          version,
        ],
        { cwd: ROOT, env: process.env, maxBuffer: 32 * 1024 * 1024 },
      );
      item.buildReport = `${archive}.build.json`;
      item.archive = archive;
    } catch {
      item.failureCategory = "host-build-failed";
      builds.push(item);
      await fs.rm(path.join(inputsRoot, profileId), {
        recursive: true,
        force: true,
      });
      break;
    }
    try {
      await run(
        process.execPath,
        [
          "build/host-package-verifier.mjs",
          "--archive",
          archive,
          "--build-report",
          item.buildReport,
          "--go",
          go,
          "--output",
          verification,
        ],
        { cwd: ROOT, env: process.env, maxBuffer: 32 * 1024 * 1024 },
      );
      item.hostVerification = verification;
      builds.push(item);
    } catch {
      item.failureCategory = "host-verification-failed";
      builds.push(item);
      break;
    } finally {
      await fs.rm(path.join(inputsRoot, profileId), {
        recursive: true,
        force: true,
      });
    }
  }
  const result = await assembleHostConstructionResult({
    sourceAdmission,
    finalMainCommit,
    builds,
    output,
  });
  if (result.decision !== "pass") {
    const error = new Error(`Hosted host construction ${result.decision}.`);
    error.code = "HOST_CONSTRUCTION_BLOCKED";
    throw error;
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "source-admission",
    "qualification-set",
    "final-main-commit",
    "inputs-root",
    "assets",
    "audit",
    "go",
    "build-environment",
    "version",
    "output",
  ]);
  await runHostConstruction({
    sourceAdmission: args["source-admission"],
    qualificationSet: args["qualification-set"],
    finalMainCommit: args["final-main-commit"],
    inputsRoot: args["inputs-root"],
    assets: args.assets,
    audit: args.audit,
    go: args.go,
    buildEnvironment: args["build-environment"],
    version: args.version,
    output: args.output,
  });
}
