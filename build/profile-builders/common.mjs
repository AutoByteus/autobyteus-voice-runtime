import fs from "node:fs/promises";
import path from "node:path";
import {
  copyClean,
  readJson,
  regularFiles,
  sha256,
  shaFile,
  targetParts,
  writeJson,
  ROOT,
} from "../lib/files.mjs";
import { verifyInputManifest } from "../locked-inputs.mjs";
import { materializePythonRuntime } from "../python/materialize-runtime.mjs";
import {
  verifyTrustedNativeBuildEnvironment,
  verifyTrustedToolDirectory,
} from "../trusted-native-environment.mjs";
export async function prepare(args, profileDirectory) {
  const target = targetParts(args.target);
  const lock = await readJson(
    path.join(ROOT, "providers", profileDirectory, "provider-lock.json"),
  );
  if (!lock.targets.includes(args.target))
    throw new Error("Provider lock does not authorize target.");
  const inputs = path.resolve(args.inputs),
    stage = path.resolve(args.stage);
  const inputManifest = await verifyInputManifest(inputs);
  const buildEnvironment = await readJson(
    path.resolve(args["build-environment"]),
  );
  await verifyTrustedNativeBuildEnvironment(buildEnvironment);
  const trustedTools = path.resolve(args["trusted-tools"]);
  await verifyTrustedToolDirectory(buildEnvironment, trustedTools);
  const inputProvenance = await readJson(
    path.join(inputs, "input-provenance-v1.json"),
  );
  const inputRecipe = await readJson(
    path.join(ROOT, "build/input-recipes", inputProvenance.recipe.fileName),
  );
  const expectedObservations = inputRecipe.inputs.map((item) => ({
      kind: item.kind,
      role: item.role,
      destination: item.destination,
      identity: item.kind === "git-checkout" ? item.treeId : item.sha256,
      licenseComponentId: item.licenseComponentId,
    })),
    materializedRecords = inputManifest.files.filter(
      (item) => item.path !== "input-provenance-v1.json",
    );
  if (
    inputProvenance.recipe.sha256 !==
      (await shaFile(
        path.join(ROOT, "build/input-recipes", inputProvenance.recipe.fileName),
      )) ||
    JSON.stringify(inputProvenance.releaseMatrix) !==
      JSON.stringify(inputRecipe.releaseMatrix) ||
    JSON.stringify(inputProvenance.package) !==
      JSON.stringify(inputRecipe.package) ||
    JSON.stringify(inputProvenance.inputs) !==
      JSON.stringify(expectedObservations) ||
    inputProvenance.materializedTreeSha256 !==
      sha256(Buffer.from(`${JSON.stringify(materializedRecords)}\n`))
  )
    throw new Error("Materialized build-input provenance is not reproducible.");
  try {
    await fs.lstat(stage);
    throw new Error("Stage must not exist.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.mkdir(stage, { recursive: true, mode: 0o700 });
  return {
    target,
    lock,
    inputs,
    stage,
    inputManifest,
    inputProvenance,
    inputRecipe,
    buildEnvironment,
    trustedTools,
  };
}
export async function copyPackageNotices(context) {
  await fs.copyFile(
    path.join(context.inputs, "package-notices/THIRD_PARTY_NOTICES.json"),
    path.join(context.stage, "THIRD_PARTY_NOTICES.json"),
  );
  await copyClean(
    path.join(context.inputs, "package-notices/licenses"),
    path.join(context.stage, "licenses"),
  );
}
export async function copyPythonProvider(context, adapterDirectory) {
  assertInputClosure(context, [
    "python-host-archive",
    "python-wheelhouse/",
    "model/",
    "package-notices/",
    ...(adapterDirectory === "english-mlx" ? ["python-dependencies.lock"] : []),
    "runtime-source/",
  ]);
  const materialized = await materializePythonRuntime(context);
  await verifyModel(context);
  try {
    await copyClean(materialized.root, path.join(context.stage, "host/python"));
  } finally {
    await materialized.dispose();
  }
  await fs.mkdir(path.join(context.stage, "worker"), { recursive: true });
  const providerSource = path.join(
    context.inputs,
    "runtime-source/providers/python/autobyteus_voice_provider",
  );
  const pythonSources = (await regularFiles(providerSource)).filter((file) =>
    file.endsWith(".py"),
  );
  const expectedSources = [
    "__init__.py",
    "audio.py",
    "bootstrap.py",
    "exact_json.py",
    "normalization.py",
    "protocol.py",
    "session.py",
  ];
  if (JSON.stringify(pythonSources) !== JSON.stringify(expectedSources))
    throw new Error("Python provider source closure changed unexpectedly.");
  const providerStage = path.join(
    context.stage,
    "worker/autobyteus_voice_provider",
  );
  await fs.mkdir(providerStage, { recursive: true });
  for (const source of pythonSources)
    await fs.copyFile(
      path.join(providerSource, source),
      path.join(providerStage, source),
    );
  for (const name of ["worker.py", "recognizer.py"])
    await fs.copyFile(
      path.join(
        context.inputs,
        "runtime-source/providers",
        adapterDirectory,
        name,
      ),
      path.join(context.stage, "worker", name),
    );
  const modelStage = path.join(context.stage, "model");
  await fs.mkdir(modelStage, { recursive: true });
  for (const file of context.lock.model.files)
    await fs.copyFile(
      path.join(context.inputs, "model", file.name),
      path.join(modelStage, file.name),
    );
  await writeJson(path.join(modelStage, "model-descriptor-v1.json"), {
    schemaVersion: 1,
    id: context.lock.model.id,
    family: context.lock.model.family,
    size: context.lock.model.size,
    precision: context.lock.model.precision,
    source: context.lock.model.source,
    revision: context.lock.model.revision,
    files: context.lock.model.files,
  });
}
export async function verifyPythonRuntimePolicy(context, expected) {
  const tuple = `${context.target.platform}-${context.target.architecture}`;
  const wheelLock = await readJson(
    path.join(ROOT, `build/python-wheel-locks/${tuple}.json`),
  );
  const installed = new Map(
    wheelLock.wheels.map(({ name, version }) => [
      canonicalDistribution(name),
      version,
    ]),
  );
  const approved = new Map(
    expected.map(({ name, version }) => [canonicalDistribution(name), version]),
  );
  if (
    approved.size !== expected.length ||
    installed.size !== approved.size ||
    [...approved].some(([name, version]) => installed.get(name) !== version)
  )
    throw new Error(
      "Materialized Python distributions do not match the approved lock.",
    );
}
function canonicalDistribution(value) {
  return value.toLowerCase().replace(/[-_.]+/g, "-");
}
async function verifyModel(context) {
  for (const file of context.lock.model.files) {
    const target = path.join(context.inputs, "model", file.name);
    const info = await fs.stat(target);
    if (
      !info.isFile() ||
      info.size !== file.sizeBytes ||
      (await shaFile(target)) !== file.sha256
    )
      throw new Error(`Model identity mismatch: ${file.name}`);
  }
}
export async function writeEngineConfiguration(context, configuration) {
  await writeJson(
    path.join(context.stage, "provider/engine-configuration-v1.json"),
    { schemaVersion: 1, ...configuration },
  );
}
export function assertInputClosure(context, prefixes) {
  for (const item of context.inputManifest.files)
    if (
      item.path !== "input-provenance-v1.json" &&
      !prefixes.some((prefix) =>
        prefix.endsWith("/")
          ? item.path.startsWith(prefix)
          : item.path === prefix,
      )
    )
      throw new Error(
        `Build input is not consumed by a locked owner: ${item.path}`,
      );
}
