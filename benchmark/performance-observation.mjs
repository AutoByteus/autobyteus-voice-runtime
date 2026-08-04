export const LATENCY_REFERENCE_TARGETS_MS = Object.freeze({
  handshake: 1000,
  coldPreparation: 20000,
  warmPreparation: 10000,
  warmRequest: 10000,
  coldResult: 25000,
});

export function buildPerformanceMetrics(samples) {
  return {
    handshake: metric(
      samples.cold.map((item) => item.handshakeMs),
      LATENCY_REFERENCE_TARGETS_MS.handshake,
    ),
    coldPreparation: metric(
      samples.cold.map((item) => item.preparationMs),
      LATENCY_REFERENCE_TARGETS_MS.coldPreparation,
    ),
    warmPreparation: metric(
      samples.warmPreparation.map((item) => item.preparationMs),
      LATENCY_REFERENCE_TARGETS_MS.warmPreparation,
    ),
    coldResult: metric(
      samples.cold.map((item) => item.coldResultMs),
      LATENCY_REFERENCE_TARGETS_MS.coldResult,
    ),
    warmRequest: metric(
      samples.warm.map((item) => item.requestMs),
      LATENCY_REFERENCE_TARGETS_MS.warmRequest,
    ),
  };
}

export function assertCompletePerformanceSamples(samples) {
  if (
    samples.cold.length !== 30 ||
    samples.warmPreparation.length !== 30 ||
    samples.warm.length !== 100 ||
    !samples.cold.every((item) =>
      validTimedSample(item, [
        "handshakeMs",
        "preparationMs",
        "coldResultMs",
        "requestMs",
      ]),
    ) ||
    !samples.warmPreparation.every((item) =>
      validTimedSample(item, ["preparationMs"]),
    ) ||
    !samples.warm.every((item) => validTimedSample(item, ["requestMs"]))
  )
    throw new Error("Required performance observations are incomplete.");
}

export function classifyPerformanceAssessment(performanceEnvironment, metrics) {
  if (performanceEnvironment === "loaded-host")
    return "loaded-host-observation";
  if (performanceEnvironment !== "controlled")
    throw new Error("Performance environment classification is invalid.");
  return Object.values(metrics).every((item) => item.referenceMet)
    ? "controlled-pass"
    : "controlled-miss";
}

function validTimedSample(sample, fields) {
  return (
    sample &&
    fields.every(
      (field) => Number.isFinite(sample[field]) && sample[field] >= 0,
    )
  );
}

function metric(values, referenceTargetMs) {
  const sorted = values
      .filter((value) => Number.isFinite(value) && value >= 0)
      .sort((left, right) => left - right),
    pick = (quantile) =>
      sorted[Math.max(0, Math.ceil(quantile * sorted.length) - 1)] ?? 0,
    p95Ms = pick(0.95);
  return {
    sampleCount: sorted.length,
    p50Ms: pick(0.5),
    p95Ms,
    maxMs: sorted.at(-1) ?? 0,
    referenceTargetMs,
    referenceMet: sorted.length > 0 && p95Ms <= referenceTargetMs,
  };
}
