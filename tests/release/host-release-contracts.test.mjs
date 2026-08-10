import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  finalizeHostedReleaseAudit,
  HOSTED_RELEASE_PHASES,
  initializeHostedReleaseAudit,
} from "../../release/hosted-release-audit.mjs";
import {
  HOSTED_TOOLCHAIN_LOCK,
  provisionHostedToolchain,
} from "../../release/hosted-toolchain.mjs";
import {
  CHECKSUM_COVERED_NAMES,
  PUBLISHED_ASSET_NAMES,
} from "../../release/release-contract.mjs";

const root = path.resolve(import.meta.dirname, "../..");

test("the release contract contains exactly two hosts, two locators, four metadata assets, and checksums", () => {
  assert.deepEqual(PUBLISHED_ASSET_NAMES, [
    "THIRD_PARTY_NOTICES.json",
    "pretag-release-manifest-v4.json",
    "release-SHA256SUMS.txt",
    "release-qualification-evidence-v4.json",
    "voice-host-chinese-darwin-arm64-1.0.0.zip",
    "voice-host-english-darwin-arm64-1.0.0.zip",
    "voice-model-chinese-fun-asr-nano-gguf-q8-v1.json",
    "voice-model-english-whisper-small-mlx-fp16-v1.json",
    "voice-runtime-catalog-v4.json",
  ]);
  assert.equal(CHECKSUM_COVERED_NAMES.length, 8);
  assert.ok(!CHECKSUM_COVERED_NAMES.includes("release-SHA256SUMS.txt"));
  assert.ok(
    PUBLISHED_ASSET_NAMES.every(
      (name) => !/\.(?:gguf|npz|safetensors)$/.test(name),
    ),
  );
});

test("one standard-hosted job builds hosts without model or product execution", async () => {
  const workflow = await fs.readFile(
    path.join(root, ".github/workflows/release-voice-runtime.yml"),
    "utf8",
  );
  assert.match(workflow, /jobs:\n  release:\n    runs-on: macos-26/);
  assert.doesNotMatch(workflow, /self-hosted|runner-group|larger runner/i);
  assert.match(workflow, /release\/run-host-construction\.mjs/);
  assert.match(
    workflow,
    /sandbox-exec -f benchmark\/sandbox\/darwin-arm64-network-denied-v1\.sb[\s\S]+release\/run-host-construction\.mjs/,
  );
  assert.match(workflow, /hosted-host-construction-result-v3\.json/);
  assert.match(workflow, /release\/verify-release-source-admission\.mjs/);
  assert.match(
    workflow,
    /--workflow-checkout-commit "\$GITHUB_SHA" --mode lineage/,
  );
  assert.match(workflow, /release-admission-verification-v1\.json/);
  assert.match(
    workflow,
    /release\/admission\/v1\.0\.0-release-source-admission-v4\.json/,
  );
  assert.doesNotMatch(
    workflow,
    /release-source-admission-v3|final-main-commit[^\n]+run-host/,
  );
  assert.doesNotMatch(workflow, /promote-release-authority/);
  assert.match(workflow, /release\/prepublication-seal\.mjs/);
  assert.match(workflow, /release\/verify-published-assets\.mjs/);
  assert.match(workflow, /release\/quarantine-published-release\.mjs/);
  assert.doesNotMatch(
    workflow,
    /recover-qualified|qualified-release-candidate|run-profile-qualification|qualify:profile|caffeinate|\/usr\/sbin\/purge/,
  );
  assert.doesNotMatch(workflow, /huggingface\.co|weights\.npz|\.gguf/);
  assert.match(workflow, /test "\$\{#FILES\[@\]\}" = 9/);
});

test("the hosted workflow selects the exact reviewed toolchain before hydration and always retains an initialized audit", async () => {
  const workflow = await fs.readFile(
      path.join(root, ".github/workflows/release-voice-runtime.yml"),
      "utf8",
    ),
    toolSelection = workflow.indexOf(
      "Select exact hosted Xcode SDK and CMake toolchain",
    ),
    hydration = workflow.indexOf(
      "Capture hosted authority and hydrate host-only inputs",
    );
  assert.ok(toolSelection > 0 && hydration > toolSelection);
  assert.match(
    workflow,
    /CMAKE="\$\(node release\/hosted-toolchain\.mjs --tools-root "\$ROOT\/tools"/,
  );
  assert.match(workflow, /printf 'cmake=%s\\n' "\$CMAKE" >> "\$GITHUB_OUTPUT"/);
  assert.match(
    workflow,
    /CMAKE="\$\{\{ steps\.hosted_toolchain\.outputs\.cmake \}\}"/,
  );
  assert.doesNotMatch(workflow, /CMAKE="\$ROOT\/tools\/cmake-/);
  assert.doesNotMatch(workflow, /--cmake "\$\(command -v cmake\)"/);
  assert.ok(
    workflow.indexOf("Initialize truthful hosted release audit") <
      workflow.indexOf("Select exact Node runtime"),
  );
  assert.match(
    workflow,
    /Finalize truthful hosted release audit[\s\S]+if: always\(\) && steps\.audit_init\.outcome == 'success'/,
  );
  assert.match(
    workflow,
    /Finalize truthful hosted release audit[\s\S]+Retain release audit[\s\S]+if-no-files-found: error/,
  );
});

test("the hosted toolchain owner selects and authenticates the exact Xcode SDK and CMake identities", async () => {
  const temporary = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-hosted-toolchain-test-"),
    ),
    output = path.join(temporary, "selection.json"),
    events = [],
    sdkPath = path.join(
      HOSTED_TOOLCHAIN_LOCK.xcode.developerDirectory,
      "Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk",
    ),
    system = {
      async prepareEmptyDirectory(directory) {
        events.push(["prepare", directory]);
      },
      async assertDirectory(directory) {
        events.push(["xcode-directory", directory]);
      },
      async realpath(target) {
        return target;
      },
      async run(file, args) {
        events.push(["run", file, ...args]);
      },
      async stdout(file, args) {
        events.push(["stdout", file, ...args]);
        if (file === "/usr/bin/xcode-select")
          return HOSTED_TOOLCHAIN_LOCK.xcode.developerDirectory;
        if (file === "/usr/bin/xcodebuild")
          return HOSTED_TOOLCHAIN_LOCK.xcode.version;
        if (file === "/usr/bin/xcrun" && args.includes("--show-sdk-version"))
          return HOSTED_TOOLCHAIN_LOCK.xcode.sdkVersion;
        if (file === "/usr/bin/xcrun" && args.includes("--show-sdk-path"))
          return sdkPath;
        return `cmake version ${HOSTED_TOOLCHAIN_LOCK.cmake.version}\n`;
      },
      async shaFile(file) {
        if (file.endsWith("SDKSettings.json"))
          return HOSTED_TOOLCHAIN_LOCK.xcode.sdkSettingsSha256;
        if (file.endsWith(".tar.gz"))
          return HOSTED_TOOLCHAIN_LOCK.cmake.archiveSha256;
        return HOSTED_TOOLCHAIN_LOCK.cmake.executableSha256;
      },
      async download(url, destination) {
        events.push(["download", url, destination]);
      },
      async extract(archive, destination) {
        events.push(["extract", archive, destination]);
      },
      async assertOrdinaryExecutable(executable) {
        events.push(["ordinary-executable", executable]);
      },
    };
  try {
    const record = await provisionHostedToolchain({
      toolsRoot: path.join(temporary, "tools"),
      runnerLabel: "macos-26",
      output,
      platform: "darwin",
      architecture: "arm64",
      system,
    });
    assert.deepEqual(record, JSON.parse(await fs.readFile(output, "utf8")));
    assert.equal(record.decision, "pass");
    assert.equal(
      record.cmake.archiveSha256,
      "b8b040a06343b2b6bc090b03a9c2bb4e98037518846989fb7c40ebbf30655c5d",
    );
    assert.deepEqual(events[2], [
      "run",
      "/usr/bin/sudo",
      "-n",
      "/usr/bin/xcode-select",
      "--switch",
      "/Applications/Xcode_26.1.1.app/Contents/Developer",
    ]);
    assert.ok(events.some(([kind]) => kind === "download"));
    assert.ok(events.some(([kind]) => kind === "ordinary-executable"));
    await assert.rejects(
      provisionHostedToolchain({
        toolsRoot: path.join(temporary, "wrong-runner"),
        runnerLabel: "macos-latest",
        output: path.join(temporary, "wrong-runner.json"),
        platform: "darwin",
        architecture: "arm64",
        system,
      }),
      /target or runner label mismatch/,
    );
    await assert.rejects(
      provisionHostedToolchain({
        toolsRoot: path.join(temporary, "wrong-cmake"),
        runnerLabel: "macos-26",
        output: path.join(temporary, "wrong-cmake.json"),
        platform: "darwin",
        architecture: "arm64",
        system: {
          ...system,
          async shaFile(file) {
            if (file.endsWith(".tar.gz")) return "0".repeat(64);
            return system.shaFile(file);
          },
        },
      }),
      /CMake archive identity mismatch/,
    );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("an early hosted-toolchain failure retains a truthful terminal audit and leaves later work unattempted", async () => {
  const temporary = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-hosted-audit-test-"),
    ),
    audit = path.join(temporary, "hosted-release-audit-v1.json"),
    outcomes = Object.fromEntries(
      HOSTED_RELEASE_PHASES.map((phase) => [phase, "skipped"]),
    );
  outcomes.checkout = "success";
  outcomes["setup-node"] = "success";
  outcomes["setup-go"] = "success";
  outcomes["source-admission"] = "success";
  outcomes["hosted-toolchain"] = "failure";
  try {
    const initialized = await initializeHostedReleaseAudit({
      output: audit,
      repository: "AutoByteus/autobyteus-voice-runtime",
      workflowRunId: "31420271551",
      workflowRunAttempt: "1",
      workflowCheckoutCommit: "7".repeat(40),
      runnerLabel: "macos-26",
      releaseTag: "v1.0.0",
      runtimeVersion: "1.0.0",
    });
    assert.equal(initialized.decision, "in-progress");
    assert.equal(initialized.phases[0].outcome, "succeeded");
    const final = await finalizeHostedReleaseAudit({
      input: audit,
      output: audit,
      outcomes,
    });
    assert.equal(final.decision, "fail");
    assert.equal(final.failureCategory, "hosted-toolchain-failed");
    assert.equal(
      final.phases.find(({ phase }) => phase === "input-hydration").outcome,
      "unattempted",
    );
    assert.deepEqual(final, JSON.parse(await fs.readFile(audit, "utf8")));

    const passingAudit = path.join(temporary, "passing-audit.json"),
      passingOutcomes = Object.fromEntries(
        HOSTED_RELEASE_PHASES.map((phase) => [phase, "success"]),
      );
    passingOutcomes.quarantine = "skipped";
    await initializeHostedReleaseAudit({
      output: passingAudit,
      repository: "AutoByteus/autobyteus-voice-runtime",
      workflowRunId: "31420271552",
      workflowRunAttempt: "1",
      workflowCheckoutCommit: "8".repeat(40),
      runnerLabel: "macos-26",
      releaseTag: "v1.0.0",
      runtimeVersion: "1.0.0",
    });
    const passing = await finalizeHostedReleaseAudit({
      input: passingAudit,
      output: passingAudit,
      outcomes: passingOutcomes,
    });
    assert.equal(passing.decision, "pass");
    assert.equal(passing.failureCategory, null);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("managed recovery and combined-package entrypoints are absent", async () => {
  for (const relative of [
    ".github/workflows/recover-qualified-voice-archives.yml",
    ".github/workflows/promote-qualified-voice-candidate.yml",
    "build/package-assembler.mjs",
    "build/package-verifier.mjs",
    "release/recover-qualified-voice-archives.mjs",
    "release/qualified-release-candidate.mjs",
    "contracts/package/provider-package-v1.schema.json",
    "contracts/startup/provider-session-config-v1.schema.json",
    "contracts/release/release-source-admission-v3.schema.json",
    "contracts/release/hosted-host-construction-result-v2.schema.json",
  ])
    await assert.rejects(fs.access(path.join(root, relative)), {
      code: "ENOENT",
    });
});
