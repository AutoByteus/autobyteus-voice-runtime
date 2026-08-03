import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, ROOT, shaFile } from "./lib/files.mjs";
import { assertPassingDarwinArm64Preflight } from "../benchmark/darwin-arm64-preflight-contract.mjs";
import {
  assertTrustedExecutableIdentity,
  canonicalExecutablePath,
} from "./native-tool-identities.mjs";
export {
  assertTrustedExecutableIdentity,
  canonicalExecutablePath,
  materializeTrustedToolDirectory,
  verifyTrustedToolDirectory,
} from "./native-tool-identities.mjs";
export {
  cmakeConfigureArguments,
  verifyResolvedCmakeConfiguration,
} from "./resolved-cmake-configuration.mjs";

export const CLEARED_NATIVE_BUILD_OVERRIDES = Object.freeze(
  [
    "AR",
    "ARCHFLAGS",
    "AS",
    "ASMFLAGS",
    "CC",
    "CCC_OVERRIDE_OPTIONS",
    "CFLAGS",
    "CMAKE_C_COMPILER_LAUNCHER",
    "CPPFLAGS",
    "CPATH",
    "CXX",
    "CXXFLAGS",
    "CMAKE_CXX_COMPILER_LAUNCHER",
    "DEVELOPER_DIR",
    "DYLD_LIBRARY_PATH",
    "GCC_EXEC_PREFIX",
    "INCLUDE",
    "LD",
    "LD_LIBRARY_PATH",
    "LDFLAGS",
    "LIBRARY_PATH",
    "MACOSX_DEPLOYMENT_TARGET",
    "OBJC_INCLUDE_PATH",
    "OBJCPLUS_INCLUDE_PATH",
    "CPLUS_INCLUDE_PATH",
    "C_INCLUDE_PATH",
    "SDKROOT",
    "TOOLCHAINS",
    "CMAKE_BUILD_PARALLEL_LEVEL",
    "CMAKE_GENERATOR",
    "CMAKE_GENERATOR_INSTANCE",
    "CMAKE_GENERATOR_PLATFORM",
    "CMAKE_GENERATOR_TOOLSET",
    "CMAKE_MAKE_PROGRAM",
    "CMAKE_PREFIX_PATH",
    "CMAKE_TOOLCHAIN_FILE",
  ].sort(),
);

const schema = await readJson(
    path.join(ROOT, "contracts/build/native-build-environment-v1.schema.json"),
  ),
  validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

export function assertNoUntrustedNativeBuildOverrides(
  environment = process.env,
) {
  const values = new Map(
    Object.entries(environment).map(([name, value]) => [
      name.toUpperCase(),
      value,
    ]),
  );
  const found = CLEARED_NATIVE_BUILD_OVERRIDES.filter(
    (name) => values.has(name) && String(values.get(name) ?? "") !== "",
  );
  if (found.length)
    throw new Error(`Untrusted native build override: ${found.join(",")}`);
}

export async function createTrustedNativeBuildEnvironment({
  preflightPath,
  cmakePath,
  environment = process.env,
}) {
  assertNoUntrustedNativeBuildOverrides(environment);
  const resolvedPreflight = path.resolve(preflightPath),
    preflight = await readJson(resolvedPreflight);
  await assertPassingDarwinArm64Preflight(preflight);
  const commands = preflight.tools.commandPaths,
    tools = {
      node: preflight.tools.nodeExecutable,
      cmake: preflight.tools.cmakeExecutable,
      cCompiler: preflight.tools.appleClangExecutable,
      cxxCompiler: preflight.tools.appleClangCxxExecutable,
      archiver: preflight.tools.appleArExecutable,
      ranlib: preflight.tools.appleRanlibExecutable,
      linker: preflight.tools.appleLinkerExecutable,
      libtool: preflight.tools.appleLibtoolExecutable,
      make: identity("/usr/bin/make", commands),
      shell: identity("/bin/sh", commands),
      tar: identity("/usr/bin/tar", commands),
      sdk: {
        path: preflight.tools.sdkPath,
        version: preflight.tools.sdk,
        settingsSha256: preflight.tools.sdkSettingsSha256,
      },
    };
  if ((await canonicalExecutablePath(cmakePath)) !== tools.cmake.path)
    throw new Error("CMake path does not match the passing preflight.");
  const record = {
    schemaVersion: 1,
    target: "darwin-arm64",
    preflightSha256: await shaFile(resolvedPreflight),
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
  await verifyTrustedNativeBuildEnvironment(record);
  return record;
}

export async function verifyTrustedNativeBuildEnvironment(record) {
  if (!validate(record))
    throw new Error(
      `Trusted native build environment invalid: ${JSON.stringify(validate.errors)}`,
    );
  for (const tool of [
    "node",
    "cmake",
    "cCompiler",
    "cxxCompiler",
    "archiver",
    "ranlib",
    "linker",
    "libtool",
    "make",
    "shell",
    "tar",
  ])
    await assertTrustedExecutableIdentity(record.tools[tool]);
  const settings = path.join(record.tools.sdk.path, "SDKSettings.json");
  if ((await shaFile(settings)) !== record.tools.sdk.settingsSha256)
    throw new Error("Trusted SDK settings identity mismatch.");
  if (record.environment.pathPolicy !== "isolated-verified-tools-v1")
    throw new Error("Trusted native PATH policy mismatch.");
  if (
    JSON.stringify(record.environment.clearedOverrides) !==
    JSON.stringify(CLEARED_NATIVE_BUILD_OVERRIDES)
  )
    throw new Error("Trusted native override policy mismatch.");
  return record;
}

export function trustedNativeBuildEnvironment(
  record,
  workDirectory,
  trustedToolDirectory,
) {
  if (!path.isAbsolute(trustedToolDirectory))
    throw new Error("Trusted native tool directory must be absolute.");
  const clean = {
    HOME: workDirectory,
    TMPDIR: workDirectory,
    TEMP: workDirectory,
    TMP: workDirectory,
    PATH: trustedToolDirectory,
    LANG: record.environment.locale,
    LC_ALL: record.environment.locale,
    ZERO_AR_DATE: "1",
    SOURCE_DATE_EPOCH: "0",
    PYTHONDONTWRITEBYTECODE: "1",
    SystemRoot: "",
    WINDIR: "",
  };
  for (const name of record.environment.clearedOverrides) clean[name] = "";
  return clean;
}

function identity(commandPath, commands) {
  const value = commands[commandPath];
  if (!value)
    throw new Error(`Preflight command identity missing: ${commandPath}`);
  return value;
}
