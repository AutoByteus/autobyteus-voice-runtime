import { cacheProcedureFor } from "../../benchmark/cache-procedure.mjs";

export async function verifyPerformanceEvidence(
  summary,
  qualification,
  samples,
) {
  const target = `${qualification.platform}-${qualification.architecture}`;
  const approvedProcedure = await cacheProcedureFor(target);
  if (
    samples.schemaVersion !== 1 ||
    JSON.stringify(samples.cacheProcedure) !==
      JSON.stringify(
        summary.conditions.executionEnvironment.filesystemCacheProcedure,
      ) ||
    JSON.stringify(samples.cacheProcedure) !==
      JSON.stringify(approvedProcedure) ||
    !Array.isArray(samples.cacheExecutions) ||
    !Array.isArray(samples.cold) ||
    !Array.isArray(samples.warmPreparation) ||
    !Array.isArray(samples.warm)
  )
    throw new Error("Raw performance evidence is incomplete.");
  const referenceTarget =
    qualification.platform === "darwin" &&
    qualification.architecture === "arm64";
  if (
    referenceTarget &&
    (!samples.cacheProcedure.required ||
      samples.cacheExecutions.length !== samples.cold.length ||
      samples.cacheExecutions.some(
        (item, index) =>
          item.index !== index ||
          item.completed !== true ||
          item.procedureId !== samples.cacheProcedure.id ||
          item.procedureSha256 !== samples.cacheProcedure.sha256,
      ))
  )
    throw new Error(
      "Filesystem-cold procedure execution evidence is incomplete.",
    );
  if (
    referenceTarget &&
    (samples.cold.length < 30 ||
      samples.warmPreparation.length < 30 ||
      samples.warm.length < 100)
  )
    throw new Error("Reference-target performance samples are insufficient.");
  for (const [metric, values] of [
    ["handshake", samples.cold.map((item) => item.handshakeMs)],
    ["coldPreparation", samples.cold.map((item) => item.preparationMs)],
    [
      "warmPreparation",
      samples.warmPreparation.map((item) => item.preparationMs),
    ],
    ["coldResult", samples.cold.map((item) => item.coldResultMs)],
    ["warmRequest", samples.warm.map((item) => item.requestMs)],
  ])
    if (
      JSON.stringify(summarize(values)) !==
      JSON.stringify(qualification[metric])
    )
      throw new Error(
        `Performance metric does not match raw samples: ${metric}`,
      );
}

function summarize(values) {
  if (
    !values.length ||
    values.some((value) => !Number.isFinite(value) || value < 0)
  )
    throw new Error("Performance sample values are invalid.");
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (q) => sorted[Math.ceil(q * sorted.length) - 1];
  return {
    count: sorted.length,
    failures: 0,
    timeouts: 0,
    p50Ms: pick(0.5),
    p95Ms: pick(0.95),
    maxMs: sorted.at(-1),
  };
}
