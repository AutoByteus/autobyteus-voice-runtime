import fs from "node:fs/promises";
import path from "node:path";
import {
  copyClean,
  readJson,
  regularFiles,
  shaFile,
  targetParts,
  treeDigest,
  writeJson,
  ROOT,
} from "../lib/files.mjs";
import {
  locked,
  verifyInputManifest,
  verifyLockedFile,
} from "../locked-inputs.mjs";
export async function prepare(args, profileDirectory) {
  const target = targetParts(args.target);
  const lock = await readJson(
    path.join(ROOT, "providers", profileDirectory, "provider-lock.json"),
  );
  if (!lock.targets.includes(args.target))
    throw new Error("Provider lock does not authorize target.");
  const inputs = path.resolve(args.inputs),
    stage = path.resolve(args.stage);
  await verifyInputManifest(inputs);
  try {
    await fs.lstat(stage);
    throw new Error("Stage must not exist.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.mkdir(stage, { recursive: true, mode: 0o700 });
  return { target, lock, inputs, stage };
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
  const archive = path.join(context.inputs, "python-host-archive");
  await verifyLockedFile(
    archive,
    locked.pythonBuildStandalone.archives[
      `${context.target.platform}-${context.target.architecture}`
    ],
    "Hermetic Python archive",
  );
  const origin = await readJson(
    path.join(context.inputs, "python-root-origin.json"),
  );
  if (
    origin.schemaVersion !== 1 ||
    origin.archiveSha256 !==
      locked.pythonBuildStandalone.archives[
        `${context.target.platform}-${context.target.architecture}`
      ].sha256 ||
    origin.treeSha256 !==
      (await treeDigest(path.join(context.inputs, "python-root")))
  )
    throw new Error(
      "Materialized Python root does not match its locked origin.",
    );
  await verifyModel(context);
  await copyClean(
    path.join(context.inputs, "python-root"),
    path.join(context.stage, "host/python"),
  );
  await fs.mkdir(path.join(context.stage, "worker"), { recursive: true });
  const providerSource = path.join(
    ROOT,
    "providers/python/autobyteus_voice_provider",
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
      path.join(ROOT, "providers", adapterDirectory, name),
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
  const root = path.join(context.inputs, "python-root");
  const files = await regularFiles(root);
  for (const file of files)
    if (
      /(^|\/)(?:ensurepip|pip|setuptools|wheel)(?:\/|$)/i.test(file) ||
      /(^|\/)(?:pip(?:3(?:\.12)?)?|python3\.12-config|ffmpeg)(?:\.exe)?$/i.test(
        file,
      ) ||
      /^(?:include|lib\/pkgconfig)\//i.test(file) ||
      /(^|\/)libpython[^/]*\.(?:a|lib)$/i.test(file)
    )
      throw new Error(`Build-only Python payload is forbidden: ${file}`);
  const installed = new Map();
  for (const file of files.filter((value) =>
    value.endsWith(".dist-info/METADATA"),
  )) {
    const metadata = await fs.readFile(path.join(root, file), "utf8");
    const name = /^Name:\s*(.+)$/im.exec(metadata)?.[1]?.trim();
    const version = /^Version:\s*(.+)$/im.exec(metadata)?.[1]?.trim();
    if (!name || !version)
      throw new Error(`Invalid distribution metadata: ${file}`);
    const key = canonicalDistribution(name);
    if (installed.has(key))
      throw new Error(`Duplicate Python distribution: ${key}`);
    installed.set(key, version);
  }
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
