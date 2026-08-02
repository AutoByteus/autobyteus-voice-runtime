#!/usr/bin/env node
import os from "node:os";
import path from "node:path";
import {
  parsePairs,
  readJson,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import { cacheProcedureFor } from "./cache-procedure.mjs";
const args = parsePairs(process.argv.slice(2), [
  "source-commit",
  "runner-commit",
  "profile",
  "target",
  "evidence",
  "output",
]);
for (const key of ["source-commit", "runner-commit"])
  if (!/^(?!0{40})[a-f0-9]{40}$/.test(args[key]))
    throw new Error(`Invalid ${key}.`);
const evidenceRoot = path.resolve(args.evidence),
  licensePath = path.join(evidenceRoot, "license-audit-v1.json"),
  offlinePath = path.join(evidenceRoot, "offline-environment-v1.json");
const license = await readJson(licensePath),
  offline = await readJson(offlinePath);
const powerCondition = process.env.VOICE_POWER_CONDITION,
  backgroundLoad = process.env.VOICE_BACKGROUND_LOAD;
if (!powerCondition || !backgroundLoad)
  throw new Error(
    "VOICE_POWER_CONDITION and VOICE_BACKGROUND_LOAD are required.",
  );
exact(license, [
  "schemaVersion",
  "profileId",
  "target",
  "decision",
  "inventorySha256",
  "reviewer",
  "reviewedAt",
]);
exact(offline, ["schemaVersion", "target", "decision", "method", "observedAt"]);
if (
  license.schemaVersion !== 1 ||
  license.profileId !== args.profile ||
  license.target !== args.target ||
  license.decision !== "approved" ||
  !/^[a-f0-9]{64}$/.test(license.inventorySha256) ||
  offline.schemaVersion !== 1 ||
  offline.target !== args.target ||
  offline.decision !== "network-disabled"
)
  throw new Error(
    "Qualification audit is not approved for this profile/target.",
  );
await writeJson(path.resolve(args.output), {
  schemaVersion: 1,
  sourceCommit: args["source-commit"],
  runnerCommit: args["runner-commit"],
  profileId: args.profile,
  target: args.target,
  hardware: {
    hostname: os.hostname(),
    cpuModel: os.cpus()[0]?.model ?? "unknown",
    logicalCpuCount: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
  },
  operatingSystem: {
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
  },
  executionEnvironment: {
    powerCondition,
    backgroundLoad,
    filesystemCacheProcedure: await cacheProcedureFor(args.target),
  },
  licenseAudit: {
    fileName: "license-audit-v1.json",
    sha256: await shaFile(licensePath),
    decision: "approved",
  },
  offlineAudit: {
    fileName: "offline-environment-v1.json",
    sha256: await shaFile(offlinePath),
    decision: "network-disabled",
  },
});
function exact(value, keys) {
  if (!value || Object.keys(value).sort().join(",") !== keys.sort().join(","))
    throw new Error("Unknown or missing audit field.");
}
