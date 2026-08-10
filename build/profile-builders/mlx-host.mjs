#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parsePairs, shaFile } from "../lib/files.mjs";
import {
  prepareHost,
  copyHostNotices,
  copyPythonHost,
  verifyPythonRuntimePolicy,
  writeEngineConfiguration,
} from "./host-common.mjs";
const args = parsePairs(process.argv.slice(2), [
    "target",
    "inputs",
    "stage",
    "build-environment",
    "trusted-tools",
  ]),
  context = await prepareHost(args, "english-mlx");
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
    const split = line.indexOf("==");
    if (split < 1) throw new Error("Invalid dependency lock.");
    return { name: line.slice(0, split), version: line.slice(split + 2) };
  });
await verifyPythonRuntimePolicy(context, distributions);
await copyPythonHost(context, "english-mlx");
await copyHostNotices(context);
await writeEngineConfiguration(context, {
  kind: "mlx-whisper",
  version: context.lock.engine.version,
  language: "en",
  temperature: 0,
  conditionOnPreviousText: false,
});
