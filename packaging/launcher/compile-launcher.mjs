#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { verifyGoToolchain } from "../../build/locked-inputs.mjs";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const args = parseArgs(process.argv.slice(2));
const plan = JSON.parse(await fs.readFile(args.plan, "utf8"));
validatePlan(plan);
const locked = JSON.parse(
  await fs.readFile(path.join(projectRoot, "build/locked-inputs.json"), "utf8"),
);
const goBinary = path.resolve(args.go);
const goToolchainIdentity = await verifyGoToolchain(goBinary);
const version = (await execFileAsync(goBinary, ["version"])).stdout.trim();
if (
  version !==
  `go version go${locked.goToolchain.version} ${process.platform}/${process.arch}`
)
  throw new Error(
    "Launcher compiler is not the repository-pinned host Go toolchain.",
  );
const tuple = `${plan.target.platform}-${plan.target.architecture}`;
if (tuple !== args.target)
  throw new Error("Launcher plan target does not match requested target.");
const work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-launcher-build-"));
try {
  await fs.cp(path.join(projectRoot, "launcher"), path.join(work, "launcher"), {
    recursive: true,
  });
  await fs.copyFile(
    path.join(projectRoot, "go.mod"),
    path.join(work, "go.mod"),
  );
  await fs.writeFile(path.join(work, "go.sum"), "");
  const canonical = Buffer.from(`${JSON.stringify(plan)}\n`);
  await fs.writeFile(
    path.join(
      work,
      "launcher/internal/embeddedplan/package-launcher-plan-v1.json",
    ),
    canonical,
  );
  const goModuleSha256 = digest(await fs.readFile(path.join(work, "go.mod")));
  const goSumSha256 = digest(await fs.readFile(path.join(work, "go.sum")));
  const launcherSourceSha256 = await treeDigest(path.join(work, "launcher"));
  await fs.mkdir(path.dirname(args.output), { recursive: true });
  const platform =
    plan.target.platform === "win32" ? "windows" : plan.target.platform;
  const arch =
    plan.target.architecture === "x64" ? "amd64" : plan.target.architecture;
  const environment = {
    ...process.env,
    CGO_ENABLED: "0",
    GOOS: platform,
    GOARCH: arch,
    GOTOOLCHAIN: "local",
  };
  await execFileAsync(
    goBinary,
    [
      "build",
      "-trimpath",
      "-buildvcs=false",
      "-ldflags=-buildid=",
      "-o",
      args.output,
      "./launcher/cmd/voice-provider-launcher",
    ],
    { cwd: work, env: environment, maxBuffer: 16 * 1024 * 1024 },
  );
  await fs.chmod(args.output, 0o755);
  await fs.mkdir(path.dirname(args.planCopy), { recursive: true });
  await fs.writeFile(args.planCopy, canonical);
  const provenance = {
    schemaVersion: 1,
    goVersion: locked.goToolchain.version,
    goToolchainArchive: goToolchainIdentity,
    goModuleSha256,
    goSumSha256,
    launcherSourceSha256,
    cgoEnabled: false,
    target: plan.target,
    planSha256: digest(canonical),
    launcherSha256: digest(await fs.readFile(args.output)),
    flags: ["-trimpath", "-buildvcs=false", "-ldflags=-buildid="],
  };
  await fs.writeFile(
    args.provenance,
    `${JSON.stringify(provenance, null, 2)}\n`,
  );
} finally {
  await fs.rm(work, { recursive: true, force: true });
}
function parseArgs(values) {
  const result = {};
  for (let i = 0; i < values.length; i += 2) {
    if (!values[i]?.startsWith("--") || !values[i + 1])
      throw new Error("Arguments must be --name value pairs.");
    result[values[i].slice(2)] = path.resolve(values[i + 1]);
  }
  for (const key of ["plan", "planCopy", "go", "output", "provenance"])
    if (!result[key]) throw new Error(`Missing --${key}.`);
  result.target = values[values.indexOf("--target") + 1];
  return result;
}
function validatePlan(value) {
  const fields = Object.keys(value).sort().join(",");
  if (
    fields !== "invocation,packageId,schemaVersion,target" ||
    value.schemaVersion !== 1 ||
    !value.packageId
  )
    throw new Error("Invalid launcher plan.");
  const expected =
    value.invocation.kind === "python-worker"
      ? "executable,kind,worker"
      : "executable,kind";
  if (Object.keys(value.invocation).sort().join(",") !== expected)
    throw new Error("Invalid launcher invocation.");
  for (const item of [
    value.invocation.executable,
    value.invocation.worker,
  ].filter(Boolean))
    if (
      !/^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\\)[A-Za-z0-9._/-]+$/.test(item)
    )
      throw new Error("Invalid contained launcher path.");
}
function hostTuple() {
  const platform = process.platform;
  const arch = process.arch === "x64" ? "x64" : process.arch;
  return `${platform}-${arch}`;
}
function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}
async function treeDigest(root) {
  const records = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile()))
        throw new Error("Launcher source contains a non-regular entry.");
      if (entry.isDirectory()) await visit(target);
      else {
        const relative = path.relative(root, target).split(path.sep).join("/");
        const bytes = await fs.readFile(target);
        records.push([relative, bytes.length, digest(bytes)]);
      }
    }
  }
  await visit(root);
  records.sort(([left], [right]) => left.localeCompare(right));
  return digest(Buffer.from(`${JSON.stringify(records)}\n`));
}
