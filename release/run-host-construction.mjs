#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readJson, ROOT } from "../build/lib/files.mjs";
import {
  hostConstructionChildEnvironment,
  hostPackageAssemblerInvocation,
  hostPackageVerifierInvocation,
  parseHostConstructionArguments,
} from "../build/host-package-input-contract.mjs";
import { deriveHostSourceClosure } from "../build/host-source-closure.mjs";
import { assembleHostConstructionResult } from "./hosted-host-construction-result.mjs";
import { loadCurrentReleaseMatrix } from "./current-release-matrix.mjs";
import { ordinaryFileIdentity, readValidated } from "./release-contract.mjs";
import { sameContentIdentity } from "./release-admission-contract.mjs";
import { verifyReleaseSourceAdmission } from "./verify-release-source-admission.mjs";

const run = promisify(execFile);

export async function runHostConstruction({
  sourceAdmission,
  releaseAdmissionVerification,
  qualificationSet,
  workflowCheckoutCommit,
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
      "contracts/release/release-source-admission-v4.schema.json",
      "Release Source Admission 4",
    ),
    qset = await readValidated(
      qualificationSet,
      "contracts/release/focused-qualification-set-v3.schema.json",
      "Focused Qualification Set 3",
    ),
    matrix = await loadCurrentReleaseMatrix(),
    native = await readJson(buildEnvironment),
    builds = [],
    prepared = [];
  if (
    !sameContentIdentity(
      await ordinaryFileIdentity(qualificationSet),
      admission.focusedQualificationSet,
    )
  )
    throw new Error("Host construction qualification authority is unbound.");
  await fs.mkdir(assets, { recursive: true });
  await fs.mkdir(audit, { recursive: true });
  for (const profileId of ["english", "chinese"]) {
    const focusedProfile = qset.profiles.find(
        (profile) => profile.profileId === profileId,
      ),
      entry = matrix.value.entries.find((row) => row.profileId === profileId),
      recipePath = path.join(
        ROOT,
        "build/input-recipes",
        entry.hostRecipeFileName,
      ),
      item = { profileId, focusedProfile, attempted: false },
      closurePath = path.join(
        audit,
        `${profileId}-prebuild-host-source-closure-v1.json`,
      );
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
        outputPath: closurePath,
      });
      const admitted = admission.profiles.find(
        (profile) => profile.profileId === profileId,
      );
      if (
        !focusedProfile ||
        !admitted ||
        closure.sha256 !== focusedProfile.hostSourceClosureSha256 ||
        closure.sha256 !== admitted.admittedHostSourceClosure.sha256
      )
        throw new Error("focused host source closure mismatch");
      item.expectedHostSourceClosure = closure.sha256;
      item.closurePath = closurePath;
      prepared.push(item);
    } catch {
      await cleanInputs(inputsRoot);
      const error = new Error(
        "Hosted Host Source Closure differs from admission.",
      );
      error.code = "SOURCE_ADMISSION_BLOCKED";
      throw error;
    }
  }
  await verifyReleaseSourceAdmission({
    repository: ROOT,
    workflowCheckoutCommit,
    checkoutHostClosures: prepared.map((item) => ({
      profileId: item.profileId,
      file: item.closurePath,
    })),
    output: releaseAdmissionVerification,
  });
  const childRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-host-controller-"),
    ),
    childEnvironment = hostConstructionChildEnvironment(childRoot);
  try {
    for (const item of prepared) {
      const { profileId } = item,
        archive = path.join(
          assets,
          `voice-host-${profileId}-darwin-arm64-${version}.zip`,
        ),
        verification = path.join(
          audit,
          `${profileId}-host-verification-v2.json`,
        );
      item.attempted = true;
      try {
        await run(
          process.execPath,
          hostPackageAssemblerInvocation({
            profile: profileId,
            target: "darwin-arm64",
            inputs: path.join(inputsRoot, profileId),
            output: archive,
            go,
            "build-environment": buildEnvironment,
            "expected-host-source-closure": item.expectedHostSourceClosure,
            "source-commit": workflowCheckoutCommit,
            version,
          }),
          {
            cwd: ROOT,
            env: childEnvironment,
            maxBuffer: 32 * 1024 * 1024,
          },
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
          hostPackageVerifierInvocation({
            archive,
            "build-report": item.buildReport,
            go,
            output: verification,
          }),
          {
            cwd: ROOT,
            env: childEnvironment,
            maxBuffer: 32 * 1024 * 1024,
          },
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
  } finally {
    await fs.rm(childRoot, { recursive: true, force: true });
  }
  await cleanInputs(inputsRoot);
  const result = await assembleHostConstructionResult({
    sourceAdmission,
    releaseAdmissionVerification,
    workflowCheckoutCommit,
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
  const args = parseHostConstructionArguments(process.argv.slice(2));
  await runHostConstruction({
    sourceAdmission: args["source-admission"],
    releaseAdmissionVerification: args["release-admission-verification"],
    qualificationSet: args["qualification-set"],
    workflowCheckoutCommit: args["workflow-checkout-commit"],
    inputsRoot: args["inputs-root"],
    assets: args.assets,
    audit: args.audit,
    go: args.go,
    buildEnvironment: args["build-environment"],
    version: args.version,
    output: args.output,
  });
}

async function cleanInputs(inputsRoot) {
  for (const profileId of ["english", "chinese"])
    await fs.rm(path.join(inputsRoot, profileId), {
      recursive: true,
      force: true,
    });
}
