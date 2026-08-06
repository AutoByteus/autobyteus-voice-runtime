import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readJson, shaFile } from "../build/lib/files.mjs";
import {
  ACCEPTED_ARCHIVES,
  QUALIFIED_SOURCE_COMMIT,
  QUALIFIED_SOURCE_TREE,
} from "./recovery-authority.mjs";

const exec = promisify(execFile);
const FORBIDDEN_ENV = [
  "NODE_OPTIONS",
  "PYTHONPATH",
  "PYTHONHOME",
  "GOCACHEPROG",
  "GOROOT",
  "GOENV",
  "GOFLAGS",
  "CC",
  "CXX",
  "CFLAGS",
  "CXXFLAGS",
  "LDFLAGS",
  "CMAKE_TOOLCHAIN_FILE",
];

export async function executeRecoveryBuild(config) {
  assertRecoveryBuildConfig(config);
  const source = path.resolve(config.qualifiedSource),
    output = path.resolve(config.output),
    assets = path.join(output, "assets"),
    recovery = path.join(output, "recovery"),
    inputs = path.join(output, "inputs");
  await assertQualifiedCheckout(source);
  await fs.mkdir(output);
  await fs.mkdir(assets, { recursive: false });
  await fs.mkdir(recovery, { recursive: false });
  await fs.mkdir(inputs, { recursive: false });
  const environmentPath = path.join(output, "native-build-environment.json");
  await runNode(source, "build/create-native-build-environment.mjs", [
    "--preflight",
    config.preflight,
    "--cmake",
    config.cmake,
    "--output",
    environmentPath,
  ]);
  const observed = [];
  for (const expected of ACCEPTED_ARCHIVES)
    observed.push(
      await recoverProfile({
        config,
        source,
        inputs,
        assets,
        recovery,
        environmentPath,
        expected,
      }),
    );
  return { observed, environmentPath };
}

export async function verifyRecoveryNetworkDenial(source) {
  const profile = path.join(
      path.resolve(source),
      "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
    ),
    started = Date.now();
  let denied = false;
  try {
    await exec(
      "/usr/bin/sandbox-exec",
      [
        "-f",
        profile,
        process.execPath,
        "-e",
        "require('node:net').connect(443,'1.1.1.1').on('error',e=>process.exit(e.code==='EPERM'?77:78));setTimeout(()=>process.exit(0),1500)",
      ],
      { env: closedEnvironment(), timeout: 5000 },
    );
  } catch (error) {
    denied = error.code === 77;
  }
  if (!denied)
    throw new Error("Recovery network-denial canary did not fail closed.");
  return {
    schemaVersion: 1,
    decision: "pass",
    profileFileName: "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
    profileSha256: await shaFile(profile),
    canary: "outbound-tcp-denied",
    buildWindow: "network-denied",
    elapsedMilliseconds: Date.now() - started,
  };
}

async function recoverProfile(context) {
  const {
      config,
      source,
      inputs,
      assets,
      recovery,
      environmentPath,
      expected,
    } = context,
    profileInputs = path.join(inputs, `${expected.profileId}-darwin-arm64`),
    archive = path.join(assets, expected.fileName),
    buildReport = `${archive}.build.json`,
    verification = path.join(profileInputs, "package-verification.json"),
    logPath = path.join(recovery, `${expected.profileId}-build.log`),
    recipe = path.join(
      source,
      `build/input-recipes/${expected.profileId}-darwin-arm64-v1.json`,
    );
  const lines = [];
  try {
    await loggedNode(lines, source, "build/materialize-release-inputs.mjs", [
      "--recipe",
      recipe,
      "--cache",
      config.cacheRoot,
      "--repository",
      source,
      "--destination",
      profileInputs,
      "--source-commit",
      QUALIFIED_SOURCE_COMMIT,
    ]);
    await loggedCommand(
      lines,
      "/usr/bin/sandbox-exec",
      [
        "-f",
        path.join(
          source,
          "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
        ),
        process.execPath,
        path.join(source, "build/package-assembler.mjs"),
        "--profile",
        expected.profileId,
        "--target",
        "darwin-arm64",
        "--inputs",
        profileInputs,
        "--output",
        archive,
        "--go",
        config.go,
        "--preflight",
        config.preflight,
        "--build-environment",
        environmentPath,
        "--source-commit",
        QUALIFIED_SOURCE_COMMIT,
        "--version",
        "1.0.0",
      ],
      source,
    );
    await loggedNode(lines, source, "build/package-verifier.mjs", [
      "--archive",
      archive,
      "--build-report",
      buildReport,
      "--go",
      config.go,
      "--output",
      verification,
    ]);
    return await verifyObservedProfile({
      expected,
      archive,
      buildReport,
      verification,
      provenance: `${archive}.provenance.json`,
    });
  } finally {
    await fs.writeFile(logPath, boundedLog(lines));
  }
}

async function verifyObservedProfile(paths) {
  const { expected, archive, buildReport, verification, provenance } = paths,
    archiveInfo = await fs.lstat(archive),
    build = await readJson(buildReport),
    verified = await readJson(verification),
    observed = {
      profileId: expected.profileId,
      buildCount: 1,
      fileName: expected.fileName,
      expectedSizeBytes: expected.sizeBytes,
      observedSizeBytes: archiveInfo.size,
      expectedSha256: expected.sha256,
      observedSha256: await shaFile(archive),
      descriptorSha256: verified.descriptorSha256,
      fileManifestSha256: verified.fileManifestSha256,
      descriptorSourceCommit: build.sourceCommit,
      buildReportSha256: await shaFile(buildReport),
      provenanceSha256: await shaFile(provenance),
      exactMatch: false,
    };
  observed.exactMatch =
    observed.observedSizeBytes === expected.sizeBytes &&
    observed.observedSha256 === expected.sha256 &&
    observed.descriptorSha256 === expected.descriptorSha256 &&
    observed.fileManifestSha256 === expected.fileManifestSha256 &&
    observed.descriptorSourceCommit === QUALIFIED_SOURCE_COMMIT &&
    observed.buildReportSha256 === expected.buildReportSha256 &&
    observed.provenanceSha256 === expected.provenanceSha256;
  if (!observed.exactMatch)
    throw new Error(`Recovered ${expected.profileId} archive is not exact.`);
  return observed;
}

async function assertQualifiedCheckout(source) {
  const head = (
      await exec("git", ["rev-parse", "HEAD"], { cwd: source })
    ).stdout.trim(),
    tree = (
      await exec("git", ["show", "-s", "--format=%T", "HEAD"], { cwd: source })
    ).stdout.trim(),
    dirty = (await exec("git", ["status", "--porcelain"], { cwd: source }))
      .stdout;
  if (
    head !== QUALIFIED_SOURCE_COMMIT ||
    tree !== QUALIFIED_SOURCE_TREE ||
    dirty !== ""
  )
    throw new Error(
      "Recovery requires the exact clean detached qualified checkout.",
    );
  const branch = (
    await exec("git", ["symbolic-ref", "-q", "--short", "HEAD"], {
      cwd: source,
    }).catch(() => ({ stdout: "" }))
  ).stdout.trim();
  if (branch) throw new Error("Qualified recovery checkout must be detached.");
}

function assertRecoveryBuildConfig(config) {
  for (const key of [
    "qualifiedSource",
    "output",
    "cacheRoot",
    "go",
    "cmake",
    "preflight",
  ])
    if (typeof config?.[key] !== "string" || !path.isAbsolute(config[key]))
      throw new Error(`Recovery config ${key} must be an absolute path.`);
  if (FORBIDDEN_ENV.some((key) => process.env[key]))
    throw new Error("Recovery build environment contains an override.");
}

async function runNode(cwd, script, args) {
  return exec(process.execPath, [path.join(cwd, script), ...args], {
    cwd,
    env: closedEnvironment(),
    maxBuffer: 32 * 1024 * 1024,
  });
}

async function loggedNode(lines, cwd, script, args) {
  try {
    const result = await runNode(cwd, script, args);
    lines.push(`[node ${script}]`, result.stdout, result.stderr);
  } catch (error) {
    lines.push(`[node ${script}] failed`, error.stdout, error.stderr);
    throw error;
  }
}

async function loggedCommand(lines, command, args, cwd) {
  try {
    const result = await exec(command, args, {
      cwd,
      env: closedEnvironment(),
      maxBuffer: 32 * 1024 * 1024,
    });
    lines.push(`[${path.basename(command)}]`, result.stdout, result.stderr);
  } catch (error) {
    lines.push(
      `[${path.basename(command)}] failed`,
      error.stdout,
      error.stderr,
    );
    throw error;
  }
}

function closedEnvironment() {
  const env = { ...process.env };
  for (const key of FORBIDDEN_ENV) delete env[key];
  return env;
}

function boundedLog(lines) {
  let clean = lines
    .filter((line) => typeof line === "string")
    .join("\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
  for (const [key, value] of Object.entries(process.env))
    if (/TOKEN|SECRET|PASSWORD|CREDENTIAL/i.test(key) && value?.length >= 8)
      clean = clean.replaceAll(value, "[REDACTED]");
  if (Buffer.byteLength(clean) > 1024 * 1024)
    throw new Error("Recovery build log exceeds the bounded evidence limit.");
  return `${clean.trimEnd()}\n`;
}
