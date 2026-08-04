import path from "node:path";
import { ROOT } from "../build/lib/files.mjs";

export async function proveRuntimeConformance({
  createSession,
  packageRoot,
  expectedBase,
  work,
  sampleAudio,
}) {
  const create = (deadlines) =>
    createSession(packageRoot, expectedBase, work, deadlines);

  const audioSession = await create();
  await audioSession.start();
  const noSpeech = await audioSession.transcribe(
    path.join(ROOT, "contracts/audio/fixtures/silence.wav"),
  );
  if (
    noSpeech.outcome !== "no-speech" ||
    noSpeech.rawText !== "" ||
    noSpeech.normalizedText !== ""
  )
    throw new Error("Actual provider no-speech conformance failed.");
  const invalidAudio = await audioSession.transcribe(
    path.join(ROOT, "contracts/audio/fixtures/malformed.wav"),
  );
  if (
    invalidAudio.type !== "request-error" ||
    invalidAudio.code !== "INVALID_AUDIO" ||
    audioSession.state !== "ready"
  )
    throw new Error("Actual provider malformed-audio conformance failed.");
  await audioSession.shutdown();

  const malformed = await create();
  await malformed.start();
  await writeRaw(malformed, '{"type":"unsupported","protocolVersion":1}\n');
  await awaitFailure(malformed);

  const timedOut = await create({ requestMs: 1 });
  await timedOut.start();
  let timeoutRejected = false;
  try {
    await timedOut.transcribe(sampleAudio);
  } catch (error) {
    timeoutRejected = error.message === "RESULT_TIMEOUT";
  }
  await awaitFailure(timedOut);
  if (!timeoutRejected) throw new Error("Actual request-timeout proof failed.");

  const exited = await create();
  await exited.start();
  exited.child.kill("SIGKILL");
  await awaitFailure(exited);

  const forced = await create({
    gracefulShutdownMs: 25,
    forcedShutdownMs: 2000,
  });
  await forced.start();
  const actualKill = forced.child.kill.bind(forced.child),
    signals = [];
  forced.child.kill = (signal) => {
    signals.push(signal);
    return signal === "SIGTERM" ? true : actualKill(signal);
  };
  await forced.fail(new Error("FORCED_TERMINATION_PROBE"));
  if (signals.join(",") !== "SIGTERM,SIGKILL")
    throw new Error("Forced termination escalation was not bounded/exact.");

  const next = await create();
  await next.start();
  await next.shutdown();
  return {
    schemaVersion: 1,
    noSpeech: true,
    malformedAudio: true,
    malformedMessage: true,
    requestTimeout: true,
    unexpectedExit: true,
    forcedTermination: true,
    cleanNextStart: true,
    noAutomaticReplay: true,
  };
}

function writeRaw(session, value) {
  return new Promise((resolve, reject) =>
    session.child.stdin.write(value, (error) =>
      error ? reject(error) : resolve(),
    ),
  );
}

async function awaitFailure(session) {
  await Promise.race([
    session.exitPromise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Conformance process did not exit.")),
        5000,
      ),
    ),
  ]);
  if (session.terminationPromise) await session.terminationPromise;
  if (session.state !== "failed")
    throw new Error("Conformance failure did not become terminal.");
}
