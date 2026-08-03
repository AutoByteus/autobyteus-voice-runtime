import fs from "node:fs/promises";
import path from "node:path";
import { shaFile } from "../../build/lib/files.mjs";
import { locked } from "../../build/locked-inputs.mjs";
import {
  capturePinnedSudoIdentity,
  systemCommandIdentityDigest,
} from "../../benchmark/system-command-identity.mjs";

const root = path.resolve(import.meta.dirname, "../..");

export async function passingDarwinPreflightFixture(rootPath, toolPath) {
  const tool = {
      path: await fs.realpath(toolPath),
      sha256: await shaFile(toolPath),
    },
    sdkPath = path.join(rootPath, "sdk"),
    sdkSettings = path.join(sdkPath, "SDKSettings.json"),
    commandNames = [
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
      "/usr/bin/tar",
      "/bin/sh",
    ];
  await fs.mkdir(sdkPath, { recursive: true });
  await fs.writeFile(sdkSettings, "{}\n");
  const commandPaths = {};
  for (const name of commandNames) {
    const resolved = await fs.realpath(name);
    commandPaths[name] = { path: resolved, sha256: await shaFile(resolved) };
  }
  const sudoExecutable = await capturePinnedSudoIdentity(),
    go = locked.goToolchain.archives["darwin-arm64"],
    sandbox = path.join(
      root,
      "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
    );
  return {
    schemaVersion: 2,
    target: "darwin-arm64",
    status: "pass",
    checkedAt: "2026-08-03T00:00:00.000Z",
    host: {
      platform: "darwin",
      architecture: "arm64",
      cpuModel: "Apple M1 Max",
      totalMemoryBytes: 68719476736,
    },
    power: {
      acConnected: true,
      lowPowerModeOff: true,
      caffeinateActive: true,
      thermalNormal: true,
      memoryPressureNormal: true,
    },
    performanceEnvironment: {
      classification: "controlled",
      cpuIdleSamples: [90, 90, 90, 90, 90, 90],
      averageIdlePercent: 90,
      taskOwnedCompetingProcesses: { detected: false, processNames: [] },
      topConsumerProcessNames: [],
    },
    tools: {
      node: "v22.23.1",
      nodeExecutable: {
        path: await fs.realpath(process.execPath),
        sha256: await shaFile(process.execPath),
      },
      goArchiveSha256: go.sha256,
      goRootTreeSha256: go.rootTreeSha256,
      cmake: "cmake version 4.3.3",
      cmakeExecutable: tool,
      appleClang: "Apple clang version 17.0.0 (clang-1700.4.4.1)",
      appleClangExecutable: tool,
      appleClangCxxExecutable: tool,
      appleArExecutable: tool,
      appleRanlibExecutable: tool,
      appleLinkerExecutable: tool,
      appleLibtoolExecutable: tool,
      xcode: "Xcode 26.1.1\nBuild version 17B100",
      sdk: "26.1",
      sdkPath,
      sdkSettingsSha256: await shaFile(sdkSettings),
      sudoExecutable,
      commandPaths,
    },
    sandbox: {
      profile: "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
      profileSha256: await shaFile(sandbox),
      networkDenied: true,
      localOperationsAllowed: true,
    },
    purge: {
      command: "/usr/bin/sudo -n /usr/sbin/purge",
      nonInteractivePass: true,
      sudoExecutableIdentitySha256: systemCommandIdentityDigest(sudoExecutable),
    },
    failureCategory: null,
  };
}
