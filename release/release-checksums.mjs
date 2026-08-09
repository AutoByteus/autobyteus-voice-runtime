#!/usr/bin/env node
import { parsePairs } from "../build/lib/files.mjs";
import { writeChecksums } from "./release-contract.mjs";

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), ["directory", "output"]);
  await writeChecksums(args.directory, args.output);
}
