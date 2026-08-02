import crypto from 'node:crypto'
import path from 'node:path'
import readline from 'node:readline'
import { spawn } from 'node:child_process'

// Historical v0.3 is intentionally external to this repository's production
// package. The adapter can drive a separately preserved, already-prepared v0.3
// tree for same-corpus measurement; it never bootstraps pip or downloads a model.
export class V03BaselineAdapter {
  constructor({ runtimeRoot, modelPath, backend }) {
    if (!['mlx', 'faster-whisper'].includes(backend)) throw new Error('Unsupported v0.3 baseline backend.')
    this.runtimeRoot = path.resolve(runtimeRoot)
    this.modelPath = path.resolve(modelPath)
    this.backend = backend
    this.pending = new Map()
  }

  async start() {
    const launcher = path.join(this.runtimeRoot, process.platform === 'win32' ? 'bin/voice-input-worker.cmd' : 'bin/voice-input-worker')
    this.process = spawn(launcher, ['serve', '--backend', this.backend, '--model-path', this.modelPath], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    this.process.stderr.on('data', () => {})
    this.process.once('exit', () => {
      for (const pending of this.pending.values()) pending.reject(new Error('Historical baseline worker exited.'))
      this.pending.clear()
    })
    const lines = readline.createInterface({ input: this.process.stdout, crlfDelay: Infinity, terminal: false })
    lines.on('line', (line) => this.onLine(line))
    const ready = await this.waitFor('ready', 15000)
    if (ready.type !== 'ready' || ready.backendKind !== this.backend) throw new Error('Historical baseline ready message mismatch.')
  }

  transcribeFile(audioPath, languageMode) {
    const requestId = crypto.randomUUID()
    this.process.stdin.write(`${JSON.stringify({ type: 'transcribe-file', requestId, audioPath: path.resolve(audioPath), languageMode })}\n`)
    return this.waitFor(requestId, 30000)
  }

  async stop() {
    if (!this.process || this.process.exitCode !== null) return
    this.process.stdin.end()
    await new Promise((resolve) => {
      const timer = setTimeout(() => { this.process.kill('SIGKILL'); resolve() }, 2000)
      this.process.once('exit', () => { clearTimeout(timer); resolve() })
    })
  }

  waitFor(key, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(key); reject(new Error('Historical baseline timeout.')) }, timeoutMs)
      this.pending.set(key, { resolve: (value) => { clearTimeout(timer); resolve(value) }, reject })
    })
  }

  onLine(line) {
    let message
    try { message = JSON.parse(line) } catch { return }
    const key = message.type === 'ready' ? 'ready' : message.requestId
    const pending = this.pending.get(key)
    if (!pending) return
    this.pending.delete(key)
    pending.resolve(message)
  }
}
