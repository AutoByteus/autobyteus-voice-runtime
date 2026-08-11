#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  readJson,
  removeWritableTree,
  ROOT,
  shaFile,
  targetParts,
  writeJson,
} from "./lib/files.mjs";
import { parseHostPackageAssemblerArguments } from "./host-package-input-contract.mjs";
import {
  trustedGoEnvironment,
  verifyGoToolchain,
  verifyInputManifest,
} from "./locked-inputs.mjs";
import { assertNoUntrustedNativeBuildOverrides } from "./trusted-native-environment.mjs";
import {
  consumeHostBuildEnvironment,
  materializeTrustedToolDirectory,
  trustedHostBuildEnvironment,
} from "./host-build-environment.mjs";
import { loadCurrentReleaseMatrix } from "../release/current-release-matrix.mjs";
import { deriveHostSourceClosure } from "./host-source-closure.mjs";
import { preserveHostBuildEvidence } from "./host-build-evidence.mjs";
import {
  readArchiveReport,
  writeHostDescriptor,
  writeHostManifest,
} from "./host-package-metadata.mjs";
import {
  assertHostInputOwnership,
  stageHostAuthorities,
  stageHostContracts,
} from "./host-package-staging.mjs";
import { PROFILE_BUILDER_INPUT_PATTERNS } from "./profile-builders/host-input-ownership.mjs";
import { compileStagedHostTools } from "./host-tool-build.mjs";
const run = promisify(execFile),
  args = parseHostPackageAssemblerArguments(process.argv.slice(2));
assertNoUntrustedNativeBuildOverrides();
if (
  !/^[a-f0-9]{40}$/.test(args["source-commit"]) ||
  !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(args.version) ||
  args.target !== "darwin-arm64"
)
  throw new Error("Invalid host build identity.");
const target = targetParts(args.target),
  matrix = await loadCurrentReleaseMatrix(),
  entry = matrix.value.entries.find(
    (row) =>
      row.profileId === args.profile &&
      row.platform === target.platform &&
      row.architecture === target.architecture,
  );
if (!entry) throw new Error("Host is outside Current Release Matrix 2.");
const inputs = path.resolve(args.inputs),
  inputManifest = await verifyInputManifest(inputs),
  profileInputPatterns = PROFILE_BUILDER_INPUT_PATTERNS[args.profile];
if (!profileInputPatterns)
  throw new Error("Host profile has no input ownership contract.");
assertHostInputOwnership(inputManifest, profileInputPatterns);
const provenancePath = path.join(inputs, "host-input-provenance-v2.json"),
  provenance = await readJson(provenancePath),
  recipePath = path.join(ROOT, "build/input-recipes", entry.hostRecipeFileName);
if (
  provenance.schemaVersion !== 2 ||
  provenance.repository.sourceCommit !== args["source-commit"] ||
  provenance.releaseMatrix.sha256 !== matrix.sha256 ||
  provenance.recipe.fileName !== entry.hostRecipeFileName ||
  provenance.recipe.sha256 !== (await shaFile(recipePath)) ||
  provenance.package.hostPackageId !== entry.hostPackageId
)
  throw new Error("Host build input provenance mismatch.");
const goToolchain = await verifyGoToolchain(path.resolve(args.go)),
  native = await consumeHostBuildEnvironment({
    recordPath: args["build-environment"],
  }),
  work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-runtime-host-")),
  stage = path.join(work, "host");
try {
  const trustedTools = await materializeTrustedToolDirectory(native, work),
    nativePath = path.join(work, "host-build-environment-v2.json");
  await writeJson(nativePath, native);
  const provider =
      args.profile === "english" ? "english-mlx" : "chinese-funasr",
    builder = path.join(
      ROOT,
      "build/profile-builders",
      args.profile === "english" ? "mlx-host.mjs" : "funasr-host.mjs",
    );
  await run(
    process.execPath,
    [
      builder,
      "--target",
      args.target,
      "--inputs",
      inputs,
      "--stage",
      stage,
      "--build-environment",
      nativePath,
      "--trusted-tools",
      trustedTools,
    ],
    {
      cwd: ROOT,
      env: trustedHostBuildEnvironment(native, work, trustedTools),
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  await stageHostContracts({ stage, profileId: args.profile });
  const {
    admissionInput,
    admissionPath,
    compatibilityInput,
    compatibilityPath,
  } = await stageHostAuthorities({
    stage,
    inputs,
    entry,
  });
  const closurePath = path.join(stage, "provider/host-source-closure-v1.json"),
    closure = await deriveHostSourceClosure({
      profileId: args.profile,
      recipePath,
      inputManifestPath: path.join(inputs, "SHA256SUMS.json"),
      buildEnvironment: native,
      admissionRootPath: admissionInput,
      compatibilityPath: compatibilityInput,
      outputPath: closurePath,
    });
  if (closure.sha256 !== args["expected-host-source-closure"])
    throw new Error("Host Source Closure differs from admitted authority.");
  const {
    privateExecutable,
    worker,
    planPath,
    launcherPath,
    managerPath,
    toolProvenance,
  } = await compileStagedHostTools({
    stage,
    work,
    profileId: args.profile,
    entry,
    target,
    go: goToolchain.executable,
    native,
    trustedTools,
    hostSourceClosureSha256: closure.sha256,
  });
  const lock = await readJson(
      path.join(ROOT, "providers", provider, "provider-lock.json"),
    ),
    descriptorPath = await writeHostDescriptor({
      stage,
      entry,
      target,
      packageVersion: args.version,
      profileId: args.profile,
      providerLock: lock,
      launcherPlanPath: planPath,
      privateExecutable,
      worker,
      hostSourceClosureSha256: closure.sha256,
    }),
    manifestPath = await writeHostManifest({
      stage,
      hostPackageId: entry.hostPackageId,
      executablePaths: [
        "bin/voice-provider",
        "bin/voice-model-manager",
        privateExecutable,
      ],
    });
  await fs.mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
  const archiveReport = path.join(work, "archive-report.json");
  await run(
    goToolchain.executable,
    [
      "run",
      "./packaging/cmd/runtime-host-tool",
      "build",
      "--root",
      stage,
      "--output",
      path.resolve(args.output),
      "--report",
      archiveReport,
    ],
    {
      cwd: ROOT,
      env: trustedGoEnvironment(goToolchain),
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  const archive = await readArchiveReport(archiveReport);
  await preserveHostBuildEvidence({
    output: args.output,
    inputs,
    recipePath,
    provenancePath,
    native,
    toolProvenance,
    closurePath,
    admissionPath,
    compatibilityPath,
    descriptorPath,
    manifestPath,
    noticePath: path.join(stage, "THIRD_PARTY_NOTICES.json"),
    launcherPath,
    managerPath,
    archive,
    sourceCommit: args["source-commit"],
    version: args.version,
    entry,
    target,
  });
} finally {
  await removeWritableTree(work);
}
