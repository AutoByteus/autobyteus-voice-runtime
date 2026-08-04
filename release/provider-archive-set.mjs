import fs from "node:fs/promises";
import path from "node:path";
import { sha256, shaFile } from "../build/lib/files.mjs";

export function compareFileName(left, right) {
  return Buffer.compare(
    Buffer.from(left.fileName),
    Buffer.from(right.fileName),
  );
}

export function providerArchiveSetDigest(items) {
  return sha256(Buffer.from(JSON.stringify(items)));
}

export async function verifyExactProviderArchiveSet(assets, expectedItems) {
  const root = path.resolve(assets),
    expected = expectedItems.map(({ fileName, sizeBytes, sha256 }) => ({
      fileName,
      sizeBytes,
      sha256,
    }));
  expected.sort(compareFileName);
  if (
    expected.length !== 2 ||
    new Set(expected.map((item) => item.fileName)).size !== expected.length
  )
    throw new Error("Expected provider archive set is not exact.");
  const actualNames = (await fs.readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.name.endsWith(".zip"))
    .map((entry) => entry.name)
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)),
    );
  if (
    JSON.stringify(actualNames) !==
    JSON.stringify(expected.map((item) => item.fileName))
  )
    throw new Error(
      "Provider archive directory contains an extra or missing archive.",
    );
  for (const item of expected) {
    const file = path.join(root, item.fileName),
      info = await fs.lstat(file);
    if (
      !info.isFile() ||
      info.isSymbolicLink() ||
      info.size !== item.sizeBytes ||
      (await shaFile(file)) !== item.sha256
    )
      throw new Error(`Provider archive mismatch: ${item.fileName}`);
  }
  return expected;
}
