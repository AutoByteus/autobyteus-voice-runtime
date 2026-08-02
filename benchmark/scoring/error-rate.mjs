import { scoringUnits } from "./normalization.mjs";
export function errorRate(reference, hypothesis, { metric, profileId }) {
  const a = scoringUnits(reference, metric, profileId),
    b = scoringUnits(hypothesis, metric, profileId);
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = old;
    }
  }
  return {
    errors: row[b.length],
    units: a.length,
    value: a.length ? row[b.length] / a.length : b.length ? 1 : 0,
  };
}
export function aggregateErrorRate(results) {
  const errors = results.reduce((sum, item) => sum + item.errors, 0),
    units = results.reduce((sum, item) => sum + item.units, 0);
  return { errors, units, value: units ? errors / units : 0 };
}
