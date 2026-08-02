import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export async function verifyGitSource(directory, commit, label) {
  if (!/^(?!0{40}$)[a-f0-9]{40}$/.test(commit))
    throw new Error(`${label} has an invalid locked revision.`);
  const head = (
    await run("git", ["-C", directory, "rev-parse", "HEAD"])
  ).stdout.trim();
  if (head !== commit) throw new Error(`${label} revision mismatch.`);
  try {
    await run("git", ["-C", directory, "diff", "--quiet"]);
    await run("git", ["-C", directory, "diff", "--cached", "--quiet"]);
  } catch (error) {
    throw new Error(`${label} source tree differs from its locked commit.`, {
      cause: error,
    });
  }
  const untracked = (
    await run("git", [
      "-C",
      directory,
      "ls-files",
      "--others",
      "--exclude-standard",
    ])
  ).stdout.trim();
  if (untracked)
    throw new Error(`${label} source tree contains untracked bytes.`);
  const ignored = (
    await run("git", [
      "-C",
      directory,
      "ls-files",
      "--others",
      "--ignored",
      "--exclude-standard",
    ])
  ).stdout.trim();
  if (ignored) throw new Error(`${label} source tree contains ignored bytes.`);
}
