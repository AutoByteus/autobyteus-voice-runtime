import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readJson, ROOT } from "../build/lib/files.mjs";

const schemas = [
  "contracts/release/aggregate-api-renewal-v1.schema.json",
  "contracts/release/qualified-archive-recovery-result-v1.schema.json",
  "contracts/release/qualified-release-candidate-v1.schema.json",
  "contracts/release/candidate-promotion-record-v1.schema.json",
  "contracts/release/release-candidate-applicability-v1.schema.json",
  "contracts/release/release-qualification-evidence-v2.schema.json",
  "contracts/release/pretag-release-manifest-v2.schema.json",
  "contracts/release/published-asset-verification-v1.schema.json",
  "contracts/release/publication-quarantine-result-v1.schema.json",
];
for (const schemaPath of schemas) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.compile(await readJson(path.join(ROOT, schemaPath)));
}
const policy = await readJson(
  path.join(ROOT, "contracts/release/relevant-source-closure-v1.json"),
);
if (
  !/^[a-f0-9]{64}$/.test(policy.closures.profile.inventorySha256) ||
  !/^[a-f0-9]{64}$/.test(policy.closures.profile.treeSha256) ||
  !/^[a-f0-9]{64}$/.test(
    policy.closures.qualificationAuthority.inventorySha256,
  ) ||
  !/^[a-f0-9]{64}$/.test(policy.closures.qualificationAuthority.treeSha256)
)
  throw new Error("Relevant Source Closure policy is not finalized.");
