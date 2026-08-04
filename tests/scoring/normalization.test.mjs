import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import * as OpenCC from "opencc-js";
import { normalizeTranscript } from "../../benchmark/scoring/normalization.mjs";
import { errorRate } from "../../benchmark/scoring/error-rate.mjs";
import { scoreChineseQualification } from "../../benchmark/scoring/chinese-qualification.mjs";
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
test("Chinese qualification CER is separate and symmetric", () => {
  assert.equal(
    scoreChineseQualification({
      rawReference: "軟件",
      rawHypothesis: "软件",
    }).value,
    0,
  );
  assert.throws(
    () =>
      errorRate("軟件", "软件", {
        metric: "CER",
        profileId: "chinese",
      }),
    /versioned owner/,
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
