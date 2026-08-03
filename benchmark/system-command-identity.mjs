import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { sha256 } from "../build/lib/files.mjs";

const run = promisify(execFile);
export const PINNED_SUDO_PATH = "/usr/bin/sudo";
export const PINNED_SUDO_PROBE_ARGS = Object.freeze(["-V"]);

export async function captureExecuteOnlySystemCommandIdentity({
  executable,
  probeArgs,
  execute = executeProbe,
}) {
  const requested = path.resolve(executable),
    resolved = await fs.realpath(requested),
    link = await fs.lstat(requested),
    info = await fs.stat(resolved, { bigint: true });
  if (
    resolved !== requested ||
    link.isSymbolicLink() ||
    !info.isFile() ||
    info.size > BigInt(Number.MAX_SAFE_INTEGER)
  )
    throw new Error("Execute-only system command identity is invalid.");
  const observed = await execute(resolved, [...probeArgs]);
  return {
    path: resolved,
    deviceId: info.dev.toString(),
    inode: info.ino.toString(),
    ownerUid: Number(info.uid),
    ownerGid: Number(info.gid),
    mode: Number(info.mode & 0o7777n)
      .toString(8)
      .padStart(4, "0"),
    sizeBytes: Number(info.size),
    modifiedNanoseconds: info.mtimeNs.toString(),
    changedNanoseconds: info.ctimeNs.toString(),
    probe: {
      args: [...probeArgs],
      stdoutSha256: sha256(Buffer.from(observed.stdout ?? "")),
      stderrSha256: sha256(Buffer.from(observed.stderr ?? "")),
    },
  };
}

export async function capturePinnedSudoIdentity(options = {}) {
  const identity = await captureExecuteOnlySystemCommandIdentity({
    executable: PINNED_SUDO_PATH,
    probeArgs: PINNED_SUDO_PROBE_ARGS,
    ...options,
  });
  if (
    identity.path !== PINNED_SUDO_PATH ||
    identity.ownerUid !== 0 ||
    identity.ownerGid !== 0 ||
    identity.mode !== "4511"
  )
    throw new Error("Pinned sudo metadata identity is not approved.");
  return identity;
}

export async function verifyPinnedSudoIdentity(expected, options = {}) {
  const actual = await capturePinnedSudoIdentity(options);
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error("Pinned sudo executable identity changed.");
  return actual;
}

export function systemCommandIdentityDigest(identity) {
  return sha256(Buffer.from(JSON.stringify(identity)));
}

async function executeProbe(executable, args) {
  return run(executable, args, {
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
  });
}
