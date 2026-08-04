import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
export const ROOT = path.resolve(import.meta.dirname, "../..");
export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
export async function shaFile(file) {
  return sha256(await fs.readFile(file));
}
export async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}
export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}
export async function regularFiles(root) {
  const result = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isSymbolicLink())
        throw new Error("Symbolic links are forbidden.");
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile())
        result.push(path.relative(root, target).split(path.sep).join("/"));
      else throw new Error("Only ordinary files are supported.");
    }
  }
  await visit(root);
  return result.sort();
}
export async function treeDigest(root) {
  const records = [];
  for (const relative of await regularFiles(root)) {
    const file = path.join(root, relative);
    records.push([relative, (await fs.stat(file)).size, await shaFile(file)]);
  }
  return sha256(Buffer.from(`${JSON.stringify(records)}\n`));
}
export function parsePairs(values, required) {
  const result = {};
  for (let i = 0; i < values.length; i += 2) {
    if (!values[i]?.startsWith("--") || values[i + 1] === undefined)
      throw new Error("Arguments must be --name value pairs.");
    const key = values[i].slice(2);
    if (result[key] !== undefined) throw new Error(`Duplicate --${key}.`);
    result[key] = values[i + 1];
  }
  for (const key of required)
    if (!result[key]) throw new Error(`Missing --${key}.`);
  return result;
}
export async function copyClean(source, destination) {
  try {
    await fs.lstat(destination);
    throw new Error(`Destination exists: ${destination}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.cp(source, destination, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
}
export async function removeWritableTree(root) {
  try {
    await makeWritable(root);
    await fs.rm(root, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
async function makeWritable(target) {
  const info = await fs.lstat(target);
  if (info.isSymbolicLink()) return;
  if (!info.isDirectory()) {
    await fs.chmod(target, 0o600);
    return;
  }
  await fs.chmod(target, 0o700);
  for (const name of await fs.readdir(target))
    await makeWritable(path.join(target, name));
}
export function targetParts(tuple) {
  const [platform, architecture, ...extra] = tuple.split("-");
  if (
    extra.length ||
    (platform === "darwin" && !["arm64", "x64"].includes(architecture)) ||
    ((!["linux", "win32"].includes(platform) || architecture !== "x64") &&
      platform !== "darwin")
  )
    throw new Error("Unsupported target.");
  return { platform, architecture };
}
