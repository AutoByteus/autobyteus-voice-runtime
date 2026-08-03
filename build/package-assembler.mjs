#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  parsePairs,
  readJson,
  removeWritableTree,
  regularFiles,
  ROOT,
  sha256,
  shaFile,
  targetParts,
  treeDigest,
  writeJson,
} from "./lib/files.mjs";
import { trustedGoEnvironment, verifyGoToolchain } from "./locked-inputs.mjs";
import { repositoryBuildLockDigest } from "./repository-lock-set.mjs";
import {
  assertNoUntrustedNativeBuildOverrides,
  createTrustedNativeBuildEnvironment,
  materializeTrustedToolDirectory,
  trustedNativeBuildEnvironment,
} from "./trusted-native-environment.mjs";
import {
  loadCurrentReleaseMatrix,
  matrixEntryKey,
} from "../release/current-release-matrix.mjs";
const run = promisify(execFile);
const args = parsePairs(process.argv.slice(2), [
  "profile",
  "target",
  "inputs",
  "output",
  "go",
  "cmake",
  "preflight",
  "source-commit",
  "version",
]);
assertNoUntrustedNativeBuildOverrides();
const goToolchain = await verifyGoToolchain(path.resolve(args.go));
const nativeBuildEnvironment = await createTrustedNativeBuildEnvironment({
  preflightPath: args.preflight,
  cmakePath: args.cmake,
});
if (
  !/^[a-f0-9]{40}$/.test(args["source-commit"]) ||
  !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(args.version)
)
  throw new Error("Invalid source/version identity.");
const target = targetParts(args.target);
const currentMatrix = await loadCurrentReleaseMatrix();
const currentEntry = currentMatrix.value.entries.find(
  (entry) =>
    entry.profileId === args.profile &&
    entry.platform === target.platform &&
    entry.architecture === target.architecture,
);
const profileMap = {
  english:
    args.target === "darwin-arm64" ? "english-mlx" : "english-faster-whisper",
  chinese: "chinese-funasr",
};
const providerDirectory = profileMap[args.profile];
if (!providerDirectory)
  throw new Error(
    "Only explicit English and Chinese packages are buildable without separate auto qualification.",
  );
const lock = await readJson(
  path.join(ROOT, "providers", providerDirectory, "provider-lock.json"),
);
const packageId = `voice.${args.profile}.${lock.model.family}-${lock.model.size}-${lock.model.precision}.${args.target}`;
if (currentEntry) {
  for (const [field, actual] of [
    ["packageId", packageId],
    ["providerId", lock.providerId],
    ["modelId", lock.model.id],
  ])
    if (currentEntry[field] !== actual)
      throw new Error(
        `Current Release Matrix build identity mismatch: ${field}`,
      );
}
const inputProvenancePath = path.join(
  path.resolve(args.inputs),
  "input-provenance-v1.json",
);
const inputProvenance = await readJson(inputProvenancePath);
const repositoryLockSha256 = await repositoryBuildLockDigest(
  args.profile,
  args.target,
);
const currentRecipePath = path.join(
  ROOT,
  "build/input-recipes",
  currentEntry?.recipeFileName ?? "outside-current-matrix",
);
if (
  !currentEntry ||
  inputProvenance.schemaVersion !== 1 ||
  inputProvenance.repository.sourceCommit !== args["source-commit"] ||
  inputProvenance.releaseMatrix.matrixId !== currentMatrix.value.matrixId ||
  inputProvenance.releaseMatrix.sha256 !== currentMatrix.sha256 ||
  inputProvenance.recipe.fileName !== currentEntry.recipeFileName ||
  matrixEntryKey(inputProvenance.package) !== matrixEntryKey(currentEntry) ||
  inputProvenance.package.packageId !== currentEntry.packageId ||
  inputProvenance.repository.lockSha256 !== repositoryLockSha256 ||
  inputProvenance.recipe.sha256 !== (await shaFile(currentRecipePath))
)
  throw new Error(
    "Package build requires verified Current Release Matrix input provenance.",
  );
const work = await fs.mkdtemp(
  path.join(os.tmpdir(), "voice-provider-package-"),
);
const stage = path.join(work, "package");
const trustedTools = await materializeTrustedToolDirectory(
  nativeBuildEnvironment,
  work,
);
const nativeBuildEnvironmentInput = path.join(
  work,
  "native-build-environment-v1.json",
);
await writeJson(nativeBuildEnvironmentInput, nativeBuildEnvironment);
const builder = path.join(
  ROOT,
  "build/profile-builders",
  providerDirectory === "chinese-funasr"
    ? "funasr.mjs"
    : providerDirectory === "english-mlx"
      ? "mlx.mjs"
      : "faster-whisper.mjs",
);
try {
  const builderArgs = [
    "--target",
    args.target,
    "--inputs",
    path.resolve(args.inputs),
    "--stage",
    stage,
    "--build-environment",
    nativeBuildEnvironmentInput,
    "--trusted-tools",
    trustedTools,
  ];
  await run(process.execPath, [builder, ...builderArgs], {
    cwd: ROOT,
    maxBuffer: 32 * 1024 * 1024,
    env: trustedNativeBuildEnvironment(
      nativeBuildEnvironment,
      work,
      trustedTools,
    ),
  });
  await fs.mkdir(path.join(stage, "provider"), { recursive: true });
  await fs.mkdir(path.join(stage, "bin"), { recursive: true });
  await fs.mkdir(path.join(stage, "contracts"), { recursive: true });
  for (const [source, name] of [
    [
      "contracts/protocol/voice-input-protocol-v1.schema.json",
      "voice-input-protocol-v1.schema.json",
    ],
    ["contracts/audio/pcm-wav-v1.md", "pcm-wav-v1.md"],
    [
      "contracts/normalization/transcript-normalization-v1.md",
      "transcript-normalization-v1.md",
    ],
  ])
    await fs.copyFile(
      path.join(ROOT, source),
      path.join(stage, "contracts", name),
    );
  const launcherName =
    target.platform === "win32" ? "voice-provider.exe" : "voice-provider";
  const privateExecutable =
    providerDirectory === "chinese-funasr"
      ? `provider/${target.platform === "win32" ? "voice-provider-worker.exe" : "voice-provider-worker"}`
      : target.platform === "win32"
        ? "host/python/python.exe"
        : "host/python/bin/python3";
  const invocation =
    providerDirectory === "chinese-funasr"
      ? { kind: "native-worker", executable: privateExecutable }
      : {
          kind: "python-worker",
          executable: privateExecutable,
          worker: "worker/worker.py",
        };
  const plan = { schemaVersion: 1, packageId, target, invocation };
  const planInput = path.join(work, "launcher-plan-input.json");
  await fs.writeFile(planInput, `${JSON.stringify(plan)}\n`);
  const planPath = path.join(stage, "provider/package-launcher-plan-v1.json");
  const launcherPath = path.join(stage, "bin", launcherName);
  const provenancePath = path.join(
    stage,
    "provider/launcher-build-provenance-v1.json",
  );
  await run(
    process.execPath,
    [
      path.join(ROOT, "packaging/launcher/compile-launcher.mjs"),
      "--plan",
      planInput,
      "--planCopy",
      planPath,
      "--go",
      goToolchain.executable,
      "--output",
      launcherPath,
      "--provenance",
      provenancePath,
      "--target",
      args.target,
    ],
    {
      cwd: ROOT,
      maxBuffer: 32 * 1024 * 1024,
      env: trustedNativeBuildEnvironment(
        nativeBuildEnvironment,
        work,
        trustedTools,
      ),
    },
  );
  const modelDescriptor = await readJson(
    path.join(stage, "model/model-descriptor-v1.json"),
  );
  if (
    modelDescriptor.id !== lock.model.id ||
    modelDescriptor.family !== lock.model.family ||
    modelDescriptor.size !== lock.model.size ||
    modelDescriptor.precision !== lock.model.precision
  )
    throw new Error("Staged model descriptor does not match provider lock.");
  const engineConfiguration = "provider/engine-configuration-v1.json";
  const profileId = args.profile;
  const languageMode = args.profile === "english" ? "en" : "zh";
  const normalizationProfile =
    args.profile === "english"
      ? "autobyteus-english-v1"
      : "autobyteus-simplified-zh-v1";
  const capabilities = {
    maxInFlightRequests: 1,
    rawAndNormalizedText: true,
    noSpeech: true,
  };
  const capabilityDigest = sha256(
    Buffer.from(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(capabilities).sort(([left], [right]) =>
            left < right ? -1 : left > right ? 1 : 0,
          ),
        ),
      ),
    ),
  );
  const hostKind =
    providerDirectory === "chinese-funasr" ? "native" : "bundled-python";
  const workerEntrypoint =
    providerDirectory === "chinese-funasr"
      ? privateExecutable
      : "worker/worker.py";
  const descriptor = {
    schemaVersion: 1,
    packageId,
    packageVersion: args.version,
    providerId: lock.providerId,
    sourceCommit: args["source-commit"],
    target,
    protocolVersion: 1,
    sessionConfigVersion: 1,
    launcher: `bin/${launcherName}`,
    launcherPlan: {
      path: "provider/package-launcher-plan-v1.json",
      sha256: await shaFile(planPath),
    },
    host: {
      kind: hostKind,
      version: hostKind === "native" ? lock.engine.funAsrCommit : "3.12.13",
      executable: privateExecutable,
      sha256: await shaFile(path.join(stage, privateExecutable)),
    },
    worker: {
      entrypoint: workerEntrypoint,
      sha256: await shaFile(path.join(stage, workerEntrypoint)),
    },
    engine: {
      kind: lock.engine.kind,
      version: lock.engine.version ?? lock.engine.funAsrCommit,
      configuration: {
        path: engineConfiguration,
        sha256: await shaFile(path.join(stage, engineConfiguration)),
      },
    },
    model: {
      id: lock.model.id,
      family: lock.model.family,
      size: lock.model.size,
      precision: lock.model.precision,
      root: "model",
      descriptor: "model/model-descriptor-v1.json",
      sha256: await treeDigest(path.join(stage, "model")),
    },
    profiles: [{ profileId, languageMode, normalizationProfile, capabilities }],
    audioContract: "autobyteus-pcm16-mono-16khz-wav-v1",
    fileManifestPath: "provider/package-files-v1.json",
    noticeInventoryPath: "THIRD_PARTY_NOTICES.json",
  };
  const descriptorPath = path.join(stage, "provider/provider-package-v1.json");
  await writeJson(descriptorPath, descriptor);
  const executablePaths = new Set([`bin/${launcherName}`, privateExecutable]);
  const records = [];
  for (const relative of await regularFiles(stage)) {
    if (relative === "provider/package-files-v1.json") continue;
    const file = path.join(stage, relative);
    records.push({
      path: relative,
      sha256: await shaFile(file),
      sizeBytes: (await fs.stat(file)).size,
      mode: executablePaths.has(relative) ? "executable" : "read-only",
    });
  }
  await writeJson(path.join(stage, "provider/package-files-v1.json"), {
    schemaVersion: 1,
    packageId,
    files: records,
  });
  const total = (
    await Promise.all(
      (await regularFiles(stage)).map(
        async (relative) => (await fs.stat(path.join(stage, relative))).size,
      ),
    )
  ).reduce((sum, value) => sum + value, 0);
  if (total > 1342177280)
    throw new Error("Extracted package exceeds the approved 1.25 GiB gate.");
  await fs.mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
  const reportPath = path.join(work, "archive-report.json");
  await run(
    goToolchain.executable,
    [
      "run",
      "./packaging/cmd/provider-package-tool",
      "build",
      "--root",
      stage,
      "--output",
      path.resolve(args.output),
      "--report",
      reportPath,
    ],
    {
      cwd: ROOT,
      maxBuffer: 32 * 1024 * 1024,
      env: trustedGoEnvironment(goToolchain),
    },
  );
  const archive = await readJson(reportPath);
  const inputManifestPath = path.join(
    path.resolve(args.inputs),
    "SHA256SUMS.json",
  );
  const preservedInputManifest = `${path.resolve(args.output)}.inputs.json`;
  await fs.copyFile(inputManifestPath, preservedInputManifest);
  const preservedInputProvenance = `${path.resolve(args.output)}.provenance.json`;
  await fs.copyFile(inputProvenancePath, preservedInputProvenance);
  const preservedNativeBuildEnvironment = `${path.resolve(args.output)}.build-environment.json`;
  await writeJson(preservedNativeBuildEnvironment, nativeBuildEnvironment);
  const normalizerSha256 =
    providerDirectory === "chinese-funasr"
      ? await treeDigest(path.join(stage, "normalizer"))
      : await shaFile(
          path.join(stage, "worker/autobyteus_voice_provider/normalization.py"),
        );
  await writeJson(`${path.resolve(args.output)}.build.json`, {
    schemaVersion: 1,
    sourceCommit: args["source-commit"],
    packageVersion: args.version,
    buildInputManifestFileName: path.basename(preservedInputManifest),
    buildInputManifestSha256: await shaFile(inputManifestPath),
    buildInputProvenanceFileName: path.basename(preservedInputProvenance),
    buildInputProvenanceSha256: await shaFile(inputProvenancePath),
    buildInputRecipeSha256: inputProvenance.recipe.sha256,
    nativeBuildEnvironmentFileName: path.basename(
      preservedNativeBuildEnvironment,
    ),
    nativeBuildEnvironmentSha256: await shaFile(
      preservedNativeBuildEnvironment,
    ),
    releaseMatrixId: currentMatrix.value.matrixId,
    releaseMatrixSha256: currentMatrix.sha256,
    repositoryBuildLockSha256: repositoryLockSha256,
    goToolchainHost: goToolchain.host,
    goToolchainArchiveSha256: goToolchain.archive.sha256,
    goToolchainRootManifestSha256: goToolchain.rootIdentity.manifestSha256,
    goToolchainRootTreeSha256: goToolchain.rootIdentity.treeSha256,
    goToolchainRootFileCount: goToolchain.rootIdentity.fileCount,
    goToolchainRootSizeBytes: goToolchain.rootIdentity.totalSizeBytes,
    packageId,
    profileId,
    languageMode,
    target,
    providerId: lock.providerId,
    modelId: lock.model.id,
    capabilityDigest,
    descriptorSha256: await shaFile(descriptorPath),
    fileManifestSha256: await shaFile(
      path.join(stage, "provider/package-files-v1.json"),
    ),
    launcherSha256: await shaFile(launcherPath),
    launcherPlanSha256: descriptor.launcherPlan.sha256,
    hostSha256: descriptor.host.sha256,
    engineConfigurationSha256: descriptor.engine.configuration.sha256,
    modelSha256: descriptor.model.sha256,
    normalizerSha256,
    protocolSha256: await shaFile(
      path.join(stage, "contracts/voice-input-protocol-v1.schema.json"),
    ),
    noticeInventorySha256: await shaFile(
      path.join(stage, "THIRD_PARTY_NOTICES.json"),
    ),
    archive,
  });
} finally {
  await removeWritableTree(work);
}
