import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import syncFs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
const root = path.resolve(import.meta.dirname, "../..");
test("all public schemas compile strictly", async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const file of await schemas(path.join(root, "contracts")))
    assert.doesNotThrow(() => ajv.compile(JSON.parse(requireText(file))), file);
});

test("current matrix, model authorities, and launcher plan obey target schemas", async () => {
  for (const [schemaPath, values] of [
    [
      "contracts/catalog/current-release-matrix-v2.schema.json",
      ["contracts/catalog/current-release-matrix-v2.json"],
    ],
    [
      "contracts/model/model-admission-root-v1.schema.json",
      [
        "contracts/model/admission/english-darwin-arm64-v1.json",
        "contracts/model/admission/chinese-darwin-arm64-v1.json",
      ],
    ],
    [
      "contracts/model/model-compatibility-requirement-v1.schema.json",
      [
        "contracts/model/compatibility/english-darwin-arm64-v1.json",
        "contracts/model/compatibility/chinese-darwin-arm64-v1.json",
      ],
    ],
    [
      "contracts/model/model-asset-manifest-v1.schema.json",
      [
        "release/model-manifests/voice-model-english-whisper-small-mlx-fp16-v1.json",
        "release/model-manifests/voice-model-chinese-fun-asr-nano-gguf-q8-v1.json",
      ],
    ],
    [
      "contracts/launcher/package-launcher-plan-v2.schema.json",
      ["launcher/internal/embeddedplan/package-launcher-plan-v2.json"],
    ],
  ]) {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(
      JSON.parse(requireText(path.join(root, schemaPath))),
    );
    for (const valuePath of values) {
      const value = JSON.parse(requireText(path.join(root, valuePath)));
      assert.equal(
        validate(value),
        true,
        `${valuePath}: ${ajv.errorsText(validate.errors)}`,
      );
    }
  }
});

test("installation event variants reject cross-operation fields", async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(
    JSON.parse(
      requireText(
        path.join(
          root,
          "contracts/install/model-installation-events-v1.schema.json",
        ),
      ),
    ),
  );
  const common = {
    schemaVersion: 1,
    operationId: "00000000-0000-4000-8000-000000000001",
    operation: "status-profile",
    profileId: "english",
    target: { platform: "darwin", architecture: "arm64" },
    sequence: 1,
    phase: "status-result",
    timestamp: "2026-08-09T00:00:00Z",
    profileState: "active",
  };
  assert.equal(validate(common), true, ajv.errorsText(validate.errors));
  assert.equal(validate({ ...common, modelAssetId: "forbidden" }), false);
  assert.equal(validate({ ...common, phase: "failed" }), false);
});
async function schemas(directory) {
  let result = [];
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, item.name);
    if (item.isDirectory()) result.push(...(await schemas(target)));
    else if (item.name.endsWith(".schema.json")) result.push(target);
  }
  return result;
}
function requireText(file) {
  return (
    requireText.cache[file] ??
    (requireText.cache[file] = syncFs.readFileSync(file, "utf8"))
  );
}
requireText.cache = {};
