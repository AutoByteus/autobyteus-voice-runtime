import fs from "node:fs/promises";
import path from "node:path";
import { sha256, shaFile } from "../build/lib/files.mjs";

export const RAW_RECOVERY_MEMBERS = Object.freeze(
  [
    "recovery/recovery-run-v1.json",
    "recovery/qualified-source-checkout-v1.json",
    "recovery/runner-environment-v1.json",
    "recovery/network-denial-v1.json",
    "recovery/english-profile-recovery-v1.json",
    "recovery/english-build.log",
    "recovery/chinese-profile-recovery-v1.json",
    "recovery/chinese-build.log",
  ].sort(compareUtf8),
);
export const RECOVERY_MANIFEST_PATH =
  "recovery/recovery-evidence-SHA256SUMS.txt";
export const RECOVERY_RESULT_PATH =
  "recovery/qualified-archive-recovery-result-v1.json";
export const RECOVERY_MEMBER_ALLOWLIST = Object.freeze(
  [...RAW_RECOVERY_MEMBERS, RECOVERY_MANIFEST_PATH, RECOVERY_RESULT_PATH].sort(
    compareUtf8,
  ),
);

export async function collectRawRecoveryIdentities(root) {
  const items = [];
  for (const fileName of RAW_RECOVERY_MEMBERS) {
    const file = containedFile(root, fileName),
      info = await fs.lstat(file);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error(`Recovery member is not an ordinary file: ${fileName}`);
    items.push({ fileName, sizeBytes: info.size, sha256: await shaFile(file) });
  }
  return items;
}

export function serializeRecoveryManifest(items) {
  assertExactRawItems(items);
  return Buffer.from(
    items.map((item) => `${item.sha256}  ${item.fileName}\n`).join(""),
  );
}

export function parseRecoveryManifest(bytes) {
  const text = Buffer.isBuffer(bytes) ? bytes.toString("utf8") : bytes;
  if (!text.endsWith("\n") || text.includes("\r"))
    throw new Error("Recovery manifest must be canonical LF text.");
  const items = text
    .slice(0, -1)
    .split("\n")
    .map((line) => {
      const match = /^([a-f0-9]{64})  (recovery\/[A-Za-z0-9._/-]+)$/.exec(line);
      if (!match) throw new Error("Recovery manifest line is noncanonical.");
      return { sha256: match[1], fileName: match[2] };
    });
  assertExactRawItems(items, false);
  return items;
}

export async function writeRecoveryManifest(root) {
  const items = await collectRawRecoveryIdentities(root),
    bytes = serializeRecoveryManifest(items),
    target = containedFile(root, RECOVERY_MANIFEST_PATH);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes, { flag: "wx" });
  await verifyRecoveryManifest(root);
  return {
    fileName: RECOVERY_MANIFEST_PATH,
    sizeBytes: bytes.length,
    sha256: sha256(bytes),
    entryCount: 8,
    coverage: "raw-recovery-evidence-only",
  };
}

export async function verifyRecoveryManifest(root, expectedIdentity) {
  const target = containedFile(root, RECOVERY_MANIFEST_PATH),
    info = await fs.lstat(target),
    bytes = await fs.readFile(target),
    manifestItems = parseRecoveryManifest(bytes),
    actualItems = await collectRawRecoveryIdentities(root);
  if (!info.isFile() || info.isSymbolicLink() || info.size !== 807)
    throw new Error("Recovery manifest identity is invalid.");
  for (let index = 0; index < actualItems.length; index++)
    if (
      manifestItems[index].fileName !== actualItems[index].fileName ||
      manifestItems[index].sha256 !== actualItems[index].sha256
    )
      throw new Error("Recovery manifest does not close the raw evidence.");
  const identity = {
    fileName: RECOVERY_MANIFEST_PATH,
    sizeBytes: info.size,
    sha256: sha256(bytes),
    entryCount: 8,
    coverage: "raw-recovery-evidence-only",
  };
  if (
    expectedIdentity &&
    JSON.stringify(identity) !== JSON.stringify(expectedIdentity)
  )
    throw new Error("Recovery Result manifest identity mismatch.");
  return { identity, items: actualItems };
}

export function recoveryRawListDigest(items) {
  assertExactRawItems(items);
  return sha256(Buffer.from(JSON.stringify(items)));
}

export async function assertExactRecoveryDirectory(root) {
  const recovery = path.join(path.resolve(root), "recovery"),
    actual = (await fs.readdir(recovery, { withFileTypes: true }))
      .map((entry) => {
        if (!entry.isFile() || entry.isSymbolicLink())
          throw new Error("Candidate recovery members must be ordinary files.");
        return `recovery/${entry.name}`;
      })
      .sort(compareUtf8);
  if (JSON.stringify(actual) !== JSON.stringify(RECOVERY_MEMBER_ALLOWLIST))
    throw new Error("Candidate has an absent or extra recovery member.");
}

function assertExactRawItems(items, requireSize = true) {
  if (
    !Array.isArray(items) ||
    items.length !== RAW_RECOVERY_MEMBERS.length ||
    items.some(
      (item, index) =>
        item?.fileName !== RAW_RECOVERY_MEMBERS[index] ||
        !/^[a-f0-9]{64}$/.test(item.sha256) ||
        (requireSize && !Number.isSafeInteger(item.sizeBytes)),
    )
  )
    throw new Error("Recovery evidence must be the exact canonical raw set.");
}

function containedFile(root, relative) {
  const resolvedRoot = path.resolve(root),
    target = path.resolve(resolvedRoot, relative);
  if (!target.startsWith(`${resolvedRoot}${path.sep}`))
    throw new Error("Recovery member escapes its root.");
  return target;
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}
