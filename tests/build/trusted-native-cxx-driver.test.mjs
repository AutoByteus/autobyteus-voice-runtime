import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  assertXcodeClangCxxIdentity,
  canonicalExecutablePath,
  captureXcodeClangCxxIdentity,
} from "../../build/native-tool-identities.mjs";
import { shaFile } from "../../build/lib/files.mjs";

const run = promisify(execFile);

test("the exact Xcode clang++ alias links C++ while its identical clang target does not", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-cxx-driver-test-"),
  );
  try {
    const clang = (
        await run("/usr/bin/xcrun", ["--find", "clang"])
      ).stdout.trim(),
      clangCxx = (
        await run("/usr/bin/xcrun", ["--find", "clang++"])
      ).stdout.trim(),
      sdk = (
        await run("/usr/bin/xcrun", ["--sdk", "macosx", "--show-sdk-path"])
      ).stdout.trim(),
      targetPath = await canonicalExecutablePath(clang),
      targetIdentity = {
        path: targetPath,
        sha256: await shaFile(targetPath),
      },
      identity = await captureXcodeClangCxxIdentity(clangCxx, targetIdentity),
      source = path.join(temp, "driver-proof.cc"),
      aliasOutput = path.join(temp, "alias-driver"),
      directOutput = path.join(temp, "direct-driver"),
      commonArguments = ["-isysroot", sdk, source];
    await assertXcodeClangCxxIdentity(identity, targetIdentity);
    assert.equal(identity.targetSha256, targetIdentity.sha256);
    await fs.writeFile(
      source,
      '#include <iostream>\n#include <stdexcept>\nint main(){std::runtime_error e("ready");std::cout<<e.what()<<"\\n";}\n',
    );
    await run(identity.invocationPath, [...commonArguments, "-o", aliasOutput]);
    assert.equal((await run(aliasOutput)).stdout, "ready\n");
    await assert.rejects(
      run(identity.targetPath, [...commonArguments, "-o", directOutput]),
      (error) =>
        error.code !== 0 &&
        /Undefined symbols/.test(error.stderr) &&
        /std::|__cxa|__gxx_personality/.test(error.stderr),
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("the clang++ alias rejects target, byte, topology, and directory drift", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-cxx-identity-test-"),
  );
  try {
    const bin = path.join(
        temp,
        "FixtureXcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin",
      ),
      clang = path.join(bin, "clang"),
      clangCxx = path.join(bin, "clang++"),
      bytes = '#!/bin/sh\n[ "${0##*/}" = clang++ ]\n';
    await fs.mkdir(bin, { recursive: true });
    await fs.writeFile(clang, bytes, { mode: 0o755 });
    await fs.symlink("clang", clangCxx);
    const targetIdentity = {
        path: await canonicalExecutablePath(clang),
        sha256: await shaFile(clang),
      },
      identity = await captureXcodeClangCxxIdentity(clangCxx, targetIdentity);
    await run(identity.invocationPath);
    await assert.rejects(run(identity.targetPath));

    const alternate = path.join(bin, "other");
    await fs.writeFile(alternate, bytes, { mode: 0o755 });
    await fs.rm(clangCxx);
    await fs.symlink("other", clangCxx);
    await assert.rejects(
      assertXcodeClangCxxIdentity(identity, targetIdentity),
      /clang\+\+ alias identity mismatch/,
    );

    await fs.rm(clangCxx);
    await fs.symlink("clang", clangCxx);
    await fs.writeFile(clang, "changed target\n", { mode: 0o755 });
    await assert.rejects(
      assertXcodeClangCxxIdentity(identity, targetIdentity),
      /Trusted executable identity mismatch/,
    );

    await fs.writeFile(clang, bytes, { mode: 0o755 });
    await fs.rm(clangCxx);
    await fs.writeFile(clangCxx, bytes, { mode: 0o755 });
    await assert.rejects(
      assertXcodeClangCxxIdentity(identity, targetIdentity),
      /clang\+\+ alias identity mismatch/,
    );

    const wrongBin = path.join(temp, "WrongToolchain", "bin"),
      wrongClang = path.join(wrongBin, "clang"),
      wrongCxx = path.join(wrongBin, "clang++");
    await fs.mkdir(wrongBin, { recursive: true });
    await fs.writeFile(wrongClang, bytes, { mode: 0o755 });
    await fs.symlink("clang", wrongCxx);
    const wrongTarget = {
      path: await canonicalExecutablePath(wrongClang),
      sha256: await shaFile(wrongClang),
    };
    await assert.rejects(
      captureXcodeClangCxxIdentity(wrongCxx, wrongTarget),
      /clang\+\+ alias identity mismatch/,
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});
