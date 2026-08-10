#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parsePairs, shaFile } from "../build/lib/files.mjs";
import { writeArtifact } from "./release-contract.mjs";

const exec = promisify(execFile);

export const HOSTED_TOOLCHAIN_LOCK = Object.freeze({
  runnerLabel: "macos-26",
  target: "darwin-arm64",
  xcode: Object.freeze({
    developerDirectory: "/Applications/Xcode_26.1.1.app/Contents/Developer",
    version: "Xcode 26.1.1\nBuild version 17B100",
    sdkVersion: "26.1",
    sdkSettingsSha256:
      "5129596158c8ed65953feb9f40eac98e74c8e4fcf5acb5629a0642f3f65663ff",
  }),
  cmake: Object.freeze({
    version: "4.2.0",
    sourceUrl:
      "https://github.com/Kitware/CMake/releases/download/v4.2.0/cmake-4.2.0-macos-universal.tar.gz",
    archiveFileName: "cmake-4.2.0-macos-universal.tar.gz",
    archiveSha256:
      "b8b040a06343b2b6bc090b03a9c2bb4e98037518846989fb7c40ebbf30655c5d",
    executableRelativePath:
      "cmake-4.2.0-macos-universal/CMake.app/Contents/bin/cmake",
    executableSha256:
      "d03ae0d5208459e5339a1ee62c0d0698132f9488e9c47216b0f2b8141f970fbb",
  }),
});

export function hostedCmakePath(toolsRoot) {
  return path.join(
    path.resolve(toolsRoot),
    HOSTED_TOOLCHAIN_LOCK.cmake.executableRelativePath,
  );
}

export async function provisionHostedToolchain({
  toolsRoot,
  runnerLabel,
  output,
  platform = process.platform,
  architecture = process.arch,
  system = productionSystem,
}) {
  const lock = HOSTED_TOOLCHAIN_LOCK,
    root = path.resolve(toolsRoot);
  if (
    platform !== "darwin" ||
    architecture !== "arm64" ||
    runnerLabel !== lock.runnerLabel
  )
    throw new Error("Hosted toolchain target or runner label mismatch.");
  await system.prepareEmptyDirectory(root);
  await system.assertDirectory(lock.xcode.developerDirectory);
  await system.run("/usr/bin/sudo", [
    "-n",
    "/usr/bin/xcode-select",
    "--switch",
    lock.xcode.developerDirectory,
  ]);
  const developerDirectoryRealPath = await system.realpath(
      lock.xcode.developerDirectory,
    ),
    selectedDeveloperDirectory = await system.stdout("/usr/bin/xcode-select", [
      "--print-path",
    ]),
    xcodeVersion = await system.stdout("/usr/bin/xcodebuild", ["-version"]),
    sdkVersion = await system.stdout("/usr/bin/xcrun", [
      "--sdk",
      "macosx",
      "--show-sdk-version",
    ]),
    sdkPath = await system.stdout("/usr/bin/xcrun", [
      "--sdk",
      "macosx",
      "--show-sdk-path",
    ]),
    sdkRealPath = await system.realpath(sdkPath);
  if (
    developerDirectoryRealPath !== lock.xcode.developerDirectory ||
    selectedDeveloperDirectory !== lock.xcode.developerDirectory ||
    xcodeVersion !== lock.xcode.version ||
    sdkVersion !== lock.xcode.sdkVersion ||
    !isContained(lock.xcode.developerDirectory, sdkRealPath) ||
    (await system.shaFile(path.join(sdkRealPath, "SDKSettings.json"))) !==
      lock.xcode.sdkSettingsSha256
  )
    throw new Error("Selected hosted Xcode or SDK identity mismatch.");

  const archivePath = path.join(root, lock.cmake.archiveFileName);
  await system.download(lock.cmake.sourceUrl, archivePath);
  if ((await system.shaFile(archivePath)) !== lock.cmake.archiveSha256)
    throw new Error("Hosted CMake archive identity mismatch.");
  await system.extract(archivePath, root);
  const cmakePath = hostedCmakePath(root);
  await system.assertOrdinaryExecutable(cmakePath);
  if (
    (await system.shaFile(cmakePath)) !== lock.cmake.executableSha256 ||
    (await system.stdout(cmakePath, ["--version"])).split("\n", 1)[0].trim() !==
      `cmake version ${lock.cmake.version}`
  )
    throw new Error("Provisioned hosted CMake identity mismatch.");

  const record = {
    schemaVersion: 1,
    artifactKind: "hosted-toolchain-selection",
    runnerLabel,
    target: lock.target,
    xcode: { ...lock.xcode },
    cmake: { ...lock.cmake },
    decision: "pass",
  };
  return writeArtifact(
    output,
    record,
    "contracts/release/hosted-toolchain-selection-v1.schema.json",
    "Hosted Toolchain Selection 1",
  );
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

const productionSystem = {
  async prepareEmptyDirectory(directory) {
    await fs.mkdir(directory, { recursive: true });
    if ((await fs.readdir(directory)).length)
      throw new Error("Hosted tool directory must start empty.");
  },
  async assertDirectory(target) {
    if (!(await fs.lstat(target)).isDirectory())
      throw new Error(`Expected directory: ${target}`);
  },
  async assertOrdinaryExecutable(target) {
    const info = await fs.lstat(target);
    if (!info.isFile() || info.isSymbolicLink() || !(info.mode & 0o111))
      throw new Error("Provisioned CMake is not an ordinary executable.");
  },
  realpath: fs.realpath,
  async run(file, args) {
    await exec(file, args, { encoding: "utf8" });
  },
  async stdout(file, args) {
    return (await exec(file, args, { encoding: "utf8" })).stdout.trim();
  },
  shaFile,
  async download(url, destination) {
    await exec(
      "/usr/bin/curl",
      [
        "--fail",
        "--location",
        "--proto",
        "=https",
        "--tlsv1.2",
        "--output",
        destination,
        url,
      ],
      { encoding: "utf8" },
    );
  },
  async extract(archive, destination) {
    await exec("/usr/bin/tar", ["-xzf", archive, "-C", destination], {
      encoding: "utf8",
    });
  },
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "tools-root",
    "runner-label",
    "output",
  ]);
  await provisionHostedToolchain({
    toolsRoot: args["tools-root"],
    runnerLabel: args["runner-label"],
    output: args.output,
  });
  process.stdout.write(`${hostedCmakePath(args["tools-root"])}\n`);
}
