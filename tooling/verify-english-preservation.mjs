#!/usr/bin/env node
import path from "node:path";
import { readJson, ROOT } from "../build/lib/files.mjs";
import { verifyEnglishPreservationAuthority } from "../benchmark/baseline/english-preservation-authority.mjs";

const catalog = await readJson(
  path.join(ROOT, "release/evidence/trusted-baselines-v1.json"),
);
const record = catalog.baselines?.find((item) => item.profileId === "english");
await verifyEnglishPreservationAuthority(record, { reproduce: true });
console.log("English preservation v2 authority reproduced byte-identically.");
