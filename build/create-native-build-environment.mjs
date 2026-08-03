#!/usr/bin/env node
import path from "node:path";
import { parsePairs, writeJson } from "./lib/files.mjs";
import { createTrustedNativeBuildEnvironment } from "./trusted-native-environment.mjs";

const args = parsePairs(process.argv.slice(2), [
    "preflight",
    "cmake",
    "output",
  ]),
  record = await createTrustedNativeBuildEnvironment({
    preflightPath: args.preflight,
    cmakePath: args.cmake,
  });
await writeJson(path.resolve(args.output), record);
