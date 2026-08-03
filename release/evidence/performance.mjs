import { cacheProcedureFor } from "../../benchmark/cache-procedure.mjs";
import { assertCompletePerformanceSamples } from "../../benchmark/performance-observation.mjs";

export async function verifyPerformanceEvidence(
  summary,
  qualification,
  samples,
  attempts,
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
    !Array.isArray(samples.warm) ||
    attempts.schemaVersion !== 1 ||
    attempts.packageId !== qualification.packageId ||
    attempts.profileId !== qualification.profileId ||
    attempts.target !== target ||
    !Array.isArray(attempts.attempts)
  )
    throw new Error("Raw performance evidence is incomplete.");
  assertCompletePerformanceSamples(samples);
  const counts = {
    started: attempts.attempts.length,
    succeeded: attempts.attempts.filter((item) => item.status === "succeeded")
      .length,
    failed: attempts.attempts.filter((item) => item.status === "failed").length,
    timedOut: attempts.attempts.filter((item) => item.timeout).length,
    excluded: 0,
  };
  if (JSON.stringify(counts) !== JSON.stringify(summary.attempts))
    throw new Error("Started-attempt counts do not match raw evidence.");
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
    (samples.cold.length !== 30 ||
      samples.warmPreparation.length !== 30 ||
      samples.warm.length !== 100)
  )
    throw new Error("Reference-target performance samples are insufficient.");
  if (
    attempts.decision !== "pass" ||
    attempts.failureCategory !== null ||
    attempts.attempts.some((item) => item.status !== "succeeded") ||
    attempts.attempts.filter(
      (item) => item.phase === "cold" && item.performanceCounted,
    ).length !== 30 ||
    attempts.attempts.filter(
      (item) => item.phase === "warm-preparation" && item.performanceCounted,
    ).length !== 30 ||
    attempts.attempts.filter(
      (item) => item.phase === "warm-request" && item.performanceCounted,
    ).length !== 100
  )
    throw new Error("Passing qualification attempt evidence is incomplete.");
}
