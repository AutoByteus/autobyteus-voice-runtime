import fs from "node:fs/promises";
import path from "node:path";
import { shaFile } from "./lib/files.mjs";

export async function canonicalExecutablePath(executable) {
  const resolved = await fs.realpath(path.resolve(executable)),
    info = await fs.lstat(resolved);
  if (!info.isFile() || info.isSymbolicLink())
    throw new Error(`Trusted executable is not a regular file: ${executable}`);
  return resolved;
}

export async function assertTrustedExecutableIdentity(identityValue) {
  const resolved = await canonicalExecutablePath(identityValue.path);
  if (
    resolved !== identityValue.path ||
    (await shaFile(resolved)) !== identityValue.sha256
  )
    throw new Error(
      `Trusted executable identity mismatch: ${identityValue.path}`,
    );
}

export async function captureXcodeRanlibIdentity(
  invocationPath,
  libtoolIdentity,
) {
  await assertTrustedExecutableIdentity(libtoolIdentity);
  const supplied = path.resolve(invocationPath),
    alias = path.join(
      await fs.realpath(path.dirname(supplied)),
      path.basename(supplied),
    ),
    info = await fs.lstat(alias),
    linkTarget = await fs.readlink(alias),
    identityValue = {
      invocationPath: alias,
      linkTarget,
      targetPath: await fs.realpath(alias),
      targetSha256: await shaFile(await fs.realpath(alias)),
    };
  if (!info.isSymbolicLink())
    throw new Error("Xcode ranlib invocation must be a symbolic alias.");
  await assertXcodeRanlibIdentity(identityValue, libtoolIdentity);
  return identityValue;
}

export async function assertXcodeRanlibIdentity(
  identityValue,
  libtoolIdentity,
) {
  const invocation = path.resolve(identityValue.invocationPath),
    canonicalInvocation = path.join(
      await fs.realpath(path.dirname(invocation)),
      path.basename(invocation),
    ),
    expectedDirectorySuffix = path.join(
      "Contents",
      "Developer",
      "Toolchains",
      "XcodeDefault.xctoolchain",
      "usr",
      "bin",
    ),
    directory = path.dirname(invocation),
    suffix = `${path.sep}${expectedDirectorySuffix}`,
    bundleRoot = directory.endsWith(suffix)
      ? directory.slice(0, -suffix.length)
      : "",
    info = await fs.lstat(invocation);
  if (
    canonicalInvocation !== identityValue.invocationPath ||
    path.basename(invocation) !== "ranlib" ||
    !bundleRoot.endsWith(".app") ||
    !info.isSymbolicLink() ||
    identityValue.linkTarget !== "libtool" ||
    (await fs.readlink(invocation)) !== identityValue.linkTarget ||
    path.join(directory, identityValue.linkTarget) !==
      identityValue.targetPath ||
    (await fs.realpath(invocation)) !== identityValue.targetPath ||
    identityValue.targetPath !== libtoolIdentity.path ||
    identityValue.targetSha256 !== libtoolIdentity.sha256
  )
    throw new Error("Xcode ranlib alias identity mismatch.");
  await assertTrustedExecutableIdentity({
    path: identityValue.targetPath,
    sha256: identityValue.targetSha256,
  });
}

export async function materializeTrustedToolDirectory(record, workDirectory) {
  const directory = path.join(workDirectory, "trusted-native-tools");
  await fs.mkdir(directory, { recursive: false, mode: 0o700 });
  for (const [name, identityValue] of toolEntries(record))
    await fs.symlink(
      invocationPath(name, identityValue),
      path.join(directory, name),
    );
  await verifyTrustedToolDirectory(record, directory);
  return directory;
}

export async function verifyTrustedToolDirectory(record, directory) {
  const entries = await fs.readdir(directory),
    expected = toolEntries(record);
  if (
    JSON.stringify(entries.sort()) !==
    JSON.stringify(expected.map(([name]) => name).sort())
  )
    throw new Error("Trusted native tool directory is not closed.");
  for (const [name, identityValue] of expected) {
    const link = path.join(directory, name),
      info = await fs.lstat(link);
    if (
      !info.isSymbolicLink() ||
      (await fs.readlink(link)) !== invocationPath(name, identityValue)
    )
      throw new Error(`Trusted native tool link mismatch: ${name}`);
    if (name === "ranlib")
      await assertXcodeRanlibIdentity(identityValue, record.tools.libtool);
    else await assertTrustedExecutableIdentity(identityValue);
  }
}

function invocationPath(name, identityValue) {
  return name === "ranlib" ? identityValue.invocationPath : identityValue.path;
}

function toolEntries(record) {
  return [
    ["node", record.tools.node],
    ["cmake", record.tools.cmake],
    ["cc", record.tools.cCompiler],
    ["c++", record.tools.cxxCompiler],
    ["ar", record.tools.archiver],
    ["ranlib", record.tools.ranlib],
    ["ld", record.tools.linker],
    ["libtool", record.tools.libtool],
    ["make", record.tools.make],
    ["sh", record.tools.shell],
    ["tar", record.tools.tar],
  ];
}
