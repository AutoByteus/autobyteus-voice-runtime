// Drives the desktop's VoiceInputRuntimeService (bundled caller.mjs) against one extension root.
// Usage: node drive.mjs <extensionRoot> <label> <clip>... ; prints one JSON line per step.
import fs from 'node:fs/promises'
import { VoiceInputRuntimeService } from './caller.mjs'
const [root, label, ...clips] = process.argv.slice(2)
const service = new VoiceInputRuntimeService()
const t0 = performance.now()
const ms = () => Math.round(performance.now() - t0)
const say = (o) => process.stdout.write(JSON.stringify({ label, ...o }) + '\n')
say({ step: 'inspect', inspection: await service.inspectInstallation(root) })
for (const clip of clips) {
  const start = ms()
  const result = await service.transcribe({ audioData: (await fs.readFile(clip)).buffer, languageMode: 'en' }, root)
  say({ step: 'transcribe', clip: clip.split('/').pop(), startedAtMs: start, tookMs: ms() - start, result })
  if (!result.ok && !result.noSpeech) break
}
await service.stopWorkerIfRunning(root)
say({ step: 'stopped', atMs: ms() })
