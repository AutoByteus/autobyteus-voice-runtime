import fs from "node:fs/promises";
import path from "node:path";
import { shaFile } from "./lib/files.mjs";

export async function assertTrustedExecutableIdentity(identityValue) {
  const resolved = await fs.realpath(identityValue.path),
    info = await fs.lstat(resolved);
  if (
    resolved !== identityValue.path ||
    !info.isFile() ||
    info.isSymbolicLink() ||
    (await shaFile(resolved)) !== identityValue.sha256
  )
    throw new Error(
      `Trusted executable identity mismatch: ${identityValue.path}`,
    );
}

export async function materializeTrustedToolDirectory(record, workDirectory) {
  const directory = path.join(workDirectory, "trusted-native-tools");
  await fs.mkdir(directory, { recursive: false, mode: 0o700 });
  for (const [name, identityValue] of toolEntries(record))
    await fs.symlink(identityValue.path, path.join(directory, name));
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
      (await fs.readlink(link)) !== identityValue.path
    )
      throw new Error(`Trusted native tool link mismatch: ${name}`);
    await assertTrustedExecutableIdentity(identityValue);
  }
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
