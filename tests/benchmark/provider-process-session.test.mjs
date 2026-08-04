import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { ProviderProcessSession } from "../../benchmark/provider-process-session.mjs";
const identity = {
  sessionId: "0198f0f0-7e65-7f72-9c3e-95b59eeb72a9",
  packageId: "pkg",
  providerId: "provider",
  modelId: "model",
  profileId: "chinese",
  languageMode: "zh",
  platform: "darwin",
  architecture: "arm64",
  capabilityDigest: "c".repeat(64),
};
const frame = (value) => Buffer.from(`${JSON.stringify(value)}\n`);
class Stream extends EventEmitter {
  constructor(write) {
    super();
    this.writable = true;
    this.writeImpl = write;
  }
  write(value, callback) {
    this.writeImpl?.(JSON.parse(value), callback);
    if (!this.writeImpl) callback();
  }
  destroy() {
    this.writable = false;
  }
}
function childFactory({
  malformed = false,
  writeFailure = false,
  silent = false,
  ignoreTerm = false,
  bytewise = false,
} = {}) {
  const child = new EventEmitter();
  child.pid = 1234;
  child.stdout = new Stream();
  child.stderr = new Stream();
  child.stdin = new Stream((value, callback) => {
    if (writeFailure) return callback(new Error("broken pipe"));
    callback();
    if (value.type === "transcribe-file") {
      queueMicrotask(() => {
        child.emitFrame({
          type: "lifecycle",
          protocolVersion: 1,
          state: "transcribing",
          requestId: value.requestId,
        });
        child.emitFrame({
          type: "transcription-result",
          protocolVersion: 1,
          requestId: value.requestId,
          outcome: "transcript",
          rawText: "請",
          normalizedText: "请",
          detectedLanguage: "zh",
          metrics: {
            audioDurationMs: 1000,
            inferenceMs: 1,
            normalizationMs: 1,
          },
        });
        child.emitFrame({
          type: "lifecycle",
          protocolVersion: 1,
          state: "inference-ready",
        });
      });
    }
    if (value.type === "shutdown")
      queueMicrotask(() => {
        child.emitFrame({
          type: "lifecycle",
          protocolVersion: 1,
          state: "shutting-down",
        });
        child.emitFrame({
          type: "shutdown-ack",
          protocolVersion: 1,
          requestId: value.requestId,
        });
        child.emitFrame({
          type: "lifecycle",
          protocolVersion: 1,
          state: "stopped",
        });
        child.emit("exit", 0, null);
      });
  });
  child.kills = [];
  child.emitFrame = (value) => {
    const encoded = frame(value);
    if (bytewise) {
      for (const byte of encoded) child.stdout.emit("data", Buffer.of(byte));
    } else child.stdout.emit("data", encoded);
  };
  child.kill = (signal) => {
    child.kills.push(signal);
    if (ignoreTerm && signal === "SIGTERM") return true;
    queueMicrotask(() => child.emit("exit", null, signal));
    return true;
  };
  if (!silent)
    queueMicrotask(() => {
      if (malformed) return child.stdout.emit("data", Buffer.from("{bad\n"));
      child.emitFrame({
        type: "hello",
        protocolVersion: 1,
        sessionId: identity.sessionId,
        packageId: "pkg",
        providerId: "provider",
        modelId: "model",
        profileId: "chinese",
        languageMode: "zh",
        target: { platform: "darwin", architecture: "arm64" },
        capabilityDigest: "c".repeat(64),
      });
      child.emitFrame({
        type: "lifecycle",
        protocolVersion: 1,
        state: "model-preparing",
      });
      child.emitFrame({
        type: "lifecycle",
        protocolVersion: 1,
        state: "inference-ready",
      });
    });
  return child;
}
const create = (child) =>
  new ProviderProcessSession({
    launcher: "/pkg/bin/voice-provider",
    sessionConfig: "/tmp/session.json",
    expected: identity,
    spawn: () => child,
    deadlines: {
      helloMs: 20,
      preparationMs: 20,
      requestMs: 20,
      gracefulShutdownMs: 20,
      forcedShutdownMs: 20,
    },
  });
test("session follows ready, request, and bounded shutdown", async () => {
  const child = childFactory(),
    session = create(child);
  await session.start();
  const id = "0198f0f0-7e65-7f72-9c3e-95b59eeb72b0";
  const result = await session.transcribe("/tmp/audio.wav", id);
  assert.equal(result.normalizedText, "请");
  await session.shutdown("0198f0f0-7e65-7f72-9c3e-95b59eeb72b1");
  assert.equal(session.state, "stopped");
  assert.deepEqual(child.kills, []);
});
test("malformed protocol terminally fails and awaits termination", async () => {
  const child = childFactory({ malformed: true }),
    session = create(child);
  await assert.rejects(session.start());
  assert.equal(session.state, "failed");
  assert.deepEqual(child.kills, ["SIGTERM"]);
});
test("hello timeout terminally fails and awaits termination", async () => {
  const child = childFactory({ silent: true }),
    session = create(child);
  await assert.rejects(session.start(), /HELLO_TIMEOUT/);
  assert.equal(session.state, "failed");
  assert.deepEqual(child.kills, ["SIGTERM"]);
});
test("write failure terminally fails without replay", async () => {
  const child = childFactory({ writeFailure: true }),
    session = create(child);
  await session.start();
  await assert.rejects(
    session.transcribe(
      "/tmp/audio.wav",
      "0198f0f0-7e65-7f72-9c3e-95b59eeb72b0",
    ),
    /PROVIDER_WRITE_FAILED/,
  );
  assert.equal(session.state, "failed");
  assert.deepEqual(child.kills, ["SIGTERM"]);
});
test("terminal failure escalates once when graceful termination is ignored", async () => {
  const child = childFactory({ malformed: true, ignoreTerm: true });
  const session = create(child);
  await assert.rejects(session.start());
  assert.equal(session.state, "failed");
  assert.deepEqual(child.kills, ["SIGTERM", "SIGKILL"]);
});
test("statefully decodes UTF-8 and line delimiters split at every byte", async () => {
  const child = childFactory({ bytewise: true });
  const session = create(child);
  await session.start();
  const id = "0198f0f0-7e65-7f72-9c3e-95b59eeb72b0";
  const result = await session.transcribe("/tmp/audio.wav", id);
  assert.equal(result.rawText, "請");
  assert.equal(result.normalizedText, "请");
  await session.shutdown("0198f0f0-7e65-7f72-9c3e-95b59eeb72b1");
});
test("truncated UTF-8 on stdout termination fails the session", async () => {
  const child = childFactory();
  const session = create(child);
  await session.start();
  child.stdout.emit("data", Buffer.from([0xe8]));
  child.stdout.emit("end");
  await session.terminationPromise;
  assert.equal(session.state, "failed");
  assert.deepEqual(child.kills, ["SIGTERM"]);
});
test("session forwards exact raw stderr chunks without interpreting framing", async () => {
  const child = childFactory(),
    session = create(child),
    chunks = [],
    events = [];
  session.attachStderrObserver({
    onSpawn: (spawned) => events.push(["spawn", spawned.pid]),
    onBytes: (bytes) => chunks.push(Buffer.from(bytes)),
    onClose: () => events.push(["close"]),
  });
  queueMicrotask(() => {
    child.stderr.emit("data", Buffer.from([0xe8, 0xaa]));
    child.stderr.emit("data", Buffer.from([0x9e, 0x0a, 0x41]));
    child.stderr.emit("end");
  });
  await session.start();
  assert.deepEqual(events, [["spawn", 1234], ["close"]]);
  assert.deepEqual(
    Buffer.concat(chunks),
    Buffer.from([0xe8, 0xaa, 0x9e, 0x0a, 0x41]),
  );
  await session.shutdown("0198f0f0-7e65-7f72-9c3e-95b59eeb72b2");
});
