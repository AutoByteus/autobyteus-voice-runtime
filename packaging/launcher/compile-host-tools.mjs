#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import {
  trustedGoEnvironment,
  verifyGoToolchain,
} from "../../build/locked-inputs.mjs";
import {
  parsePairs,
  ROOT,
  regularFiles,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";
const run = promisify(execFile);
const args = parsePairs(process.argv.slice(2), [
  "plan",
  "plan-copy",
  "go",
  "launcher",
  "manager",
  "provenance",
  "target",
  "host-package-id",
  "host-source-closure",
  "model-admission-root",
  "compatibility-requirement",
]);
for (const key of [
  "host-source-closure",
  "model-admission-root",
  "compatibility-requirement",
])
  if (!/^[a-f0-9]{64}$/.test(args[key])) throw new Error(`Invalid ${key}.`);
const plan = JSON.parse(await fs.readFile(path.resolve(args.plan), "utf8"));
if (
  plan.schemaVersion !== 2 ||
  plan.hostPackageId !== args["host-package-id"] ||
  `${plan.target.platform}-${plan.target.architecture}` !== args.target
)
  throw new Error("Host tool plan identity mismatch.");
const toolchain = await verifyGoToolchain(path.resolve(args.go));
const work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-host-tools-"));
try {
  for (const directory of [
    "contracts",
    "hostverify",
    "integrity",
    "internal",
    "launcher",
    "modelmanager",
    "modelstore",
  ])
    await fs.cp(path.join(ROOT, directory), path.join(work, directory), {
      recursive: true,
    });
  await fs.copyFile(path.join(ROOT, "go.mod"), path.join(work, "go.mod"));
  await fs.writeFile(path.join(work, "go.sum"), "");
  const canonical = Buffer.from(`${JSON.stringify(plan)}\n`);
  await fs.writeFile(
    path.join(
      work,
      "launcher/internal/embeddedplan/package-launcher-plan-v2.json",
    ),
    canonical,
  );
  const authority = [
    ["embeddedHostPackageID", args["host-package-id"]],
    ["embeddedHostSourceClosureSHA256", args["host-source-closure"]],
    ["embeddedModelAdmissionRootSHA256", args["model-admission-root"]],
    [
      "embeddedCompatibilityRequirementSHA256",
      args["compatibility-requirement"],
    ],
  ];
  const linkerFlags = (owner) => {
    const flags = ["-buildid="];
    for (const [name, value] of authority)
      flags.push(
        "-X",
        `github.com/AutoByteus/autobyteus-voice-runtime/${owner}/internal.${name}=${value}`,
      );
    return flags;
  };
  const environment = trustedGoEnvironment(toolchain, {
    platform: plan.target.platform,
    architecture: plan.target.architecture,
  });
  for (const [output, pkg, owner] of [
    [args.launcher, "./launcher/cmd/voice-provider-launcher", "launcher"],
    [args.manager, "./modelmanager/cmd/voice-model-manager", "modelmanager"],
  ]) {
    await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true });
    await run(
      toolchain.executable,
      [
        "build",
        "-trimpath",
        "-buildvcs=false",
        `-ldflags=${linkerFlags(owner).join(" ")}`,
        "-o",
        path.resolve(output),
        pkg,
      ],
      { cwd: work, env: environment, maxBuffer: 32 * 1024 * 1024 },
    );
    await fs.chmod(path.resolve(output), 0o755);
  }
  await fs.mkdir(path.dirname(path.resolve(args["plan-copy"])), {
    recursive: true,
  });
  await fs.writeFile(path.resolve(args["plan-copy"]), canonical);
  const sourceRows = [];
  for (const directory of [
    "contracts",
    "hostverify",
    "integrity",
    "internal",
    "launcher",
    "modelmanager",
    "modelstore",
  ])
    for (const file of await regularFiles(path.join(work, directory)))
      sourceRows.push([
        `${directory}/${file}`,
        await shaFile(path.join(work, directory, file)),
      ]);
  sourceRows.sort(([a], [b]) => a.localeCompare(b));
  await writeJson(path.resolve(args.provenance), {
    schemaVersion: 2,
    target: plan.target,
    hostPackageId: plan.hostPackageId,
    hostSourceClosureSha256: args["host-source-closure"],
    modelAdmissionRootSha256: args["model-admission-root"],
    compatibilityRequirementSha256: args["compatibility-requirement"],
    planSha256: digest(canonical),
    launcherSha256: await shaFile(path.resolve(args.launcher)),
    modelManagerSha256: await shaFile(path.resolve(args.manager)),
    sourceTreeSha256: digest(Buffer.from(`${JSON.stringify(sourceRows)}\n`)),
    goToolchain: { archive: toolchain.archive, root: toolchain.rootIdentity },
    flags: [
      "-trimpath",
      "-buildvcs=false",
      "-buildid=",
      "embedded-host-authority",
    ],
  });
} finally {
  await fs.rm(work, { recursive: true, force: true });
}
function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}
