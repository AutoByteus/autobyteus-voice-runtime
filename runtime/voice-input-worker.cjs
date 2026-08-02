#!/usr/bin/env node
'use strict'

const readline = require('node:readline')
const { loadVerifiedProviderSession, ProviderStartupError } = require('./providerSessionConfigV1.cjs')
const { InvalidAudioError } = require('./wavSpeechGate.cjs')
const { SherpaOfflineRecognizer } = require('./sherpaOfflineRecognizer.cjs')
const protocol = require('./protocolV1.cjs')

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function diagnostic(category) {
  process.stderr.write(`${category}\n`)
}

async function main() {
  let session
  try {
    session = loadVerifiedProviderSession(process.argv.slice(2), __filename)
  } catch (error) {
    diagnostic(error instanceof ProviderStartupError ? error.category : 'SESSION_ASSET_INVALID')
    process.exitCode = 1
    return
  }

  write(protocol.hello(session))
  write(protocol.lifecycle('model-preparing'))
  let recognizer
  try {
    recognizer = await SherpaOfflineRecognizer.create(session)
  } catch {
    diagnostic('MODEL_PREPARATION_FAILED')
    process.exitCode = 1
    return
  }
  write(protocol.lifecycle('inference-ready'))

  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false })
  const seenRequestIds = new Set()
  let busy = false
  let stopping = false

  async function handleLine(line) {
    if (Buffer.byteLength(line, 'utf8') > 1024 * 1024) throw new protocol.ProtocolViolation()
    let parsed
    try {
      parsed = JSON.parse(line)
    } catch {
      throw new protocol.ProtocolViolation()
    }
    const message = protocol.decodeInboundMessage(parsed)
    if (stopping || seenRequestIds.has(message.requestId)) throw new protocol.ProtocolViolation()
    seenRequestIds.add(message.requestId)
    if (message.type === 'shutdown') {
      if (busy) throw new protocol.ProtocolViolation()
      stopping = true
      write(protocol.shutdownAck(message.requestId))
      input.close()
      process.stdin.unref()
      return
    }
    if (busy) {
      write(protocol.requestError(message.requestId, 'WORKER_BUSY'))
      return
    }
    busy = true
    try {
      const result = await recognizer.transcribeFile(message.audioPath)
      write(protocol.transcriptionResult(message.requestId, result))
    } catch (error) {
      if (error instanceof InvalidAudioError) write(protocol.requestError(message.requestId, 'INVALID_AUDIO'))
      else {
        diagnostic('INFERENCE_FAILED')
        write(protocol.requestError(message.requestId, 'INFERENCE_FAILED'))
      }
    } finally {
      busy = false
    }
  }

  input.on('line', (line) => {
    input.pause()
    handleLine(line).then(() => {
      if (!stopping) input.resume()
    }).catch(() => {
      diagnostic('PROTOCOL_INVALID')
      process.exitCode = 1
      input.close()
      process.stdin.destroy()
    })
  })
}

main().catch(() => {
  diagnostic('WORKER_FAILED')
  process.exitCode = 1
})
