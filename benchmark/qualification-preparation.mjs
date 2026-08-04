import { PreparationEvidenceCollector } from "./preparation-diagnostics.mjs";
import { measureWithRss } from "./rss-sampler.mjs";

export async function startQualificationSession({
  session,
  profileId,
  attemptSequence,
  rss,
  preparationAttempts,
  collectorOptions = {},
}) {
  if (profileId !== "chinese")
    return measureWithRss(session.start(), () => session.child?.pid, rss);

  const collector = new PreparationEvidenceCollector({
    attemptSequence,
    pid: () => session.child?.pid,
    onRssObservation: (value) => rss.push(value),
    ...collectorOptions,
  });
  session.attachStderrObserver({
    onSpawn: () => collector.childSpawned(),
    onBytes: (bytes) => collector.acceptStderrChunk(bytes),
    onClose: () => collector.stderrClosed(),
  });
  let retained = false;
  try {
    await session.start();
    const evidence = await collector.finalize("success");
    preparationAttempts.push(evidence);
    retained = true;
    if (
      evidence.diagnosticValidation !== "pass" ||
      evidence.privacyDecision !== "pass"
    )
      throw new Error("PREPARATION_EVIDENCE_INVALID");
    return session;
  } catch (error) {
    if (!retained)
      preparationAttempts.push(await collector.finalize("failure"));
    throw error;
  }
}
