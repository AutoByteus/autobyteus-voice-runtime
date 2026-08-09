import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ROOT, sha256 } from "../build/lib/files.mjs";

const run = promisify(execFile);

export async function gitFileSha256(commit, fileName, repository = ROOT) {
  if (
    !/^(?!0{40})[a-f0-9]{40}$/.test(commit) ||
    !/^[A-Za-z0-9._/-]+$/.test(fileName) ||
    fileName.startsWith("/") ||
    fileName.split("/").some((part) => !part || part === "." || part === "..")
  )
    throw new Error("Git file identity input is invalid.");
  const { stdout } = await run("git", ["show", `${commit}:${fileName}`], {
    cwd: repository,
    encoding: "buffer",
    maxBuffer: 4 * 1024 * 1024,
  });
  return sha256(stdout);
}
