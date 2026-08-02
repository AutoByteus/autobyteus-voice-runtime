import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'
import { spawn } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { createRequire } from 'node:module'
import { sha256, writeJson } from '../scripts/file-utils.mjs'

export const PROVIDER_DEADLINES = Object.freeze({ helloMs: 2000, readinessMs: 15000, requestMs: 30000, shutdownMs: 2000, forcedMs: 2000 })
const MAX_LINE_BYTES = 1024 * 1024
const MAX_STDERR_BYTES = 64 * 1024
const require = createRequire(import.meta.url)
const { decodeOutboundMessage } = require('../runtime/protocolV1.cjs')

export async function materializeProviderSessionConfig({ manifest, runtimeRoot, modelRoot, languageMode, configPath }) {
  const runtimeAsset = manifest.runtimeAssets.find((asset) => asset.platform === process.platform && asset.arch === process.arch)
  if (!runtimeAsset) throw new Error('Manifest has no runtime asset for this host.')
  const value = {
    schemaVersion: 1,
    protocolVersion: 1,
    runtimeRoot: path.resolve(runtimeRoot),
    runtimeDescriptor: runtimeAsset.runtimeDescriptor,
    modelRoot: path.resolve(modelRoot),
    modelDescriptor: manifest.modelAsset.descriptor,
    expected: {
      runtime: { id: manifest.runtimeId, version: manifest.runtimeVersion, buildCommit: manifest.releaseCommit },
      host: { kind: runtimeAsset.hostKind, version: runtimeAsset.hostVersion, platform: runtimeAsset.platform, arch: runtimeAsset.arch },
      engine: { kind: manifest.dependencies.engine.kind, version: manifest.dependencies.engine.version, gitSha1: manifest.dependencies.engine.gitSha1 },
      model: manifest.selectedModel,
      capabilities: manifest.capabilities,
    },
    languageMode,
  }
  await writeJson(configPath, value)
  return { value, digest: await sha256(configPath), runtimeAsset }
}

export class ProviderClient {
  constructor({ manifest, runtimeRoot, modelRoot, languageMode, configPath, deadlines = PROVIDER_DEADLINES }) {
    this.options = { manifest, runtimeRoot: path.resolve(runtimeRoot), modelRoot: path.resolve(modelRoot), languageMode, configPath: path.resolve(configPath), deadlines }
    this.waiters = []
    this.inbox = []
    this.stderr = Buffer.alloc(0)
    this.state = 'stopped'
  }

  async start() {
    const materialized = await materializeProviderSessionConfig({ ...this.options })
    this.expected = materialized.value.expected
    this.runtimeAsset = materialized.runtimeAsset
    const host = contained(this.options.runtimeRoot, this.runtimeAsset.hostExecutable)
    const entrypoint = contained(this.options.runtimeRoot, this.runtimeAsset.entrypoint)
    this.state = 'process-starting'
    const started = performance.now()
    this.process = spawn(host, [entrypoint, '--session-config', this.options.configPath], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    this.state = 'process-available-pending'
    this.process.stderr.on('data', (chunk) => this.captureStderr(chunk))
    this.process.once('exit', (code, signal) => this.onExit(code, signal))
    const lines = readline.createInterface({ input: this.process.stdout, crlfDelay: Infinity, terminal: false })
    lines.on('line', (line) => this.onLine(line))
    const hello = await this.waitFor((message) => message.type === 'hello', this.options.deadlines.helloMs)
    const helloAt = performance.now()
    assert.deepStrictEqual(stripHello(hello), { ...this.expected, configuration: { languageMode: this.options.languageMode } })
    this.state = 'process-available'
    const preparing = await this.waitFor((message) => message.type === 'lifecycle', this.options.deadlines.readinessMs)
    if (preparing.state !== 'model-preparing') throw new Error('PROTOCOL_INVALID')
    this.state = 'model-preparing'
    const ready = await this.waitFor((message) => message.type === 'lifecycle', this.options.deadlines.readinessMs)
    if (ready.state !== 'inference-ready') throw new Error('PROTOCOL_INVALID')
    this.state = 'inference-ready'
    return { handshakeMs: helloAt - started, readinessMs: performance.now() - helloAt, configurationSha256: await sha256(this.options.configPath) }
  }

  async transcribeFile(audioPath) {
    if (this.state !== 'inference-ready') throw new Error('Provider is not inference-ready.')
    const requestId = crypto.randomUUID()
    this.state = 'transcribing'
    const started = performance.now()
    this.write({ type: 'transcribe-file', protocolVersion: 1, requestId, audioPath: path.resolve(audioPath) })
    try {
      const response = await this.waitFor((message) => message.requestId === requestId, this.options.deadlines.requestMs)
      if (!['transcription-result', 'request-error'].includes(response.type)) throw new Error('PROTOCOL_INVALID')
      return { response, elapsedMs: performance.now() - started }
    } finally {
      if (this.state !== 'failed') this.state = 'inference-ready'
    }
  }

  async shutdown() {
    if (!this.process || this.state === 'stopped') return
    const requestId = crypto.randomUUID()
    this.state = 'stopping'
    this.write({ type: 'shutdown', protocolVersion: 1, requestId })
    try {
      const ack = await this.waitFor((message) => message.type === 'shutdown-ack' && message.requestId === requestId, this.options.deadlines.shutdownMs)
      if (!ack) throw new Error('SHUTDOWN_TIMEOUT')
      await this.waitForExit(this.options.deadlines.shutdownMs)
      this.state = 'stopped'
    } catch (error) {
      await this.terminate()
      throw error
    }
  }

  async terminate() {
    if (!this.process || this.process.exitCode !== null) return
    this.process.kill('SIGTERM')
    try { await this.waitForExit(this.options.deadlines.forcedMs) } catch { this.process.kill('SIGKILL') }
    this.state = 'failed'
  }

  write(message) {
    if (!this.process?.stdin.writable) throw new Error('WORKER_EXITED')
    this.process.stdin.write(`${JSON.stringify(message)}\n`)
  }

  waitFor(predicate, timeoutMs) {
    return new Promise((resolve, reject) => {
      if (this.inbox.length > 0) {
        const message = this.inbox.shift()
        if (predicate(message)) return resolve(message)
        return reject(new Error('PROTOCOL_INVALID'))
      }
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter((waiter) => waiter !== record)
        reject(new Error('PROVIDER_TIMEOUT'))
      }, timeoutMs)
      const record = { predicate, resolve: (value) => { clearTimeout(timer); resolve(value) }, reject: (error) => { clearTimeout(timer); reject(error) } }
      this.waiters.push(record)
    })
  }

  onLine(line) {
    if (Buffer.byteLength(line, 'utf8') > MAX_LINE_BYTES) return this.fail(new Error('PROTOCOL_INVALID'))
    let message
    try { message = decodeOutboundMessage(JSON.parse(line)) } catch { return this.fail(new Error('PROTOCOL_INVALID')) }
    const index = this.waiters.findIndex((waiter) => waiter.predicate(message))
    if (index < 0) {
      this.inbox.push(message)
      return
    }
    this.waiters.splice(index, 1)[0].resolve(message)
  }

  onExit(code, signal) {
    this.exitResult = { code, signal }
    if (this.state !== 'stopping' && this.state !== 'stopped') this.fail(new Error('WORKER_EXITED'))
    this.exitWaiter?.resolve(this.exitResult)
  }

  waitForExit(timeoutMs) {
    if (this.exitResult) return Promise.resolve(this.exitResult)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('SHUTDOWN_TIMEOUT')), timeoutMs)
      this.exitWaiter = { resolve: (value) => { clearTimeout(timer); resolve(value) } }
    })
  }

  captureStderr(chunk) {
    this.stderr = Buffer.concat([this.stderr, Buffer.from(chunk)]).subarray(-MAX_STDERR_BYTES)
  }

  fail(error) {
    this.state = 'failed'
    for (const waiter of this.waiters.splice(0)) waiter.reject(error)
    if (this.process?.exitCode === null) this.process.kill('SIGTERM')
  }
}

function contained(root, relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.includes('..')) throw new Error('Manifest path is invalid.')
  const resolved = path.resolve(root, ...relativePath.split('/'))
  const relative = path.relative(root, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Manifest path escapes its root.')
  return resolved
}

function stripHello(message) {
  if (message.protocolVersion !== 1) throw new Error('PROTOCOL_INCOMPATIBLE')
  const { type, protocolVersion, ...identity } = message
  if (type !== 'hello') throw new Error('PROTOCOL_INVALID')
  return identity
}
