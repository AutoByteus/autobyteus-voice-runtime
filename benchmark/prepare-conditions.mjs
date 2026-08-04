#!/usr/bin/env node
import path from "node:path";
import {
  parsePairs,
  readJson,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import { cacheProcedureFor } from "./cache-procedure.mjs";
import { assertPassingDarwinArm64Preflight } from "./darwin-arm64-preflight-contract.mjs";

const args = parsePairs(process.argv.slice(2), [
  "source-commit",
  "runner-commit",
  "profile",
  "target",
  "preflight",
  "output",
]);
for (const key of ["source-commit", "runner-commit"])
  if (!/^(?!0{40})[a-f0-9]{40}$/.test(args[key]))
    throw new Error(`Invalid ${key}.`);
if (
  args["source-commit"] !== args["runner-commit"] ||
  !["english", "chinese"].includes(args.profile) ||
  args.target !== "darwin-arm64"
)
  throw new Error("Current qualification identity is not approved.");
const preflightPath = path.resolve(args.preflight),
  preflight = await readJson(preflightPath);
await assertPassingDarwinArm64Preflight(preflight);
await writeJson(path.resolve(args.output), {
  schemaVersion: 1,
  sourceCommit: args["source-commit"],
  runnerCommit: args["runner-commit"],
  profileId: args.profile,
  target: args.target,
  preflight: {
    fileName: path.basename(preflightPath),
    sha256: await shaFile(preflightPath),
    status: "pass",
  },
  hardware: preflight.host,
  operatingEnvironment: {
    power: preflight.power,
    performanceEnvironment: preflight.performanceEnvironment,
    tools: preflight.tools,
  },
  executionEnvironment: {
    sandbox: preflight.sandbox,
    filesystemCacheProcedure: await cacheProcedureFor(args.target),
  },
});
