#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import { verifyGoToolchain } from "../build/locked-inputs.mjs";
import {
  canonicalExecutablePath,
  captureXcodeClangCxxIdentity,
  captureXcodeRanlibIdentity,
} from "../build/native-tool-identities.mjs";
import {
  capturePinnedSudoIdentity,
  systemCommandIdentityDigest,
} from "./system-command-identity.mjs";
import { parseDarwinThermalState } from "./darwin-thermal-state.mjs";
import {
  classifyPerformanceEnvironment,
  parseCpuIdleSample,
  parseTaskOwnedProcessNames,
  parseTopConsumerProcessNames,
} from "./darwin-performance-environment.mjs";

const run = promisify(execFile);
const PROFILE = path.join(
  ROOT,
  "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
);

export async function runDarwinArm64Preflight({ go, cmake, output }) {
  const record = emptyRecord();
  try {
    const goToolchain = await verifyGoToolchain(path.resolve(go));
    const [
      model,
      memory,
      battery,
      lowPower,
      thermal,
      pressure,
      cmakeVersion,
      clang,
      clangPath,
      clangCxxPath,
      arPath,
      ranlibPath,
      linkerPath,
      libtoolPath,
      xcode,
      sdk,
      sdkPath,
    ] = await Promise.all([
      command("/usr/sbin/sysctl", ["-n", "machdep.cpu.brand_string"]),
      command("/usr/sbin/sysctl", ["-n", "hw.memsize"]),
      command("/usr/bin/pmset", ["-g", "batt"]),
      command("/usr/bin/pmset", ["-g", "custom"]),
      command("/usr/bin/pmset", ["-g", "therm"]),
      command("/usr/bin/memory_pressure", ["-Q"]),
      command(path.resolve(cmake), ["--version"]),
      command("/usr/bin/xcrun", ["clang", "--version"]),
      command("/usr/bin/xcrun", ["--find", "clang"]),
      command("/usr/bin/xcrun", ["--find", "clang++"]),
      command("/usr/bin/xcrun", ["--find", "ar"]),
      command("/usr/bin/xcrun", ["--find", "ranlib"]),
      command("/usr/bin/xcrun", ["--find", "ld"]),
      command("/usr/bin/xcrun", ["--find", "libtool"]),
      command("/usr/bin/xcodebuild", ["-version"]),
      command("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-version"]),
      command("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-path"]),
    ]);
    record.host = {
      platform: process.platform,
      architecture: process.arch,
      cpuModel: model,
      totalMemoryBytes: Number(memory),
    };
    if (
      process.platform !== "darwin" ||
      process.arch !== "arm64" ||
      model !== "Apple M1 Max" ||
      Number(memory) < 64 * 1024 ** 3
    )
      throw blocked("host-ineligible");
    record.power = {
      acConnected: /AC Power/.test(battery),
      lowPowerModeOff: /lowpowermode\s+0/i.test(lowPower),
      caffeinateActive:
        (await command("/usr/bin/pgrep", ["-x", "caffeinate"], true)).length >
        0,
      thermalNormal: parseDarwinThermalState(thermal) === "normal",
      memoryPressureNormal:
        /System-wide memory free percentage:\s*(?:[3-9][0-9]|100)%/i.test(
          pressure,
        ),
    };
    if (Object.values(record.power).some((value) => value !== true))
      throw blocked("runner-power-or-pressure");
    record.performanceEnvironment = await capturePerformanceEnvironment();
    const sudoExecutable = await capturePinnedSudoIdentity(),
      appleClangExecutable = await executableIdentity(clangPath),
      appleLibtoolExecutable = await executableIdentity(libtoolPath);
    record.tools = {
      node: process.version,
      nodeExecutable: await executableIdentity(process.execPath),
      goArchiveSha256: goToolchain.archive.sha256,
      goRootTreeSha256: goToolchain.rootIdentity.treeSha256,
      cmake: cmakeVersion.split("\n")[0],
      cmakeExecutable: await executableIdentity(path.resolve(cmake)),
      appleClang: clang.split("\n")[0],
      appleClangExecutable,
      appleClangCxxExecutable: await xcodeClangCxxIdentity(
        clangCxxPath,
        appleClangExecutable,
      ),
      appleArExecutable: await executableIdentity(arPath),
      appleRanlibExecutable: await xcodeRanlibIdentity(
        ranlibPath,
        appleLibtoolExecutable,
      ),
      appleLinkerExecutable: await executableIdentity(linkerPath),
      appleLibtoolExecutable,
      xcode,
      sdk,
      sdkPath: await directoryIdentity(sdkPath),
      sdkSettingsSha256: await shaFile(path.join(sdkPath, "SDKSettings.json")),
      sudoExecutable,
      commandPaths: await requiredCommandIdentities(),
    };
    if (
      process.version !== "v22.23.1" ||
      record.tools.cmake !== "cmake version 4.3.3" ||
      record.tools.appleClang !==
        "Apple clang version 17.0.0 (clang-1700.4.4.1)" ||
      record.tools.xcode !== "Xcode 26.1.1\nBuild version 17B100" ||
      record.tools.sdk !== "26.1"
    )
      throw blocked("toolchain-identity");
    record.sandbox = await proveSandbox();
    if (!record.sandbox.networkDenied || !record.sandbox.localOperationsAllowed)
      throw blocked("sandbox-canary");
    await run("/usr/bin/sudo", ["-n", "/usr/sbin/purge"], { timeout: 30000 });
    record.purge = {
      command: "/usr/bin/sudo -n /usr/sbin/purge",
      nonInteractivePass: true,
      sudoExecutableIdentitySha256: systemCommandIdentityDigest(sudoExecutable),
    };
    record.status = "pass";
  } catch (error) {
    record.status = "blocked";
    record.failureCategory =
      error.failureCategory ?? "preflight-command-failed";
  }
  await validateAndWrite(record, output);
  if (record.status !== "pass") {
    const error = new Error(
      `M1 qualification preflight blocked: ${record.failureCategory}`,
    );
    error.code = "PREFLIGHT_BLOCKED";
    throw error;
  }
  return record;
}

function emptyRecord() {
  return {
    schemaVersion: 2,
    target: "darwin-arm64",
    status: "blocked",
    checkedAt: new Date().toISOString(),
    host: {},
    power: {},
    performanceEnvironment: {},
    tools: {},
    sandbox: {},
    purge: {},
    failureCategory: null,
  };
}

function blocked(failureCategory) {
  const error = new Error(failureCategory);
  error.failureCategory = failureCategory;
  return error;
}

async function capturePerformanceEnvironment() {
  const taskOutput = await command(
      "/usr/bin/pgrep",
      [
        "-fl",
        "voice-provider|voice-model-manager|host-package-assembler|cmake --build",
      ],
      true,
    ),
    cpuIdleSamples = [];
  for (let index = 0; index < 6; index++)
    cpuIdleSamples.push(
      parseCpuIdleSample(
        await command("/usr/bin/top", ["-l", "2", "-s", "10", "-n", "0"]),
      ),
    );
  const consumerOutput = await command("/usr/bin/top", [
    "-l",
    "1",
    "-o",
    "cpu",
    "-n",
    "10",
    "-stats",
    "command",
  ]);
  return classifyPerformanceEnvironment({
    cpuIdleSamples,
    taskOwnedCompetingProcessNames: parseTaskOwnedProcessNames(taskOutput),
    topConsumerProcessNames: parseTopConsumerProcessNames(consumerOutput),
  });
}

async function proveSandbox() {
  const canary = [
    "-e",
    `const fs=require('fs'),net=require('net');fs.accessSync(process.execPath);const s=net.connect(443,'1.1.1.1');s.on('connect',()=>process.exit(9));s.on('error',()=>{console.log('network-denied-local-ok');process.exit(0)});setTimeout(()=>process.exit(8),3000);`,
  ];
  const result = await run(
    "/usr/bin/sandbox-exec",
    ["-f", PROFILE, process.execPath, ...canary],
    { timeout: 5000 },
  );
  return {
    profile: "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
    profileSha256: await shaFile(PROFILE),
    networkDenied: result.stdout === "network-denied-local-ok\n",
    localOperationsAllowed: result.stdout === "network-denied-local-ok\n",
  };
}

async function requiredCommandIdentities() {
  const result = {};
  for (const commandPath of [
    "/usr/bin/sandbox-exec",
    "/usr/bin/pmset",
    "/usr/bin/top",
    "/usr/sbin/sysctl",
    "/usr/bin/memory_pressure",
    "/usr/bin/caffeinate",
    "/usr/sbin/purge",
    "/usr/bin/pgrep",
    "/usr/bin/xcrun",
    "/usr/bin/xcodebuild",
    "/usr/bin/make",
    "/usr/bin/sed",
    "/usr/bin/tar",
    "/bin/sh",
  ]) {
    result[commandPath] = await executableIdentity(commandPath);
  }
  return result;
}

async function executableIdentity(executable) {
  try {
    const resolved = await canonicalExecutablePath(executable);
    return { path: resolved, sha256: await shaFile(resolved) };
  } catch {
    throw blocked("toolchain-command-identity");
  }
}

async function xcodeRanlibIdentity(executable, libtoolIdentity) {
  try {
    return await captureXcodeRanlibIdentity(executable, libtoolIdentity);
  } catch {
    throw blocked("toolchain-command-identity");
  }
}

async function xcodeClangCxxIdentity(executable, cCompilerIdentity) {
  try {
    return await captureXcodeClangCxxIdentity(executable, cCompilerIdentity);
  } catch {
    throw blocked("toolchain-command-identity");
  }
}

async function directoryIdentity(directory) {
  const resolved = await fs.realpath(directory),
    info = await fs.lstat(resolved);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw blocked("toolchain-directory-identity");
  return resolved;
}

async function command(executable, args, allowFailure = false) {
  try {
    return (
      await run(executable, args, {
        timeout: 120000,
        maxBuffer: 4 * 1024 * 1024,
      })
    ).stdout.trim();
  } catch (error) {
    if (allowFailure && [1, 2].includes(error.code)) return "";
    throw error;
  }
}

async function validateAndWrite(record, output) {
  const schema = await readJson(
    path.join(
      ROOT,
      "contracts/qualification/darwin-arm64-preflight-v2.schema.json",
    ),
  );
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(record))
    throw new Error(
      `Preflight record invalid: ${JSON.stringify(validate.errors)}`,
    );
  await writeJson(path.resolve(output), record);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), ["go", "cmake", "output"]);
  await runDarwinArm64Preflight({
    go: args.go,
    cmake: args.cmake,
    output: args.output,
  });
}
