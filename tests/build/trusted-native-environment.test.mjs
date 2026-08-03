import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import {
  assertNoUntrustedNativeBuildOverrides,
  assertTrustedExecutableIdentity,
  cmakeConfigureArguments,
  consumeTrustedNativeBuildEnvironment,
  createTrustedNativeBuildEnvironment,
  materializeTrustedToolDirectory,
  trustedNativeBuildEnvironment,
  verifyResolvedCmakeConfiguration,
  verifyTrustedToolDirectory,
} from "../../build/trusted-native-environment.mjs";
import { shaFile, writeJson } from "../../build/lib/files.mjs";
import { systemCommandIdentityDigest } from "../../benchmark/system-command-identity.mjs";
import { passingDarwinPreflightFixture } from "../fixtures/passing-darwin-preflight.mjs";

const root = path.resolve(import.meta.dirname, "../.."),
  run = promisify(execFile);

test("native build overrides are rejected case-insensitively before use", () => {
  for (const name of [
    "CXXFLAGS",
    "cflags",
    "LDFLAGS",
    "SDKROOT",
    "CMAKE_GENERATOR",
    "CMAKE_TOOLCHAIN_FILE",
    "CPATH",
    "CMAKE_CXX_COMPILER_LAUNCHER",
    "DYLD_LIBRARY_PATH",
  ])
    assert.throws(
      () => assertNoUntrustedNativeBuildOverrides({ [name]: "untrusted" }),
      /Untrusted native build override/,
      name,
    );
  assert.doesNotThrow(() =>
    assertNoUntrustedNativeBuildOverrides({ CXXFLAGS: "" }),
  );
});

test("the production environment owner accepts the preflight CMake symlink", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-symlink-test-"),
  );
  try {
    const tool = path.join(temp, "cmake-real"),
      supplied = path.join(temp, "cmake");
    await fs.writeFile(tool, "fixture\n", { mode: 0o755 });
    await fs.symlink(path.basename(tool), supplied);
    const preflightPath = path.join(temp, "preflight.json");
    await writeJson(
      preflightPath,
      await passingDarwinPreflightFixture(temp, tool),
    );
    const record = await createTrustedNativeBuildEnvironment({
      preflightPath,
      cmakePath: supplied,
      environment: {},
    });
    assert.equal(record.tools.cmake.path, await fs.realpath(tool));
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("the canonical sandboxed package entry consumes outside-authorized preflight without sudo spawn", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-sandbox-entry-test-"),
  );
  try {
    const tool = path.join(temp, "cmake-real"),
      supplied = path.join(temp, "cmake"),
      preflightPath = path.join(temp, "preflight.json"),
      recordPath = path.join(temp, "native-build-environment-v1.json"),
      profile = path.join(
        root,
        "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
      );
    await fs.writeFile(tool, "fixture\n", { mode: 0o755 });
    await fs.symlink(path.basename(tool), supplied);
    const preflight = await passingDarwinPreflightFixture(temp, tool);
    await writeJson(preflightPath, preflight);
    const record = await createTrustedNativeBuildEnvironment({
      preflightPath,
      cmakePath: supplied,
      environment: {},
    });
    await writeJson(recordPath, record);

    const module = pathToFileURL(
        path.join(root, "build/trusted-native-environment.mjs"),
      ).href,
      script = `import {consumeTrustedNativeBuildEnvironment as consume} from ${JSON.stringify(module)};await consume({recordPath:${JSON.stringify(recordPath)},preflightPath:${JSON.stringify(preflightPath)},environment:{}});`;
    await run(
      "/usr/bin/sandbox-exec",
      [
        "-f",
        profile,
        process.execPath,
        "--input-type=module",
        "--eval",
        script,
      ],
      { timeout: 30000, maxBuffer: 4 * 1024 * 1024 },
    );

    const probeDrift = structuredClone(preflight);
    probeDrift.tools.sudoExecutable.probe.stdoutSha256 = "0".repeat(64);
    probeDrift.purge.sudoExecutableIdentitySha256 = systemCommandIdentityDigest(
      probeDrift.tools.sudoExecutable,
    );
    await writeJson(preflightPath, probeDrift);
    await assert.rejects(
      consumeTrustedNativeBuildEnvironment({
        recordPath,
        preflightPath,
        environment: {},
      }),
      /does not bind the preflight/,
    );
    const capabilityDrift = structuredClone(preflight);
    capabilityDrift.purge.nonInteractivePass = false;
    await writeJson(preflightPath, capabilityDrift);
    await assert.rejects(
      consumeTrustedNativeBuildEnvironment({
        recordPath,
        preflightPath,
        environment: {},
      }),
      /Passing M1 preflight required/,
    );
    const identityDrift = structuredClone(preflight);
    identityDrift.tools.sudoExecutable.inode = `${
      BigInt(identityDrift.tools.sudoExecutable.inode) + 1n
    }`;
    identityDrift.purge.sudoExecutableIdentitySha256 =
      systemCommandIdentityDigest(identityDrift.tools.sudoExecutable);
    await writeJson(preflightPath, identityDrift);
    await assert.rejects(
      consumeTrustedNativeBuildEnvironment({
        recordPath,
        preflightPath,
        environment: {},
      }),
      /sudo metadata identity changed/,
    );
    const sandboxDrift = structuredClone(preflight);
    sandboxDrift.sandbox.profileSha256 = "0".repeat(64);
    await writeJson(preflightPath, sandboxDrift);
    await assert.rejects(
      consumeTrustedNativeBuildEnvironment({
        recordPath,
        preflightPath,
        environment: {},
      }),
      /preflight identities do not recompute/,
    );
    await writeJson(preflightPath, preflight);
    await fs.writeFile(tool, "changed\n", { mode: 0o755 });
    await assert.rejects(
      consumeTrustedNativeBuildEnvironment({
        recordPath,
        preflightPath,
        environment: {},
      }),
      /Trusted executable identity mismatch/,
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("the trusted PATH is closed and rechecks every selected tool", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-tools-test-"),
  );
  try {
    const record = fixtureRecord(temp);
    for (const identity of Object.values(record.tools).filter(
      (value) => value.sha256,
    )) {
      await fs.writeFile(identity.path, `${path.basename(identity.path)}\n`, {
        mode: 0o755,
      });
      identity.path = await fs.realpath(identity.path);
      identity.sha256 = await shaFile(identity.path);
    }
    const work = path.join(temp, "work");
    await fs.mkdir(work);
    const tools = await materializeTrustedToolDirectory(record, work);
    await verifyTrustedToolDirectory(record, tools);

    await fs.symlink(record.tools.tar.path, path.join(tools, "unbound-tool"));
    await assert.rejects(
      verifyTrustedToolDirectory(record, tools),
      /tool directory is not closed/,
    );
    await fs.rm(path.join(tools, "unbound-tool"));
    await fs.writeFile(record.tools.tar.path, "changed\n", { mode: 0o755 });
    await assert.rejects(
      verifyTrustedToolDirectory(record, tools),
      /Trusted executable identity mismatch/,
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("trusted executable bytes and explicit CMake configuration are bound", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-env-test-"),
  );
  try {
    const tool = path.join(temp, "tool");
    await fs.writeFile(tool, "approved\n", { mode: 0o755 });
    const identity = {
      path: await fs.realpath(tool),
      sha256: await shaFile(tool),
    };
    await assertTrustedExecutableIdentity(identity);
    await fs.writeFile(tool, "changed\n", { mode: 0o755 });
    await assert.rejects(
      assertTrustedExecutableIdentity(identity),
      /Trusted executable identity mismatch/,
    );
    const record = fixtureRecord(temp);
    assert.deepEqual(cmakeConfigureArguments(record), [
      "-G",
      "Unix Makefiles",
      "-DCMAKE_BUILD_TYPE=Release",
      `-DCMAKE_MAKE_PROGRAM=${temp}/make`,
      `-DCMAKE_C_COMPILER=${temp}/clang`,
      `-DCMAKE_CXX_COMPILER=${temp}/clang++`,
      `-DCMAKE_AR=${temp}/ar`,
      `-DCMAKE_RANLIB=${temp}/ranlib`,
      `-DCMAKE_LINKER=${temp}/ld`,
      `-DCMAKE_LIBTOOL=${temp}/libtool`,
      `-DCMAKE_OSX_SYSROOT=${temp}/sdk`,
      "-DCMAKE_C_FLAGS=",
      "-DCMAKE_CXX_FLAGS=",
      "-DCMAKE_EXE_LINKER_FLAGS=",
      "-DCMAKE_MODULE_LINKER_FLAGS=",
      "-DCMAKE_SHARED_LINKER_FLAGS=",
    ]);
    const environment = trustedNativeBuildEnvironment(record, temp, temp);
    assert.equal(environment.CXXFLAGS, "");
    assert.equal(environment.CMAKE_GENERATOR, "");
    assert.equal(environment.PATH, temp);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("resolved CMake selection must match the bound environment", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-cmake-test-"),
  );
  try {
    const record = fixtureRecord(temp),
      cache = (cxxFlags = "") =>
        `${Object.entries({
          CMAKE_GENERATOR: record.configuration.generator,
          CMAKE_BUILD_TYPE: record.configuration.buildType,
          CMAKE_MAKE_PROGRAM: record.tools.make.path,
          CMAKE_C_COMPILER: record.tools.cCompiler.path,
          CMAKE_CXX_COMPILER: record.tools.cxxCompiler.path,
          CMAKE_AR: record.tools.archiver.path,
          CMAKE_RANLIB: record.tools.ranlib.path,
          CMAKE_LINKER: record.tools.linker.path,
          CMAKE_LIBTOOL: record.tools.libtool.path,
          CMAKE_OSX_SYSROOT: record.tools.sdk.path,
          CMAKE_C_FLAGS: "",
          CMAKE_CXX_FLAGS: cxxFlags,
          CMAKE_EXE_LINKER_FLAGS: "",
          CMAKE_MODULE_LINKER_FLAGS: "",
          CMAKE_SHARED_LINKER_FLAGS: "",
        })
          .map(([name, value]) => `${name}:STRING=${value}`)
          .join("\n")}\n`;
    await fs.writeFile(path.join(temp, "CMakeCache.txt"), cache());
    await verifyResolvedCmakeConfiguration(record, temp);
    await fs.writeFile(path.join(temp, "CMakeCache.txt"), cache("-DUNBOUND=1"));
    await assert.rejects(
      verifyResolvedCmakeConfiguration(record, temp),
      /Resolved CMake configuration mismatch: CMAKE_CXX_FLAGS/,
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("every current package builder consumes the trusted owner", async () => {
  const assembler = await fs.readFile(
      path.join(root, "build/package-assembler.mjs"),
      "utf8",
    ),
    native = await fs.readFile(
      path.join(root, "build/profile-builders/funasr.mjs"),
      "utf8",
    ),
    python = await fs.readFile(
      path.join(root, "build/python/materialize-runtime.mjs"),
      "utf8",
    ),
    workflow = await fs.readFile(
      path.join(root, ".github/workflows/release-voice-runtime.yml"),
      "utf8",
    );
  assert.match(assembler, /assertNoUntrustedNativeBuildOverrides\(\)/);
  assert.match(assembler, /consumeTrustedNativeBuildEnvironment/);
  assert.doesNotMatch(assembler, /createTrustedNativeBuildEnvironment/);
  assert.match(assembler, /--build-environment/);
  assert.match(assembler, /materializeTrustedToolDirectory/);
  assert.match(native, /cmakeConfigureArguments\(context\.buildEnvironment\)/);
  assert.match(native, /env: nativeEnvironment/);
  assert.match(python, /context\.buildEnvironment\.tools\.tar\.path/);
  assert.doesNotMatch(python, /run\("tar"/);
  assert.match(
    workflow,
    /node build\/create-native-build-environment\.mjs[\s\S]*?for OUTPUT[\s\S]*?sandbox-exec[\s\S]*?--build-environment "\$BUILD_ENVIRONMENT"/,
  );
});

function fixtureRecord(rootPath) {
  const tool = (name) => ({
    path: `${rootPath}/${name}`,
    sha256: "a".repeat(64),
  });
  return {
    schemaVersion: 1,
    target: "darwin-arm64",
    preflightSha256: "b".repeat(64),
    tools: {
      node: tool("node"),
      cmake: tool("cmake"),
      cCompiler: tool("clang"),
      cxxCompiler: tool("clang++"),
      archiver: tool("ar"),
      ranlib: tool("ranlib"),
      linker: tool("ld"),
      libtool: tool("libtool"),
      make: tool("make"),
      shell: tool("sh"),
      tar: tool("tar"),
      sdk: {
        path: `${rootPath}/sdk`,
        version: "26.1",
        settingsSha256: "c".repeat(64),
      },
    },
    configuration: {
      generator: "Unix Makefiles",
      buildType: "Release",
      parallelism: 1,
      flagPolicy: "empty-external-native-flags-v1",
    },
    environment: {
      pathPolicy: "isolated-verified-tools-v1",
      locale: "C",
      clearedOverrides: ["CMAKE_GENERATOR", "CXXFLAGS"],
    },
  };
}
