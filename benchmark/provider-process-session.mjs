import { spawn as nodeSpawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { TextDecoder } from "node:util";
import { decodeFrame } from "./protocol-v1.mjs";
const LIMIT = 1024 * 1024;
export const DEADLINES = Object.freeze({
  helloMs: 2000,
  preparationMs: 30000,
  requestMs: 30000,
  gracefulShutdownMs: 2000,
  forcedShutdownMs: 2000,
});
export class ProviderProcessSession {
  constructor({
    launcher,
    sessionConfig,
    expected,
    spawn = nodeSpawn,
    deadlines = {},
  }) {
    if (
      typeof launcher !== "string" ||
      typeof sessionConfig !== "string" ||
      !expected
    )
      throw new TypeError("Missing provider session identity.");
    this.launcher = launcher;
    this.sessionConfig = sessionConfig;
    this.expected = Object.freeze(structuredClone(expected));
    this.spawnImpl = spawn;
    this.deadlines = Object.freeze({ ...DEADLINES, ...deadlines });
    this.state = "idle";
    this.child = null;
    this.decoder = new TextDecoder("utf-8", { fatal: true });
    this.buffer = "";
    this.bufferBytes = 0;
    this.stderr = "";
    this.usedIds = new Set();
    this.pending = null;
    this.exitPromise = null;
    this.exitResult = null;
    this.terminationPromise = null;
    this.timings = {};
    this.startedAt = 0;
  }
  async start() {
    if (this.state !== "idle") throw new Error("SESSION_ALREADY_STARTED");
    this.state = "spawned";
    this.startedAt = performance.now();
    try {
      this.child = this.spawnImpl(
        this.launcher,
        ["--session-config", this.sessionConfig],
        { stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
      );
      this.exitPromise = new Promise((resolve) => {
        this.child.once("exit", (code, signal) => {
          this.exitResult = { code, signal };
          resolve(this.exitResult);
          if (!["stopped", "stopping-complete", "failed"].includes(this.state))
            void this.fail(new Error("UNEXPECTED_PROCESS_EXIT")).catch(
              () => {},
            );
        });
      });
      this.child.once(
        "error",
        (error) => void this.fail(error).catch(() => {}),
      );
      this.child.stdout.on("data", (chunk) => this.consume(chunk));
      this.child.stdout.once("end", () => this.finishStdout());
      this.child.stderr.on("data", (chunk) => this.consumeStderr(chunk));
      this.state = "awaiting-hello";
      await this.waitFor("hello", this.deadlines.helloMs);
      if (this.state !== "ready")
        await this.waitFor("ready", this.deadlines.preparationMs);
      return this;
    } catch (error) {
      await this.fail(error);
      throw error;
    }
  }
  async transcribe(audioPath, requestId = randomUUID()) {
    if (this.state !== "ready" || this.pending)
      throw new Error("SESSION_NOT_READY");
    if (this.usedIds.has(requestId)) throw new Error("DUPLICATE_REQUEST_ID");
    this.usedIds.add(requestId);
    this.state = "busy";
    const started = performance.now();
    const promise = this.createPending("result", this.deadlines.requestMs);
    this.pending.requestId = requestId;
    try {
      await this.write({
        type: "transcribe-file",
        protocolVersion: 1,
        requestId,
        audioPath,
      });
      const result = await promise;
      this.timings.lastRequestMs = performance.now() - started;
      return result;
    } catch (error) {
      await this.fail(error);
      throw error;
    }
  }
  async shutdown(requestId = randomUUID()) {
    if (this.state !== "ready" || this.pending)
      throw new Error("SESSION_NOT_READY");
    this.state = "shutting-down";
    const stopped = this.createPending(
      "stopped",
      this.deadlines.gracefulShutdownMs,
    );
    const gracefulStartedAt = performance.now();
    try {
      await this.write({ type: "shutdown", protocolVersion: 1, requestId });
      await stopped;
      const remainingGraceMs = Math.max(
        0,
        this.deadlines.gracefulShutdownMs -
          (performance.now() - gracefulStartedAt),
      );
      const exit = await timeout(
        this.exitPromise,
        remainingGraceMs,
        "SHUTDOWN_EXIT_TIMEOUT",
      );
      if (exit.code !== 0) throw new Error("NONZERO_SHUTDOWN_EXIT");
      this.state = "stopped";
      this.detach();
      return exit;
    } catch (error) {
      await this.fail(error);
      throw error;
    }
  }
  async fail(error) {
    if (this.terminationPromise) return this.terminationPromise;
    if (this.state === "stopped") return;
    this.state = "failed";
    this.rejectPending(error);
    this.terminationPromise = this.terminateBounded();
    await this.terminationPromise;
  }
  async terminateBounded() {
    if (!this.child || this.exitResult) {
      this.detach();
      return this.exitResult;
    }
    this.child.stdin?.destroy();
    this.child.kill("SIGTERM");
    let exit = await settleWithin(
      this.exitPromise,
      this.deadlines.gracefulShutdownMs,
    );
    if (!exit) {
      this.child.kill("SIGKILL");
      exit = await settleWithin(
        this.exitPromise,
        this.deadlines.forcedShutdownMs,
      );
    }
    this.detach();
    if (!exit) throw new Error("PROCESS_TREE_DID_NOT_EXIT");
    return exit;
  }
  consume(chunk) {
    if (this.state === "failed" || this.state === "stopped") return;
    const bytes = Buffer.from(chunk);
    let offset = 0;
    try {
      while (offset < bytes.length) {
        const newline = bytes.indexOf(0x0a, offset);
        const end = newline < 0 ? bytes.length : newline;
        const segment = bytes.subarray(offset, end);
        this.bufferBytes += segment.length;
        if (this.bufferBytes > LIMIT) throw new Error("FRAME_TOO_LARGE");
        this.buffer += this.decoder.decode(segment, { stream: newline < 0 });
        if (newline < 0) return;
        const line = this.buffer;
        this.decoder = new TextDecoder("utf-8", { fatal: true });
        this.buffer = "";
        this.bufferBytes = 0;
        if (!line) throw new Error("INVALID_FRAME");
        this.transition(decodeFrame(line));
        offset = newline + 1;
      }
    } catch (error) {
      void this.fail(error).catch(() => {});
    }
  }
  finishStdout() {
    if (this.state === "failed" || this.state === "stopped") return;
    try {
      this.buffer += this.decoder.decode();
      if (this.bufferBytes !== 0 || this.buffer !== "")
        throw new Error("TRUNCATED_FRAME");
      if (this.state !== "stopping-complete")
        throw new Error("PROVIDER_STDOUT_CLOSED");
    } catch (error) {
      void this.fail(error).catch(() => {});
    }
  }
  transition(frame) {
    if (frame.type === "hello") {
      if (this.state !== "awaiting-hello" || !this.matchHello(frame))
        throw new Error("ILLEGAL_HELLO");
      this.timings.handshakeMs = performance.now() - this.startedAt;
      this.preparingAt = performance.now();
      this.state = "preparing";
      return this.resolvePending("hello");
    }
    if (frame.type === "lifecycle") {
      if (frame.state === "model-preparing") {
        if (this.state !== "preparing") throw new Error("ILLEGAL_PREPARATION");
        return;
      }
      if (frame.state === "inference-ready") {
        if (this.state === "preparing") {
          this.timings.preparationMs = performance.now() - this.preparingAt;
          this.timings.startToReadyMs = performance.now() - this.startedAt;
          this.state = "ready";
          if (this.pending?.kind === "ready") this.resolvePending("ready");
          return;
        }
        if (this.state === "busy" && this.pending?.result) {
          const result = this.pending.result;
          this.state = "ready";
          return this.resolvePending("result", result);
        }
        throw new Error("ILLEGAL_READY");
      }
      if (frame.state === "transcribing") {
        if (
          this.state !== "busy" ||
          this.pending?.requestId !== frame.requestId
        )
          throw new Error("ILLEGAL_TRANSCRIBING");
        return;
      }
      if (frame.state === "shutting-down") {
        if (this.state !== "shutting-down") throw new Error("ILLEGAL_SHUTDOWN");
        return;
      }
      if (frame.state === "stopped") {
        if (this.state !== "shutting-down") throw new Error("ILLEGAL_STOPPED");
        this.state = "stopping-complete";
        return this.resolvePending("stopped");
      }
      if (frame.state === "failed") throw new Error(`WORKER_${frame.code}`);
    }
    if (
      frame.type === "transcription-result" ||
      frame.type === "request-error"
    ) {
      if (
        this.state !== "busy" ||
        !this.pending ||
        this.pending.requestId !== frame.requestId ||
        this.pending.result
      )
        throw new Error("ILLEGAL_RESULT");
      this.pending.result = frame;
      return;
    }
    if (frame.type === "shutdown-ack") {
      if (this.state !== "shutting-down")
        throw new Error("ILLEGAL_SHUTDOWN_ACK");
      return;
    }
    throw new Error("ILLEGAL_FRAME");
  }
  matchHello(frame) {
    const e = this.expected;
    return (
      frame.sessionId === e.sessionId &&
      frame.packageId === e.packageId &&
      frame.providerId === e.providerId &&
      frame.modelId === e.modelId &&
      frame.profileId === e.profileId &&
      frame.languageMode === e.languageMode &&
      frame.target.platform === e.platform &&
      frame.target.architecture === e.architecture &&
      frame.capabilityDigest === e.capabilityDigest
    );
  }
  waitFor(kind, milliseconds) {
    return this.createPending(kind, milliseconds);
  }
  createPending(kind, milliseconds) {
    if (this.pending) throw new Error("PENDING_OPERATION_EXISTS");
    let resolve, reject;
    const promise = new Promise((yes, no) => {
      resolve = yes;
      reject = no;
    });
    promise.catch(() => {});
    const timer = setTimeout(() => {
      const error = new Error(`${kind.toUpperCase()}_TIMEOUT`);
      this.rejectPending(error);
      void this.fail(error).catch(() => {});
    }, milliseconds);
    this.pending = {
      kind,
      resolve,
      reject,
      timer,
      requestId: null,
      result: null,
    };
    return promise;
  }
  resolvePending(kind, value) {
    if (!this.pending || this.pending.kind !== kind)
      throw new Error("UNEXPECTED_COMPLETION");
    const pending = this.pending;
    this.pending = null;
    clearTimeout(pending.timer);
    pending.resolve(value);
  }
  rejectPending(error) {
    if (!this.pending) return;
    const pending = this.pending;
    this.pending = null;
    clearTimeout(pending.timer);
    pending.reject(error);
  }
  write(value) {
    return new Promise((resolve, reject) => {
      const data = `${JSON.stringify(value)}\n`;
      if (!this.child?.stdin?.writable)
        return reject(new Error("PROVIDER_STDIN_CLOSED"));
      this.child.stdin.write(data, (error) =>
        error
          ? reject(new Error("PROVIDER_WRITE_FAILED", { cause: error }))
          : resolve(),
      );
    });
  }
  consumeStderr(chunk) {
    const lines = chunk
      .toString("utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) =>
        /^[A-Z][A-Z0-9_]{2,80}$/.test(line)
          ? line
          : "VOICE_PROVIDER_DIAGNOSTIC_REDACTED",
      );
    this.stderr = (this.stderr + lines.join("\n") + "\n").slice(-8192);
  }
  detach() {
    if (!this.child) return;
    this.child.stdout?.removeAllListeners("data");
    this.child.stdout?.removeAllListeners("end");
    this.child.stderr?.removeAllListeners("data");
    this.child.stdin?.destroy();
  }
}
function settleWithin(promise, milliseconds) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), milliseconds)),
  ]);
}
function timeout(promise, milliseconds, code) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(code)), milliseconds),
    ),
  ]);
}
