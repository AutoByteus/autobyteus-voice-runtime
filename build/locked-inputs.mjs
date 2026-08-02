import fs from "node:fs/promises";
import path from "node:path";
import { ROOT, readJson, sha256, shaFile } from "./lib/files.mjs";
export const locked = await readJson(
  path.join(ROOT, "build/locked-inputs.json"),
);
const goOverrideKeys = [
  "AR",
  "CC",
  "CGO_ENABLED",
  "CXX",
  "GCCGO",
  "GO111MODULE",
  "GO386",
  "GOAMD64",
  "GOARCH",
  "GOARM",
  "GOARM64",
  "GODEBUG",
  "GOENV",
  "GOEXPERIMENT",
  "GOFLAGS",
  "GOFIPS140",
  "GOMIPS",
  "GOMIPS64",
  "GOOS",
  "GOPPC64",
  "GOROOT",
  "GOTOOLCHAIN",
  "GOTOOLDIR",
  "GOWASM",
  "GOWORK",
  "PKG_CONFIG",
];
const goOverrideSet = new Set(goOverrideKeys);
export async function verifyLockedFile(file, identity, label) {
  const info = await fs.stat(file);
  if (
    !info.isFile() ||
    info.size !== identity.sizeBytes ||
    (await shaFile(file)) !== identity.sha256
  )
    throw new Error(`${label} does not match its locked bytes.`);
}
export async function verifyInputManifest(root) {
  const manifest = await readJson(path.join(root, "SHA256SUMS.json"));
  if (
    manifest.schemaVersion !== 1 ||
    !Array.isArray(manifest.files) ||
    manifest.files.length === 0
  )
    throw new Error("Invalid input manifest.");
  const expected = new Set(["SHA256SUMS.json"]);
  for (const item of manifest.files) {
    if (
      !/^[A-Za-z0-9._/-]+$/.test(item.path) ||
      !/^[a-f0-9]{64}$/.test(item.sha256) ||
      !Number.isSafeInteger(item.sizeBytes) ||
      expected.has(item.path)
    )
      throw new Error("Invalid input manifest record.");
    const file = path.join(root, item.path);
    const info = await fs.stat(file);
    if (
      !info.isFile() ||
      info.size !== item.sizeBytes ||
      (await shaFile(file)) !== item.sha256
    )
      throw new Error(`Input mismatch: ${item.path}`);
    expected.add(item.path);
  }
  const actual = new Set();
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const relativeDirectory = path
        .relative(root, directory)
        .split(path.sep)
        .join("/");
      if (
        entry.name === ".git" &&
        /^(?:funasr-source|llama-cpp-source|utf8proc-source)$/.test(
          relativeDirectory,
        )
      )
        continue;
      const target = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Input symlink rejected.");
      if (entry.isDirectory()) await walk(target);
      else actual.add(path.relative(root, target).split(path.sep).join("/"));
    }
  }
  await walk(root);
  if (
    expected.size !== actual.size ||
    [...expected].some((item) => !actual.has(item))
  )
    throw new Error("Input manifest does not close the input tree.");
  return manifest;
}
export async function verifyGoToolchain(executable, options = {}) {
  rejectGoToolchainOverrides(options.environment ?? process.env);
  const tuple =
      options.tuple ??
      `${process.platform}-${process.arch === "x64" ? "x64" : process.arch}`,
    identity = options.identity ?? locked.goToolchain.archives[tuple];
  if (!identity) throw new Error(`No locked Go toolchain for ${tuple}.`);
  const binary = path.resolve(executable),
    root = path.dirname(path.dirname(binary)),
    expectedBinary = path.join(
      root,
      "bin",
      tuple.startsWith("win32-") ? "go.exe" : "go",
    );
  if (binary !== expectedBinary)
    throw new Error("VOICE_GO must identify the Go binary inside its root.");
  const rootInfo = await fs.lstat(root),
    binaryInfo = await fs.lstat(binary);
  if (
    !rootInfo.isDirectory() ||
    rootInfo.isSymbolicLink() ||
    !binaryInfo.isFile() ||
    binaryInfo.isSymbolicLink() ||
    (await shaFile(binary)) !== identity.executableSha256
  )
    throw new Error("Executing Go compiler bytes are not repository-locked.");
  const manifestPath =
      options.manifestPath ??
      path.join(
        ROOT,
        "build/go-toolchain-manifests",
        identity.rootManifestFileName,
      ),
    manifestBytes = await fs.readFile(manifestPath);
  if (sha256(manifestBytes) !== identity.rootManifestSha256)
    throw new Error("Go root manifest is not repository-locked.");
  const manifest = JSON.parse(manifestBytes);
  validateGoRootManifest(manifest, identity, tuple);
  await verifyCompleteGoRoot(root, manifest);
  return {
    executable: binary,
    root,
    host: manifest.host,
    archive: {
      fileName: identity.fileName,
      sha256: identity.sha256,
      sizeBytes: identity.sizeBytes,
    },
    rootIdentity: {
      manifestFileName: identity.rootManifestFileName,
      manifestSha256: identity.rootManifestSha256,
      treeSha256: identity.rootTreeSha256,
      fileCount: identity.rootFileCount,
      totalSizeBytes: identity.rootSizeBytes,
    },
  };
}

export function trustedGoEnvironment(
  toolchain,
  {
    platform = toolchain.host.platform,
    architecture = toolchain.host.architecture,
  } = {},
  environment = process.env,
) {
  rejectGoToolchainOverrides(environment);
  const result = { ...environment };
  for (const key of Object.keys(result))
    if (goOverrideSet.has(key.toUpperCase())) delete result[key];
  const goPlatform = platform === "win32" ? "windows" : platform,
    goArchitecture = architecture === "x64" ? "amd64" : architecture;
  return {
    ...result,
    AR: "",
    CC: "",
    CGO_ENABLED: "0",
    CXX: "",
    GCCGO: "",
    GO111MODULE: "on",
    GOARCH: goArchitecture,
    GOENV: "off",
    GOEXPERIMENT: "",
    GOFLAGS: "",
    GOOS: goPlatform,
    GOROOT: toolchain.root,
    GOTOOLCHAIN: "local",
    GOWORK: "off",
    PKG_CONFIG: "",
    ...(goArchitecture === "amd64" ? { GOAMD64: "v1" } : {}),
    ...(goArchitecture === "arm64" ? { GOARM64: "v8.0" } : {}),
  };
}

export function assertGoToolchainProvenance(toolchain, record) {
  if (
    record.goToolchainHost?.platform !== toolchain.host.platform ||
    record.goToolchainHost?.architecture !== toolchain.host.architecture ||
    record.goToolchainArchiveSha256 !== toolchain.archive.sha256 ||
    record.goToolchainRootManifestSha256 !==
      toolchain.rootIdentity.manifestSha256 ||
    record.goToolchainRootTreeSha256 !== toolchain.rootIdentity.treeSha256 ||
    record.goToolchainRootFileCount !== toolchain.rootIdentity.fileCount ||
    record.goToolchainRootSizeBytes !== toolchain.rootIdentity.totalSizeBytes
  )
    throw new Error("Build report Go toolchain provenance mismatch.");
}

export function rejectGoToolchainOverrides(environment) {
  const inherited = Object.entries(environment)
    .filter(
      ([key, value]) =>
        goOverrideSet.has(key.toUpperCase()) &&
        value !== undefined &&
        value !== "",
    )
    .map(([key]) => key)
    .sort();
  if (inherited.length)
    throw new Error(
      `Inherited Go toolchain override rejected: ${inherited.join(", ")}`,
    );
}

function validateGoRootManifest(manifest, identity, tuple) {
  const fields = Object.keys(manifest).sort().join(",");
  if (
    fields !==
      "archive,directories,fileCount,files,goVersion,host,rootDirectory,rootTreeSha256,schemaVersion,totalSizeBytes" ||
    manifest.schemaVersion !== 1 ||
    manifest.goVersion !== locked.goToolchain.version ||
    `${manifest.host?.platform}-${manifest.host?.architecture}` !== tuple ||
    manifest.rootDirectory !== "go" ||
    manifest.archive?.fileName !== identity.fileName ||
    manifest.archive?.sha256 !== identity.sha256 ||
    manifest.archive?.sizeBytes !== identity.sizeBytes ||
    manifest.rootTreeSha256 !== identity.rootTreeSha256 ||
    manifest.fileCount !== identity.rootFileCount ||
    manifest.totalSizeBytes !== identity.rootSizeBytes ||
    !Array.isArray(manifest.directories) ||
    !Array.isArray(manifest.files) ||
    manifest.files.length !== identity.rootFileCount
  )
    throw new Error("Go root manifest identity mismatch.");
  const directorySet = new Set();
  for (const directory of manifest.directories) {
    if (!validRelativePath(directory) || directorySet.has(directory))
      throw new Error("Invalid Go root manifest directory.");
    directorySet.add(directory);
  }
  const fileSet = new Set();
  let total = 0;
  for (const file of manifest.files) {
    if (
      Object.keys(file).sort().join(",") !== "path,sha256,sizeBytes" ||
      !validRelativePath(file.path) ||
      fileSet.has(file.path) ||
      !Number.isSafeInteger(file.sizeBytes) ||
      file.sizeBytes < 0 ||
      !/^[a-f0-9]{64}$/.test(file.sha256)
    )
      throw new Error("Invalid Go root manifest file.");
    fileSet.add(file.path);
    total += file.sizeBytes;
  }
  if (
    total !== manifest.totalSizeBytes ||
    goRootTreeDigest(manifest.files) !== manifest.rootTreeSha256
  )
    throw new Error("Go root manifest closure mismatch.");
}

async function verifyCompleteGoRoot(root, manifest) {
  const actualDirectories = new Set(),
    actualFiles = new Set();
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name),
        relative = path.relative(root, target).split(path.sep).join("/");
      if (entry.isSymbolicLink())
        throw new Error("Go root contains a symbolic link.");
      if (entry.isDirectory()) {
        actualDirectories.add(relative);
        await walk(target);
      } else if (entry.isFile()) actualFiles.add(relative);
      else throw new Error("Go root contains a non-regular entry.");
    }
  }
  await walk(root);
  if (!sameSet(actualDirectories, manifest.directories))
    throw new Error(
      "Go root directory set does not match its locked manifest.",
    );
  if (
    !sameSet(
      actualFiles,
      manifest.files.map((item) => item.path),
    )
  )
    throw new Error("Go root file set does not match its locked manifest.");
  for (const file of manifest.files) {
    const actual = path.join(root, ...file.path.split("/")),
      info = await fs.stat(actual);
    if (info.size !== file.sizeBytes || (await shaFile(actual)) !== file.sha256)
      throw new Error(`Go root file mismatch: ${file.path}`);
  }
}

function goRootTreeDigest(files) {
  return sha256(
    Buffer.from(
      files
        .map((item) => `${item.path}\0${item.sizeBytes}\0${item.sha256}\n`)
        .join(""),
    ),
  );
}

function validRelativePath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.includes("\\") &&
    !value.includes("\0") &&
    !path.posix.isAbsolute(value) &&
    path.posix.normalize(value) === value &&
    !value.split("/").some((part) => part === "." || part === "..")
  );
}

function sameSet(actual, expected) {
  return (
    actual.size === expected.length &&
    expected.every((item) => actual.has(item))
  );
}
