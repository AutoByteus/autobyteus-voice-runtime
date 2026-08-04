#!/usr/bin/env node
import { spawn } from "node:child_process";
import {
  trustedGoEnvironment,
  verifyGoToolchain,
} from "../build/locked-inputs.mjs";
import { ROOT } from "../build/lib/files.mjs";

if (!process.env.VOICE_GO)
  throw new Error("VOICE_GO must identify the repository-locked Go root.");
const toolchain = await verifyGoToolchain(process.env.VOICE_GO),
  child = spawn(toolchain.executable, ["test", "./..."], {
    cwd: ROOT,
    env: trustedGoEnvironment(toolchain),
    stdio: "inherit",
  }),
  code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (value, signal) => {
      if (signal) reject(new Error(`Go checks terminated by ${signal}.`));
      else resolve(value);
    });
  });
if (code !== 0) process.exit(code ?? 1);
