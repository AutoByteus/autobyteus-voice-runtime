import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const COMMIT = /^(?!0{40}$)[a-f0-9]{40}$/;

export async function assertIntegratedReleaseCommit({
  repository,
  releaseCommit,
  maintainedMainCommit,
  run = (args) => exec("git", args, { cwd: repository }),
}) {
  if (!COMMIT.test(releaseCommit) || !COMMIT.test(maintainedMainCommit))
    throw new Error("Invalid release lineage identity.");
  await run(["cat-file", "-e", `${releaseCommit}^{commit}`]);
  await run(["cat-file", "-e", `${maintainedMainCommit}^{commit}`]);
  try {
    await run([
      "merge-base",
      "--is-ancestor",
      releaseCommit,
      maintainedMainCommit,
    ]);
  } catch (error) {
    throw new Error("Release commit is not reachable from maintained main.", {
      cause: error,
    });
  }
}
