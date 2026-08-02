#!/usr/bin/env node
'use strict'

// Disposable controlled sherpa-onnx Paraformer worker used only by the backend study.
const { performance } = require('node:perf_hooks')

const PROCESS_STARTED = performance.now()

function parseArgs(values) {
  const parsed = {}
  for (let index = 0; index < values.length; index += 2) parsed[values[index].replace(/^--/, '')] = values[index + 1]
  for (const key of ['sherpa-package', 'model', 'tokens', 'precision']) if (!parsed[key]) throw new Error(`Missing --${key}`)
  parsed.threads = Number(parsed.threads || 4)
  return parsed
}

function emit(value) { process.stdout.write(`${JSON.stringify(value)}\n`) }
function round(value) { return Math.round(value * 1000) / 1000 }

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const importStarted = performance.now()
  const sherpa = require(args['sherpa-package'])
  const importMs = performance.now() - importStarted
  const modelStarted = performance.now()
  const recognizer = await sherpa.OfflineRecognizer.createAsync({
    featConfig: { sampleRate: 16000, featureDim: 80 },
    modelConfig: {
      paraformer: { model: args.model },
      tokens: args.tokens,
      numThreads: args.threads,
      debug: 0,
      provider: 'cpu',
    },
  })
  emit({
    type: 'ready', backend: `sherpa-onnx-paraformer-${args.precision}`, pid: process.pid,
    importMs: round(importMs), modelLoadMs: round(performance.now() - modelStarted),
    workerReadyMs: round(performance.now() - PROCESS_STARTED), rssBytes: process.memoryUsage().rss,
    threads: args.threads,
  })

  let buffer = ''
  process.stdin.setEncoding('utf8')
  for await (const chunk of process.stdin) {
    buffer += chunk
    let newline
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline).trim()
      buffer = buffer.slice(newline + 1)
      if (!line) continue
      const request = JSON.parse(line)
      if (request.type === 'shutdown') {
        emit({ type: 'shutdown-complete', rssBytes: process.memoryUsage().rss })
        return
      }
      const requestStarted = performance.now()
      try {
        const readStarted = performance.now()
        const wave = sherpa.readWave(request.audioPath)
        const readMs = performance.now() - readStarted
        const stream = recognizer.createStream()
        stream.acceptWaveform({ samples: wave.samples, sampleRate: wave.sampleRate })
        const decodeStarted = performance.now()
        await recognizer.decodeAsync(stream)
        const decodeMs = performance.now() - decodeStarted
        const result = recognizer.getResult(stream) || {}
        emit({
          type: 'result', requestId: request.requestId, ok: true,
          text: String(result.text || '').trim(), detectedLanguage: 'zh-en',
          readMs: round(readMs), decodeMs: round(decodeMs), transcribeMs: round(performance.now() - requestStarted),
          rssBytes: process.memoryUsage().rss,
        })
      } catch (error) {
        emit({ type: 'result', requestId: request.requestId, ok: false, error: `${error.name}: ${error.message}`, transcribeMs: round(performance.now() - requestStarted), rssBytes: process.memoryUsage().rss })
      }
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`)
  process.exitCode = 1
})
