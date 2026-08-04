import { aggregateErrorRate } from "../scoring/error-rate.mjs";
import { assertTrustedBaseline } from "./trusted-baseline.mjs";

export async function validateQualificationBaseline(
  value,
  baselinePath,
  corpus,
  build,
) {
  const target = `${build.target.platform}-${build.target.architecture}`;
  const trust = await assertTrustedBaseline({
    baseline: value,
    baselinePath,
    corpusManifestSha256: corpus.corpusEvidence.manifestSha256,
    profileId: build.profileId,
    target,
    metric: corpus.manifest.metric,
  });
  if (value.results.length !== corpus.manifest.clips.length)
    throw new Error("Baseline identity mismatch.");
  const aggregate = aggregateErrorRate(value.results);
  if (Math.abs(aggregate.value - value.value) > 1e-12)
    throw new Error("Baseline value is not reproducible.");
  for (let index = 0; index < value.results.length; index++) {
    const current = corpus.manifest.clips[index];
    const prior = value.results[index];
    if (
      prior.clipId !== current.id ||
      prior.audioSha256 !== current.audioSha256 ||
      !Number.isInteger(prior.errors) ||
      !Number.isInteger(prior.units)
    )
      throw new Error("Baseline corpus pairing mismatch.");
  }
  return trust;
}

export function pairedBootstrap(current, baseline) {
  const differences = [];
  let state = 0x5eed1234;
  for (let repetition = 0; repetition < 10000; repetition++) {
    let currentErrors = 0,
      currentUnits = 0,
      baselineErrors = 0,
      baselineUnits = 0;
    for (let draw = 0; draw < current.length; draw++) {
      state = (1664525 * state + 1013904223) >>> 0;
      const index = state % current.length;
      currentErrors += current[index].errors;
      currentUnits += current[index].units;
      baselineErrors += baseline[index].errors;
      baselineUnits += baseline[index].units;
    }
    differences.push(
      currentErrors / currentUnits - baselineErrors / baselineUnits,
    );
  }
  differences.sort((left, right) => left - right);
  const currentRate = aggregateErrorRate(current).value;
  const baselineRate = aggregateErrorRate(baseline).value;
  return {
    method: "paired-bootstrap-v1",
    repetitions: 10000,
    difference: currentRate - baselineRate,
    lower95: differences[249],
    upper95: differences[9749],
  };
}
