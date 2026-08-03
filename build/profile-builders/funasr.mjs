#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parsePairs, shaFile, ROOT } from "../lib/files.mjs";
import {
  prepare,
  assertInputClosure,
  copyPackageNotices,
  writeEngineConfiguration,
} from "./common.mjs";
const run = promisify(execFile);
const args = parsePairs(process.argv.slice(2), [
  "target",
  "inputs",
  "stage",
  "cmake",
]);
const context = await prepare(args, "chinese-funasr");
assertInputClosure(context, [
  "funasr-source/",
  "llama-cpp-source/",
  "utf8proc-source/",
  "model/",
  "package-notices/",
  "runtime-source/",
]);
for (const [directory, commit] of [
  ["funasr-source", context.lock.engine.funAsrCommit],
  ["llama-cpp-source", context.lock.engine.llamaCppCommit],
  ["utf8proc-source", context.lock.engine.utf8procCommit],
])
  assertMaterializedGitSource(context, directory, commit);
for (const model of context.lock.model.files) {
  const file = path.join(context.inputs, "model", model.name),
    info = await fs.stat(file);
  if (
    !info.isFile() ||
    info.size !== model.sizeBytes ||
    (await shaFile(file)) !== model.sha256
  )
    throw new Error(`Fun-ASR model identity mismatch: ${model.name}`);
}
const build = path.join(path.dirname(context.stage), "native-build");
await run(
  path.resolve(args.cmake),
  [
    "-S",
    path.join(context.inputs, "runtime-source/providers/chinese-funasr"),
    "-B",
    build,
    `-DLLAMA_CPP_SOURCE_DIR=${path.join(context.inputs, "llama-cpp-source")}`,
    `-DUTF8PROC_SOURCE_DIR=${path.join(context.inputs, "utf8proc-source")}`,
    "-DCMAKE_BUILD_TYPE=Release",
  ],
  { maxBuffer: 16 * 1024 * 1024 },
);
await run(
  path.resolve(args.cmake),
  [
    "--build",
    build,
    "--config",
    "Release",
    "--target",
    "voice-provider-worker",
  ],
  { maxBuffer: 16 * 1024 * 1024 },
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
const modelStage = path.join(context.stage, "model");
await fs.mkdir(modelStage, { recursive: true });
for (const file of context.lock.model.files)
  await fs.copyFile(
    path.join(context.inputs, "model", file.name),
    path.join(modelStage, file.name),
  );
await fs.writeFile(
  path.join(modelStage, "model-descriptor-v1.json"),
  `${JSON.stringify({
    schemaVersion: 1,
    id: context.lock.model.id,
    family: context.lock.model.family,
    size: context.lock.model.size,
    precision: context.lock.model.precision,
    source: context.lock.model.source,
    revision: context.lock.model.revision,
    files: context.lock.model.files,
  })}\n`,
);
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
await copyPackageNotices(context);
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
