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
  assertXcodeRanlibIdentity,
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
    assert.match(record.tools.ranlib.invocationPath, /\/ranlib$/);
    assert.equal(record.tools.ranlib.targetPath, record.tools.libtool.path);
    assert.equal(record.tools.tar.path, await fs.realpath("/usr/bin/tar"));
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("the Xcode ranlib alias retains invocation semantics and authenticated topology", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-ranlib-alias-test-"),
  );
  try {
    const cmake = path.join(temp, "cmake");
    await fs.writeFile(cmake, "fixture\n", { mode: 0o755 });
    const preflight = await passingDarwinPreflightFixture(temp, cmake),
      identity = preflight.tools.appleRanlibExecutable,
      libtool = preflight.tools.appleLibtoolExecutable,
      originalBytes = await fs.readFile(libtool.path);
    await assertXcodeRanlibIdentity(identity, libtool);
    await run(identity.invocationPath, []);
    await assert.rejects(run(identity.targetPath, []));
    const record = fixtureRecord(temp);
    record.tools.ranlib = identity;
    record.tools.libtool = libtool;
    assert.ok(
      cmakeConfigureArguments(record).includes(
        `-DCMAKE_RANLIB=${identity.invocationPath}`,
      ),
    );

    const alternate = path.join(path.dirname(identity.targetPath), "other");
    await fs.writeFile(alternate, originalBytes, { mode: 0o755 });
    await fs.rm(identity.invocationPath);
    await fs.symlink(path.basename(alternate), identity.invocationPath);
    await assert.rejects(
      assertXcodeRanlibIdentity(identity, libtool),
      /alias identity mismatch/,
    );

    await fs.rm(identity.invocationPath);
    await fs.symlink(identity.linkTarget, identity.invocationPath);
    await fs.writeFile(identity.targetPath, "changed target\n", {
      mode: 0o755,
    });
    await assert.rejects(
      assertXcodeRanlibIdentity(identity, libtool),
      /Trusted executable identity mismatch/,
    );

    await fs.writeFile(identity.targetPath, originalBytes, { mode: 0o755 });
    await fs.rm(identity.invocationPath);
    await fs.writeFile(identity.invocationPath, originalBytes, { mode: 0o755 });
    await assert.rejects(
      assertXcodeRanlibIdentity(identity, libtool),
      /alias identity mismatch/,
    );
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
      await fs.mkdir(path.dirname(identity.path), { recursive: true });
      await fs.writeFile(identity.path, `${path.basename(identity.path)}\n`, {
        mode: 0o755,
      });
      identity.path = await fs.realpath(identity.path);
      identity.sha256 = await shaFile(identity.path);
    }
    record.tools.ranlib.invocationPath = path.join(
      path.dirname(record.tools.libtool.path),
      "ranlib",
    );
    record.tools.ranlib.targetPath = record.tools.libtool.path;
    record.tools.ranlib.targetSha256 = record.tools.libtool.sha256;
    await fs.symlink(
      record.tools.ranlib.linkTarget,
      record.tools.ranlib.invocationPath,
    );
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
      `-DCMAKE_MAKE_PROGRAM=${record.tools.make.path}`,
      `-DCMAKE_C_COMPILER=${record.tools.cCompiler.path}`,
      `-DCMAKE_CXX_COMPILER=${record.tools.cxxCompiler.path}`,
      `-DCMAKE_AR=${record.tools.archiver.path}`,
      `-DCMAKE_RANLIB=${record.tools.ranlib.invocationPath}`,
      `-DCMAKE_LINKER=${record.tools.linker.path}`,
      `-DCMAKE_LIBTOOL=${record.tools.libtool.path}`,
      `-DCMAKE_OSX_SYSROOT=${record.tools.sdk.path}`,
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
      cache = ({
        cxxFlags = "",
        ranlib = record.tools.ranlib.invocationPath,
      } = {}) =>
        `${Object.entries({
          CMAKE_GENERATOR: record.configuration.generator,
          CMAKE_BUILD_TYPE: record.configuration.buildType,
          CMAKE_MAKE_PROGRAM: record.tools.make.path,
          CMAKE_C_COMPILER: record.tools.cCompiler.path,
          CMAKE_CXX_COMPILER: record.tools.cxxCompiler.path,
          CMAKE_AR: record.tools.archiver.path,
          CMAKE_RANLIB: ranlib,
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
    await fs.writeFile(
      path.join(temp, "CMakeCache.txt"),
      cache({ cxxFlags: "-DUNBOUND=1" }),
    );
    await assert.rejects(
      verifyResolvedCmakeConfiguration(record, temp),
      /Resolved CMake configuration mismatch: CMAKE_CXX_FLAGS/,
    );
    await fs.writeFile(
      path.join(temp, "CMakeCache.txt"),
      cache({ ranlib: record.tools.ranlib.targetPath }),
    );
    await assert.rejects(
      verifyResolvedCmakeConfiguration(record, temp),
      /Resolved CMake configuration mismatch: CMAKE_RANLIB/,
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
    path: path.isAbsolute(name) ? name : `${rootPath}/${name}`,
    sha256: "a".repeat(64),
  });
  const xcodeBin = path.join(
      rootPath,
      "FixtureXcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin",
    ),
    libtool = tool(path.join(xcodeBin, "libtool"));
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
      ranlib: {
        invocationPath: path.join(xcodeBin, "ranlib"),
        linkTarget: "libtool",
        targetPath: libtool.path,
        targetSha256: libtool.sha256,
      },
      linker: tool("ld"),
      libtool,
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
