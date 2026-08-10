import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readJson, ROOT } from "../build/lib/files.mjs";
import {
  CHECKSUM_COVERED_NAMES,
  PUBLISHED_ASSET_NAMES,
} from "../release/release-contract.mjs";

const schemas = [
  "contracts/build/host-build-report-v2.schema.json",
  "contracts/build/host-verification-v2.schema.json",
  "contracts/release/focused-qualification-set-v3.schema.json",
  "contracts/release/hosted-host-construction-result-v3.schema.json",
  "contracts/release/model-manifest-admission-v1.schema.json",
  "contracts/release/prepublication-seal-v1.schema.json",
  "contracts/release/pretag-release-manifest-v4.schema.json",
  "contracts/release/published-asset-verification-v2.schema.json",
  "contracts/release/publication-quarantine-result-v1.schema.json",
  "contracts/release/release-qualification-evidence-v4.schema.json",
  "contracts/release/release-source-admission-v4.schema.json",
  "contracts/release/release-admission-verification-v1.schema.json",
  "contracts/catalog/branch-catalog-projection-v3.schema.json",
  "contracts/catalog/branch-catalog-projection-verification-v3.schema.json",
  "contracts/catalog/voice-runtime-catalog-v4.schema.json",
];
for (const schemaPath of schemas) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.compile(await readJson(path.join(ROOT, schemaPath)));
}

const policy = await readJson(
  path.join(ROOT, "contracts/release/relevant-source-closure-v3.json"),
);
if (
  policy.schemaVersion !== 3 ||
  policy.policyId !== "voice-runtime-relevant-source-closure-v3" ||
  policy.defaultClassification !== "api-impact-review-required" ||
  new Set(policy.rules.map((row) => row.classification)).size !== 5
)
  throw new Error("Relevant Source Closure 3 policy is not exact.");
if (
  PUBLISHED_ASSET_NAMES.length !== 9 ||
  CHECKSUM_COVERED_NAMES.length !== 8 ||
  PUBLISHED_ASSET_NAMES.some((name) => /model\.(?:gguf|npz)$/i.test(name))
)
  throw new Error("Hosted release member contract is not exact.");

for (const obsolete of [
  ".github/workflows/recover-qualified-voice-archives.yml",
  ".github/workflows/promote-qualified-voice-candidate.yml",
  "release/recover-qualified-voice-archives.mjs",
  "release/qualified-release-candidate.mjs",
  "contracts/release/release-source-admission-v3.schema.json",
  "contracts/release/hosted-host-construction-result-v2.schema.json",
  "contracts/release/relevant-source-closure-v2.json",
  "tests/release/relevant-source-closure-v2.test.mjs",
])
  try {
    await fs.access(path.join(ROOT, obsolete));
    throw new Error(`Obsolete managed release path remains: ${obsolete}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
