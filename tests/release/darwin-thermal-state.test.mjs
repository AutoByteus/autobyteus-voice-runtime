import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDarwinThermalState } from "../../benchmark/darwin-thermal-state.mjs";

const FIXTURES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/pmset-therm",
);

test("the captured healthy pmset thermal state is normal", async () => {
  const output = await fs.readFile(path.join(FIXTURES, "healthy.txt"), "utf8");
  assert.equal(parseDarwinThermalState(output), "normal");
});

test("an affirmative thermal or performance warning is rejected", () => {
  for (const output of [
    "Note: Thermal warning level has been recorded",
    "Note: Performance warning level is active",
    "CPU_Speed_Limit = 80",
  ]) {
    assert.equal(parseDarwinThermalState(output), "warning");
    assert.notEqual(parseDarwinThermalState(output), "normal");
  }
});

test("unrecognized or malformed thermal state is rejected", () => {
  for (const output of [
    "",
    "warning",
    "No warnings right now",
    "Note: No thermal warning level has been recorded",
    null,
  ]) {
    assert.equal(parseDarwinThermalState(output), "unrecognized");
    assert.notEqual(parseDarwinThermalState(output), "normal");
  }
});
