import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import syncFs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
const root = path.resolve(import.meta.dirname, "../..");
const groups = [
  ["launcher", "package-launcher-plan-v1.schema.json"],
  ["startup", "provider-session-config-v1.schema.json"],
  ["protocol", "voice-input-protocol-v1.schema.json"],
];
for (const [directory, schemaName] of groups)
  test(`${directory} fixtures obey exact schema`, async () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const schema = JSON.parse(
      await fs.readFile(path.join(root, "contracts", directory, schemaName)),
    );
    const validate = ajv.compile(schema);
    for (const kind of ["valid", "invalid"])
      for (const name of await fs.readdir(
        path.join(root, "contracts", directory, "fixtures", kind),
      )) {
        const value = JSON.parse(
          await fs.readFile(
            path.join(root, "contracts", directory, "fixtures", kind, name),
          ),
        );
        assert.equal(
          validate(value),
          kind === "valid",
          `${kind}/${name}: ${ajv.errorsText(validate.errors)}`,
        );
      }
  });
test("all public schemas compile strictly", async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const file of await schemas(path.join(root, "contracts")))
    assert.doesNotThrow(() => ajv.compile(JSON.parse(requireText(file))), file);
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
