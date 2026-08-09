import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ROOT } from "./lib/files.mjs";
import { trustedHostBuildEnvironment } from "./host-build-environment.mjs";
import { hostLauncherPlan } from "./host-package-staging.mjs";

const run = promisify(execFile);

export async function compileStagedHostTools({
  stage,
  work,
  profileId,
  entry,
  target,
  go,
  native,
  trustedTools,
  hostSourceClosureSha256,
}) {
  const {
      privateExecutable,
      worker,
      value: plan,
    } = hostLauncherPlan({ profileId, entry, target }),
    planInput = path.join(work, "plan.json"),
    planPath = path.join(stage, "provider/package-launcher-plan-v2.json"),
    launcherPath = path.join(stage, "bin/voice-provider"),
    managerPath = path.join(stage, "bin/voice-model-manager"),
    toolProvenance = path.join(work, "host-tool-provenance-v2.json");
  await fs.writeFile(planInput, `${JSON.stringify(plan)}\n`);
  await run(
    process.execPath,
    [
      path.join(ROOT, "packaging/launcher/compile-host-tools.mjs"),
      "--plan",
      planInput,
      "--plan-copy",
      planPath,
      "--go",
      go,
      "--launcher",
      launcherPath,
      "--manager",
      managerPath,
      "--provenance",
      toolProvenance,
      "--target",
      `${target.platform}-${target.architecture}`,
      "--host-package-id",
      entry.hostPackageId,
      "--host-source-closure",
      hostSourceClosureSha256,
      "--model-admission-root",
      entry.modelAdmissionRoot.sha256,
      "--compatibility-requirement",
      entry.compatibilityRequirementSha256,
    ],
    {
      cwd: ROOT,
      env: trustedHostBuildEnvironment(native, work, trustedTools),
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  return {
    privateExecutable,
    worker,
    planPath,
    launcherPath,
    managerPath,
    toolProvenance,
  };
}
