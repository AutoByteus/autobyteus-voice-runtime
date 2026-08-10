#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parsePairs, shaFile, ROOT } from "../lib/files.mjs";
import {
  prepareHost,
  copyHostNotices,
  writeEngineConfiguration,
} from "./host-common.mjs";
import { trustedHostBuildEnvironment } from "../host-build-environment.mjs";
import {
  cmakeConfigureArguments,
  verifyResolvedCmakeConfiguration,
} from "../resolved-cmake-configuration.mjs";
const run = promisify(execFile);
const args = parsePairs(process.argv.slice(2), [
  "target",
  "inputs",
  "stage",
  "build-environment",
  "trusted-tools",
]);
const context = await prepareHost(args, "chinese-funasr");
for (const [directory, commit] of [
  ["funasr-source", context.lock.engine.funAsrCommit],
  ["llama-cpp-source", context.lock.engine.llamaCppCommit],
  ["utf8proc-source", context.lock.engine.utf8procCommit],
])
  assertMaterializedGitSource(context, directory, commit);
const build = path.join(path.dirname(context.stage), "native-build");
await fs.mkdir(build, { recursive: false, mode: 0o700 });
const nativeEnvironment = trustedHostBuildEnvironment(
  context.buildEnvironment,
  build,
  context.trustedTools,
);
await run(
  context.buildEnvironment.tools.cmake.path,
  [
    "-S",
    path.join(context.inputs, "runtime-source/providers/chinese-funasr"),
    "-B",
    build,
    ...cmakeConfigureArguments(context.buildEnvironment),
    `-DLLAMA_CPP_SOURCE_DIR=${path.join(context.inputs, "llama-cpp-source")}`,
    `-DUTF8PROC_SOURCE_DIR=${path.join(context.inputs, "utf8proc-source")}`,
  ],
  { env: nativeEnvironment, maxBuffer: 16 * 1024 * 1024 },
);
await verifyResolvedCmakeConfiguration(context.buildEnvironment, build);
await run(
  context.buildEnvironment.tools.cmake.path,
  [
    "--build",
    build,
    "--config",
    "Release",
    "--target",
    "voice-provider-worker",
    "--parallel",
    String(context.buildEnvironment.configuration.parallelism),
  ],
  { env: nativeEnvironment, maxBuffer: 16 * 1024 * 1024 },
);
const executable =
  context.target.platform === "win32"
    ? "voice-provider-worker.exe"
    : "voice-provider-worker";
const candidates = [
  path.join(build, executable),
  path.join(build, "Release", executable),
];
let binary;
for (const item of candidates)
  try {
    if ((await fs.stat(item)).isFile()) binary = item;
  } catch {}
if (!binary) throw new Error("Native worker output missing.");
const binaryBytes = await fs.readFile(binary);
for (const forbidden of [ROOT, context.inputs, build, os.homedir()])
  for (const encoded of [
    Buffer.from(forbidden),
    Buffer.from(forbidden, "utf16le"),
  ])
    if (binaryBytes.includes(encoded))
      throw new Error("Native worker contains a source/build/user-home path.");
await fs.mkdir(path.join(context.stage, "provider"), { recursive: true });
await fs.copyFile(binary, path.join(context.stage, "provider", executable));
await fs.chmod(path.join(context.stage, "provider", executable), 0o755);
await fs.mkdir(path.join(context.stage, "normalizer"), { recursive: true });
const normalizerSource = path.join(
  context.inputs,
  "runtime-source/contracts/normalization/twp-to-cn-v1.json",
);
if ((await shaFile(normalizerSource)) !== context.lock.normalizer.mappingSha256)
  throw new Error("Pinned normalization mapping identity mismatch.");
await fs.copyFile(
  normalizerSource,
  path.join(context.stage, "normalizer/t2s-mapping-v1.json"),
);
await copyHostNotices(context);
await writeEngineConfiguration(context, {
  kind: "funasr-native",
  version: context.lock.engine.funAsrCommit,
  llamaCppCommit: context.lock.engine.llamaCppCommit,
  utf8procCommit: context.lock.engine.utf8procCommit,
  language: "zh",
  contextTerms: false,
});

function assertMaterializedGitSource(context, directory, commit) {
  const observed = context.inputProvenance.inputs.find(
      (item) => item.kind === "git-checkout" && item.destination === directory,
    ),
    expected = context.inputRecipe.inputs.find(
      (item) => item.kind === "git-checkout" && item.destination === directory,
    );
  if (
    !observed ||
    !expected ||
    expected.revision !== commit ||
    observed.identity !== expected.treeId
  )
    throw new Error(`${directory} materialized source identity mismatch.`);
}
