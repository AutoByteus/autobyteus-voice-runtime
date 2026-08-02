#!/usr/bin/env node
import path from "node:path";
import { parsePairs, readJson, ROOT } from "../lib/files.mjs";
import {
  prepare,
  copyPackageNotices,
  copyPythonProvider,
  verifyPythonRuntimePolicy,
  writeEngineConfiguration,
} from "./common.mjs";
const args = parsePairs(process.argv.slice(2), ["target", "inputs", "stage"]);
const context = await prepare(args, "english-faster-whisper");
const resolution = await readJson(
  path.join(ROOT, context.lock.wheelResolutionEvidence, `${args.target}.json`),
);
if (!Array.isArray(resolution.install) || resolution.install.length === 0)
  throw new Error("Invalid faster-whisper resolution evidence.");
await verifyPythonRuntimePolicy(
  context,
  resolution.install.map((item) => ({
    name: item.metadata?.name,
    version: item.metadata?.version,
  })),
);
await copyPythonProvider(context, "english-faster-whisper");
await copyPackageNotices(context);
await writeEngineConfiguration(context, {
  kind: "faster-whisper",
  version: context.lock.engine.version,
  computeType: "int8",
  beamSize: 5,
  cpuThreads: 4,
  conditionOnPreviousText: false,
  localFilesOnly: true,
});
