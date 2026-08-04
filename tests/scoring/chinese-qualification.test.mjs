import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  CHINESE_SCORING_AUTHORITY,
  normalizeChineseQualificationText,
  scoreChineseQualification,
} from "../../benchmark/scoring/chinese-qualification.mjs";
import { aggregateErrorRate } from "../../benchmark/scoring/error-rate.mjs";
import { shaFile } from "../../build/lib/files.mjs";

const root = path.resolve(import.meta.dirname, "../..");

test("frozen Chinese scorer reproduces all 200 rows and 343/6580", async () => {
  const raw = JSON.parse(
      await fs.readFile(
        path.join(
          root,
          "evidence/backend-selection/results/profile-v2-funasr-nano-q8-zh.json",
        ),
      ),
    ),
    quality = JSON.parse(
      await fs.readFile(
        path.join(
          root,
          "evidence/backend-selection/results/quality-profile-v2-funasr-nano-q8-zh.json",
        ),
      ),
    ).reports[0].perClip,
    baseline = JSON.parse(
      await fs.readFile(
        path.join(root, "release/evidence/baselines/chinese-v2.json"),
      ),
    ),
    results = raw.warmSession.quality.map((item, index) => {
      assert.equal(item.id, quality[index].id);
      assert.equal(
        normalizeChineseQualificationText(item.reference),
        quality[index].normalizedReference,
      );
      assert.equal(
        normalizeChineseQualificationText(item.response.text),
        quality[index].normalizedHypothesis,
      );
      return scoreChineseQualification({
        rawReference: item.reference,
        rawHypothesis: item.response.text,
      });
    }),
    aggregate = aggregateErrorRate(results);
  assert.equal(results.length, 200);
  assert.deepEqual(aggregate, {
    errors: 343,
    units: 6580,
    value: 343 / 6580,
  });
  assert.deepEqual(
    baseline.results.map(({ errors, units }) => ({ errors, units })),
    results.map(({ errors, units }) => ({ errors, units })),
  );
});

test("Chinese scoring authority binds exact contract/map and excludes product punctuation", async () => {
  assert.equal(
    CHINESE_SCORING_AUTHORITY.sha256,
    await shaFile(
      path.join(
        root,
        "contracts/scoring/chinese-cer-selection-comparable-v1.json",
      ),
    ),
  );
  assert.equal(
    CHINESE_SCORING_AUTHORITY.mappingSha256,
    await shaFile(
      path.join(root, "contracts/scoring/opencc-t2s-scoring-map-v1.json"),
    ),
  );
  assert.equal(normalizeChineseQualificationText(" 後臺，A-1！ "), "后台a1");
  assert.equal(
    scoreChineseQualification({
      rawReference: "後臺，A-1！",
      rawHypothesis: "后台 a1",
    }).value,
    0,
  );
});

test("retained API-REV-014 raw text re-scores to exact 342/6580", async () => {
  const file = path.join(
    root,
    "tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-014/chinese-darwin-arm64/raw-results.json",
  );
  assert.equal(
    await shaFile(file),
    "5e1281146ebbd46e14ce21ddb1255a611502878e9eb8a4b7e37486a2c82f520f",
  );
  const raw = JSON.parse(await fs.readFile(file, "utf8"));
  const aggregate = aggregateErrorRate(
    raw.results.map((item) =>
      scoreChineseQualification({
        rawReference: item.reference,
        rawHypothesis: item.rawText,
      }),
    ),
  );
  assert.deepEqual(aggregate, {
    errors: 342,
    units: 6580,
    value: 342 / 6580,
  });
});
