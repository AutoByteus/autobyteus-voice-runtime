import fs from "node:fs/promises";
import path from "node:path";
import { ROOT, readJson, shaFile } from "./lib/files.mjs";
export const locked = await readJson(
  path.join(ROOT, "build/locked-inputs.json"),
);
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
