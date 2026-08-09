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
  verifyHostBuildEnvironment,
  verifyTrustedToolDirectory,
} from "../host-build-environment.mjs";
export async function prepareHost(args, providerDirectory) {
  const target = targetParts(args.target),
    lock = await readJson(
      path.join(ROOT, "providers", providerDirectory, "provider-lock.json"),
    );
  if (args.target !== "darwin-arm64" || !lock.targets.includes(args.target))
    throw new Error("Host builder target is not admitted.");
  const inputs = path.resolve(args.inputs),
    stage = path.resolve(args.stage),
    inputManifest = await verifyInputManifest(inputs),
    buildEnvironment = await readJson(path.resolve(args["build-environment"]));
  await verifyHostBuildEnvironment(buildEnvironment);
  const trustedTools = path.resolve(args["trusted-tools"]);
  await verifyTrustedToolDirectory(buildEnvironment, trustedTools);
  const inputProvenance = await readJson(
      path.join(inputs, "host-input-provenance-v2.json"),
    ),
    inputRecipe = await readJson(
      path.join(ROOT, "build/input-recipes", inputProvenance.recipe.fileName),
    );
  const expected = inputRecipe.inputs.map((item) => ({
    kind: item.kind,
    role: item.role,
    destination: item.destination,
    identity: item.kind === "git-checkout" ? item.treeId : item.sha256,
    licenseComponentId: item.licenseComponentId,
  }));
  const materialized = inputManifest.files.filter(
    (item) => item.path !== "host-input-provenance-v2.json",
  );
  if (
    inputProvenance.schemaVersion !== 2 ||
    inputProvenance.recipe.sha256 !==
      (await shaFile(
        path.join(ROOT, "build/input-recipes", inputProvenance.recipe.fileName),
      )) ||
    JSON.stringify(inputProvenance.inputs) !== JSON.stringify(expected) ||
    inputProvenance.materializedTreeSha256 !==
      sha256(Buffer.from(`${JSON.stringify(materialized)}\n`))
  )
    throw new Error("Host build-input provenance is not reproducible.");
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
export async function copyHostNotices(context) {
  await fs.copyFile(
    path.join(context.inputs, "package-notices/THIRD_PARTY_NOTICES.json"),
    path.join(context.stage, "THIRD_PARTY_NOTICES.json"),
  );
  await copyClean(
    path.join(context.inputs, "package-notices/licenses"),
    path.join(context.stage, "licenses"),
  );
}
export async function copyPythonHost(context, adapter) {
  assertHostInputClosure(context, [
    "python-host-archive",
    "python-wheelhouse/",
    "package-notices/",
    "host-authority/",
    "python-dependencies.lock",
    "runtime-source/",
  ]);
  const materialized = await materializePythonRuntime(context);
  try {
    await copyClean(materialized.root, path.join(context.stage, "host/python"));
  } finally {
    await materialized.dispose();
  }
  const source = path.join(
      context.inputs,
      "runtime-source/providers/python/autobyteus_voice_provider",
    ),
    files = (await regularFiles(source)).filter((file) => file.endsWith(".py")),
    expected = [
      "__init__.py",
      "audio.py",
      "bootstrap.py",
      "exact_json.py",
      "normalization.py",
      "protocol.py",
      "session.py",
    ];
  if (JSON.stringify(files) !== JSON.stringify(expected))
    throw new Error("Python provider source closure changed.");
  await fs.mkdir(path.join(context.stage, "worker/autobyteus_voice_provider"), {
    recursive: true,
  });
  for (const file of files)
    await fs.copyFile(
      path.join(source, file),
      path.join(context.stage, "worker/autobyteus_voice_provider", file),
    );
  for (const file of ["worker.py", "recognizer.py"])
    await fs.copyFile(
      path.join(context.inputs, "runtime-source/providers", adapter, file),
      path.join(context.stage, "worker", file),
    );
}
export async function verifyPythonRuntimePolicy(context, expected) {
  const lock = await readJson(
      path.join(ROOT, "build/python-wheel-locks/darwin-arm64.json"),
    ),
    installed = new Map(
      lock.wheels.map((row) => [canonical(row.name), row.version]),
    ),
    approved = new Map(
      expected.map((row) => [canonical(row.name), row.version]),
    );
  if (
    approved.size !== expected.length ||
    installed.size !== approved.size ||
    [...approved].some(([name, version]) => installed.get(name) !== version)
  )
    throw new Error("Materialized Python distributions do not match lock.");
}
function canonical(value) {
  return value.toLowerCase().replace(/[-_.]+/g, "-");
}
export async function writeEngineConfiguration(context, configuration) {
  await fs.mkdir(path.join(context.stage, "provider"), { recursive: true });
  await writeJson(
    path.join(context.stage, "provider/engine-configuration-v1.json"),
    { schemaVersion: 1, ...configuration },
  );
}
export function assertHostInputClosure(context, prefixes) {
  for (const item of context.inputManifest.files)
    if (
      item.path !== "host-input-provenance-v2.json" &&
      !prefixes.some((prefix) =>
        prefix.endsWith("/")
          ? item.path.startsWith(prefix)
          : item.path === prefix,
      )
    )
      throw new Error(`Host input has no consumer: ${item.path}`);
}
