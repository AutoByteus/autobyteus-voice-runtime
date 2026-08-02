import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import * as OpenCC from "opencc-js";
import { normalizeTranscript } from "../../benchmark/scoring/normalization.mjs";
import { errorRate } from "../../benchmark/scoring/error-rate.mjs";
test("normalization fixtures are exact", async () => {
  const value = JSON.parse(
    await fs.readFile(
      path.resolve(
        import.meta.dirname,
        "../../contracts/normalization/fixtures-v1.json",
      ),
    ),
  );
  for (const fixture of value.fixtures)
    assert.equal(
      normalizeTranscript(fixture.raw, fixture.profileId),
      fixture.normalized,
      fixture.id,
    );
});
test("Chinese CER normalizes Traditional and Simplified symmetrically", () => {
  assert.equal(
    errorRate("軟體", "软件", { metric: "CER", profileId: "chinese" }).value,
    0,
  );
});
test("canonical dictionary pipeline matches pinned OpenCC twp-to-cn", () => {
  const convert = OpenCC.Converter({ from: "twp", to: "cn" });
  for (const raw of [
    "請使用軟體。",
    "滑鼠裡面有記憶體",
    "資料庫與網路伺服器",
    "乾隆皇后乾著急",
  ])
    assert.equal(normalizeTranscript(raw, "chinese"), convert(raw), raw);
});
