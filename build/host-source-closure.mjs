import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  ROOT,
  regularFiles,
  sha256,
  shaFile,
  writeJson,
} from "./lib/files.mjs";
const COMMON = [
  "go.mod",
  "go.sum",
  "package.json",
  "package-lock.json",
  "THIRD_PARTY_NOTICES.json",
  "build/host-source-closure.mjs",
  "build/host-package-assembler.mjs",
  "build/host-package-staging.mjs",
  "build/host-tool-build.mjs",
  "build/host-build-evidence.mjs",
  "build/host-package-metadata.mjs",
  "build/host-build-environment.mjs",
  "build/profile-builders/host-common.mjs",
  "build/profile-builders/mlx-host.mjs",
  "build/profile-builders/funasr-host.mjs",
  "build/materialize-release-inputs.mjs",
  "build/build-input-path-policy.mjs",
  "build/locked-inputs.json",
  "build/locked-inputs.mjs",
  "build/trusted-native-environment.mjs",
  "build/native-tool-identities.mjs",
  "build/resolved-cmake-configuration.mjs",
  "build/repository-lock-set.mjs",
  "build/python/materialize-runtime.mjs",
  "build/python/runtime-closure.mjs",
  "build/lib/files.mjs",
  "packaging/launcher/compile-host-tools.mjs",
  "build/python-wheel-locks/darwin-arm64.json",
  "contracts/catalog/current-release-matrix-v2.json",
  "contracts/catalog/current-release-matrix-v2.schema.json",
  "release/current-release-matrix.mjs",
];
const validateClosure = new Ajv2020({ allErrors: true, strict: true }).compile(
  JSON.parse(
    await fs.readFile(
      path.join(ROOT, "contracts/package/host-source-closure-v1.schema.json"),
      "utf8",
    ),
  ),
);
const TREES = [
  "contracts/build",
  "contracts/catalog",
  "contracts/diagnostics",
  "contracts/audio",
  "contracts/diagnostics",
  "contracts/install",
  "contracts/launcher",
  "contracts/model",
  "contracts/package",
  "contracts/protocol",
  "contracts/startup",
  "hostverify",
  "integrity",
  "internal",
  "launcher",
  "modelmanager",
  "modelstore",
  "packaging/archive",
  "packaging/cmd/runtime-host-tool",
];
export async function deriveHostSourceClosure({
  repository = ROOT,
  profileId,
  recipePath,
  inputManifestPath,
  buildEnvironment,
  admissionRootPath,
  compatibilityPath,
  outputPath,
}) {
  const files = new Set(COMMON);
  for (const tree of TREES)
    for (const relative of await regularFiles(path.join(repository, tree)))
      files.add(`${tree}/${relative}`);
  files.add(`contracts/model/admission/${profileId}-darwin-arm64-v1.json`);
  files.add(`contracts/model/compatibility/${profileId}-darwin-arm64-v1.json`);
  files.add(
    `providers/${profileId === "english" ? "english-mlx" : "chinese-funasr"}/provider-lock.json`,
  );
  const providerTrees =
    profileId === "english"
      ? ["providers/english-mlx", "providers/python", "build/python"]
      : ["providers/chinese-funasr", "contracts/normalization"];
  for (const tree of providerTrees)
    for (const relative of await regularFiles(path.join(repository, tree)))
      files.add(`${tree}/${relative}`);
  const repositoryFiles = [];
  for (const relative of [...files].sort()) {
    const file = path.join(repository, relative),
      info = await fs.stat(file);
    repositoryFiles.push({
      path: relative,
      sizeBytes: info.size,
      sha256: await shaFile(file),
    });
  }
  const input = JSON.parse(await fs.readFile(inputManifestPath, "utf8"));
  const externalInputs = input.files
    .filter((row) => row.path !== "host-input-provenance-v2.json")
    .map((row) => ({
      id: row.path,
      kind: "materialized-host-input",
      identity: sha256(Buffer.from(`${JSON.stringify(row)}\n`)),
    }));
  const recipe = JSON.parse(await fs.readFile(recipePath, "utf8"));
  const tools = buildEnvironment.tools;
  const closure = {
    schemaVersion: 1,
    closureId: `voice-host-${profileId}-darwin-arm64-v1`,
    profileId,
    target: { platform: "darwin", architecture: "arm64" },
    repositoryFiles,
    externalInputs,
    toolchain: {
      node: `${recipe.toolchain.nodeVersion}/${tools.node.sha256}`,
      go: `${recipe.toolchain.goVersion}/${recipe.toolchain.goRootTreeSha256}`,
      cmake: `${recipe.toolchain.cmakeVersion}/${tools.cmake.sha256}`,
      xcode: `${recipe.toolchain.xcode}/${buildEnvironment.authority.xcodeVersion}`,
      sdk: `${recipe.toolchain.sdk}/${tools.sdk.settingsSha256}`,
      compiler: `${recipe.toolchain.appleClang}/${tools.cxxCompiler.targetSha256}`,
    },
    buildFlags: [
      "-trimpath",
      "-buildvcs=false",
      "-buildid=",
      `cmake-generator=${buildEnvironment.configuration.generator}`,
      `cmake-build-type=${buildEnvironment.configuration.buildType}`,
      `cmake-parallelism=${buildEnvironment.configuration.parallelism}`,
      `native-flag-policy=${buildEnvironment.configuration.flagPolicy}`,
    ],
    hostRecipe: {
      fileName: path.basename(recipePath),
      sha256: await shaFile(recipePath),
    },
    modelCompatibilityRequirement: { sha256: await shaFile(compatibilityPath) },
    modelAdmissionRoot: { sha256: await shaFile(admissionRootPath) },
  };
  if (!validateClosure(closure))
    throw new Error(
      `Host Source Closure 1 invalid: ${JSON.stringify(validateClosure.errors)}`,
    );
  if (outputPath) await writeJson(outputPath, closure);
  return {
    value: closure,
    sha256: sha256(Buffer.from(`${JSON.stringify(closure, null, 2)}\n`)),
  };
}
