#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import { parsePairs, shaFile } from "../lib/files.mjs";
import {
  prepare,
  copyPackageNotices,
  copyPythonProvider,
  verifyPythonRuntimePolicy,
  writeEngineConfiguration,
} from "./common.mjs";
const args = parsePairs(process.argv.slice(2), [
  "target",
  "inputs",
  "stage",
  "build-environment",
  "trusted-tools",
]);
const context = await prepare(args, "english-mlx");
if (args.target !== "darwin-arm64")
  throw new Error("MLX is authorized only for darwin-arm64.");
if (
  (await shaFile(path.join(context.inputs, "python-dependencies.lock"))) !==
  context.lock.pythonDependencyLock.sha256
)
  throw new Error("MLX dependency lock mismatch.");
const distributions = (
  await fs.readFile(
    path.join(context.inputs, "python-dependencies.lock"),
    "utf8",
  )
)
  .trim()
  .split(/\r?\n/)
  .map((line) => {
    const separator = line.indexOf("==");
    if (separator < 1 || separator === line.length - 2)
      throw new Error("Invalid MLX dependency lock entry.");
    return {
      name: line.slice(0, separator),
      version: line.slice(separator + 2),
    };
  });
await verifyPythonRuntimePolicy(context, distributions);
await copyPythonProvider(context, "english-mlx");
await copyPackageNotices(context);
await writeEngineConfiguration(context, {
  kind: "mlx-whisper",
  version: context.lock.engine.version,
  modelPath: "model",
  language: "en",
  temperature: 0,
  conditionOnPreviousText: false,
});
