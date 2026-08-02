#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  expectedGoVersionOutput,
  trustedGoEnvironment,
  verifyGoToolchain,
} from "./locked-inputs.mjs";
import { parsePairs } from "./lib/files.mjs";

const run = promisify(execFile),
  args = parsePairs(process.argv.slice(2), ["go"]),
  toolchain = await verifyGoToolchain(args.go),
  version = (
    await run(toolchain.executable, ["version"], {
      env: trustedGoEnvironment(toolchain),
    })
  ).stdout.trim(),
  expected = expectedGoVersionOutput(toolchain);
if (version !== expected)
  throw new Error("Verified Go root returned an unexpected version identity.");
process.stdout.write(
  `${JSON.stringify({
    schemaVersion: 1,
    version,
    host: toolchain.host,
    archive: toolchain.archive,
    rootIdentity: toolchain.rootIdentity,
  })}\n`,
);
