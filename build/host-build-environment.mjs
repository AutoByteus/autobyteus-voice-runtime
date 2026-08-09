#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "./lib/files.mjs";
import {
  assertNoUntrustedNativeBuildOverrides,
  CLEARED_NATIVE_BUILD_OVERRIDES,
  trustedNativeBuildEnvironment,
} from "./trusted-native-environment.mjs";
import {
  assertTrustedExecutableIdentity,
  assertXcodeClangCxxIdentity,
  assertXcodeRanlibIdentity,
  canonicalExecutablePath,
  captureXcodeClangCxxIdentity,
  captureXcodeRanlibIdentity,
  materializeTrustedToolDirectory,
  verifyTrustedToolDirectory,
} from "./native-tool-identities.mjs";
export { materializeTrustedToolDirectory, verifyTrustedToolDirectory };
export const trustedHostBuildEnvironment = trustedNativeBuildEnvironment;

const run = promisify(execFile),
  schema = await readJson(
    path.join(ROOT, "contracts/build/host-build-environment-v2.schema.json"),
  ),
  validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema),
  MINIMUM_FREE_DISK = 8 * 1024 * 1024 * 1024;

export async function captureHostBuildEnvironment({
  cmakePath,
  runnerLabel,
  environment = process.env,
}) {
  assertNoUntrustedNativeBuildOverrides(environment);
  if (process.platform !== "darwin" || process.arch !== "arm64")
    throw new Error("Host build requires darwin-arm64.");
  const xcrun = async (...args) =>
      (await run("/usr/bin/xcrun", args, { encoding: "utf8" })).stdout.trim(),
    ordinary = async (executable) => {
      const canonical = await canonicalExecutablePath(executable);
      return { path: canonical, sha256: await shaFile(canonical) };
    },
    cCompiler = await ordinary(await xcrun("--find", "clang")),
    libtool = await ordinary(await xcrun("--find", "libtool")),
    sdkPath = await xcrun("--sdk", "macosx", "--show-sdk-path"),
    sdkVersion = await xcrun("--sdk", "macosx", "--show-sdk-version"),
    xcodeVersion = (
      await run("/usr/bin/xcodebuild", ["-version"], { encoding: "utf8" })
    ).stdout.trim(),
    cpuModel = (
      await run("/usr/sbin/sysctl", ["-n", "machdep.cpu.brand_string"], {
        encoding: "utf8",
      })
    ).stdout.trim(),
    logicalCpuCount = Number(
      (
        await run("/usr/sbin/sysctl", ["-n", "hw.logicalcpu"], {
          encoding: "utf8",
        })
      ).stdout.trim(),
    ),
    memoryBytes = Number(
      (
        await run("/usr/sbin/sysctl", ["-n", "hw.memsize"], {
          encoding: "utf8",
        })
      ).stdout.trim(),
    ),
    stat = await fs.statfs(ROOT),
    observedFreeDiskBytes = Number(stat.bavail) * Number(stat.bsize),
    tools = {
      node: await ordinary(process.execPath),
      cmake: await ordinary(cmakePath),
      cCompiler,
      cxxCompiler: await captureXcodeClangCxxIdentity(
        await xcrun("--find", "clang++"),
        cCompiler,
      ),
      archiver: await ordinary(await xcrun("--find", "ar")),
      ranlib: await captureXcodeRanlibIdentity(
        await xcrun("--find", "ranlib"),
        libtool,
      ),
      linker: await ordinary(await xcrun("--find", "ld")),
      libtool,
      make: await ordinary("/usr/bin/make"),
      sed: await ordinary("/usr/bin/sed"),
      shell: await ordinary("/bin/sh"),
      tar: await ordinary("/usr/bin/tar"),
      sdk: {
        path: sdkPath,
        version: sdkVersion,
        settingsSha256: await shaFile(path.join(sdkPath, "SDKSettings.json")),
      },
    },
    record = {
      schemaVersion: 2,
      target: "darwin-arm64",
      authority: {
        runnerLabel,
        xcodeVersion,
        sdkVersion,
        cpuModel,
        logicalCpuCount,
        memoryBytes,
        minimumFreeDiskBytes: MINIMUM_FREE_DISK,
        observedFreeDiskBytes,
      },
      tools,
      configuration: {
        generator: "Unix Makefiles",
        buildType: "Release",
        parallelism: 1,
        flagPolicy: "empty-external-native-flags-v1",
      },
      environment: {
        pathPolicy: "isolated-verified-tools-v1",
        locale: "C",
        clearedOverrides: CLEARED_NATIVE_BUILD_OVERRIDES,
      },
    };
  const cmakeVersion = (
    await run(tools.cmake.path, ["--version"], { encoding: "utf8" })
  ).stdout.match(/^cmake version ([^\s]+)/)?.[1];
  if (
    process.version !== "v22.23.1" ||
    cmakeVersion !== "4.2.0" ||
    !xcodeVersion.startsWith("Xcode 26.1.1\n") ||
    sdkVersion !== "26.1"
  )
    throw new Error("Standard host tool version lock mismatch.");
  await verifyHostBuildEnvironment(record);
  return record;
}

export async function verifyHostBuildEnvironment(record) {
  if (!validate(record))
    throw new Error(
      `Host build environment invalid: ${JSON.stringify(validate.errors)}`,
    );
  if (
    record.authority.observedFreeDiskBytes <
    record.authority.minimumFreeDiskBytes
  )
    throw new Error("Host build environment has insufficient free disk.");
  for (const name of [
    "node",
    "cmake",
    "cCompiler",
    "archiver",
    "linker",
    "libtool",
    "make",
    "sed",
    "shell",
    "tar",
  ])
    await assertTrustedExecutableIdentity(record.tools[name]);
  await assertXcodeClangCxxIdentity(
    record.tools.cxxCompiler,
    record.tools.cCompiler,
  );
  await assertXcodeRanlibIdentity(record.tools.ranlib, record.tools.libtool);
  if (
    (await shaFile(path.join(record.tools.sdk.path, "SDKSettings.json"))) !==
    record.tools.sdk.settingsSha256
  )
    throw new Error("Host build SDK identity changed.");
  return record;
}

export async function consumeHostBuildEnvironment({
  recordPath,
  environment = process.env,
}) {
  assertNoUntrustedNativeBuildOverrides(environment);
  return verifyHostBuildEnvironment(await readJson(path.resolve(recordPath)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
      "cmake",
      "runner-label",
      "output",
    ]),
    record = await captureHostBuildEnvironment({
      cmakePath: args.cmake,
      runnerLabel: args["runner-label"],
    });
  await writeJson(path.resolve(args.output), record);
}
