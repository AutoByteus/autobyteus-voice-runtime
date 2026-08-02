'use strict'

const path = require('node:path')

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ERROR_DETAILS = Object.freeze({
  INVALID_AUDIO: ['The recording is not a supported mono PCM WAV file.', false],
  UNSUPPORTED_REQUEST: ['The request is not supported.', false],
  INFERENCE_FAILED: ['Voice recognition failed.', true],
  WORKER_BUSY: ['Voice recognition is already in progress.', true],
})

class ProtocolViolation extends Error {
  constructor() {
    super('PROTOCOL_INVALID')
    this.name = 'ProtocolViolation'
  }
}

function exactObject(value, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ProtocolViolation()
  const actual = Object.keys(value).sort()
  const expected = [...fields].sort()
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) throw new ProtocolViolation()
}

function requestId(value) {
  if (typeof value !== 'string' || !UUID.test(value)) throw new ProtocolViolation()
  return value
}

function decodeInboundMessage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.type !== 'string') throw new ProtocolViolation()
  if (value.type === 'transcribe-file') {
    exactObject(value, ['type', 'protocolVersion', 'requestId', 'audioPath'])
    if (value.protocolVersion !== 1 || typeof value.audioPath !== 'string' || !path.isAbsolute(value.audioPath)) throw new ProtocolViolation()
    return { type: value.type, protocolVersion: 1, requestId: requestId(value.requestId), audioPath: value.audioPath }
  }
  if (value.type === 'shutdown') {
    exactObject(value, ['type', 'protocolVersion', 'requestId'])
    if (value.protocolVersion !== 1) throw new ProtocolViolation()
    return { type: value.type, protocolVersion: 1, requestId: requestId(value.requestId) }
  }
  throw new ProtocolViolation()
}

function decodeOutboundMessage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.type !== 'string') throw new ProtocolViolation()
  if (value.type === 'hello') return decodeHello(value)
  if (value.type === 'lifecycle') {
    exactObject(value, ['type', 'state'])
    if (!['model-preparing', 'inference-ready'].includes(value.state)) throw new ProtocolViolation()
    return value
  }
  if (value.type === 'transcription-result') {
    exactObject(value, ['type', 'protocolVersion', 'requestId', 'outcome', 'text', 'detectedLanguage', 'metrics'])
    if (value.protocolVersion !== 1 || !['transcript', 'no-speech'].includes(value.outcome) || typeof value.text !== 'string') throw new ProtocolViolation()
    if ((value.outcome === 'no-speech' && value.text !== '') || (value.outcome === 'transcript' && value.text.length === 0)) throw new ProtocolViolation()
    if (!['en', 'zh', 'yue', 'ja', 'ko', 'unknown'].includes(value.detectedLanguage)) throw new ProtocolViolation()
    exactObject(value.metrics, ['audioDurationMs', 'inferenceMs'])
    if (!validMetric(value.metrics.audioDurationMs) || !validMetric(value.metrics.inferenceMs)) throw new ProtocolViolation()
    requestId(value.requestId)
    return value
  }
  if (value.type === 'request-error') {
    exactObject(value, ['type', 'protocolVersion', 'requestId', 'code', 'message', 'retryable'])
    const details = ERROR_DETAILS[value.code]
    if (value.protocolVersion !== 1 || !details || value.message !== details[0] || value.retryable !== details[1]) throw new ProtocolViolation()
    requestId(value.requestId)
    return value
  }
  if (value.type === 'shutdown-ack') {
    exactObject(value, ['type', 'protocolVersion', 'requestId'])
    if (value.protocolVersion !== 1) throw new ProtocolViolation()
    requestId(value.requestId)
    return value
  }
  throw new ProtocolViolation()
}

function decodeHello(value) {
  exactObject(value, ['type', 'protocolVersion', 'runtime', 'host', 'engine', 'model', 'configuration', 'capabilities'])
  if (value.protocolVersion !== 1) throw new ProtocolViolation()
  exactObject(value.runtime, ['id', 'version', 'buildCommit'])
  exactObject(value.host, ['kind', 'version', 'platform', 'arch'])
  exactObject(value.engine, ['kind', 'version', 'gitSha1'])
  exactObject(value.model, ['id', 'version', 'modelType', 'sha256'])
  exactObject(value.configuration, ['languageMode'])
  exactObject(value.capabilities, ['languageModes', 'inverseTextNormalization', 'simplifiedChineseNormalization', 'maxInFlightRequests'])
  if (value.runtime.id !== 'voice-input' || !/^[a-f0-9]{40}$/.test(value.runtime.buildCommit) || value.host.kind !== 'bundled-node' || value.engine.kind !== 'sherpa-onnx') throw new ProtocolViolation()
  if (!['darwin', 'linux', 'win32'].includes(value.host.platform) || !['arm64', 'x64'].includes(value.host.arch) || !['sense-voice', 'whisper'].includes(value.model.modelType) || !/^[a-f0-9]{64}$/.test(value.model.sha256)) throw new ProtocolViolation()
  if (!['auto', 'en', 'zh'].includes(value.configuration.languageMode) || JSON.stringify(value.capabilities.languageModes) !== JSON.stringify(['auto', 'en', 'zh'])) throw new ProtocolViolation()
  if (value.capabilities.inverseTextNormalization !== true || value.capabilities.simplifiedChineseNormalization !== true || value.capabilities.maxInFlightRequests !== 1) throw new ProtocolViolation()
  return value
}

function validMetric(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function hello(session) {
  const identity = session.identity
  return {
    type: 'hello',
    protocolVersion: 1,
    runtime: identity.runtime,
    host: identity.host,
    engine: identity.engine,
    model: identity.model,
    configuration: { languageMode: session.languageMode },
    capabilities: identity.capabilities,
  }
}

function lifecycle(state) {
  if (!['model-preparing', 'inference-ready'].includes(state)) throw new ProtocolViolation()
  return { type: 'lifecycle', state }
}

function transcriptionResult(requestIdValue, result) {
  return {
    type: 'transcription-result',
    protocolVersion: 1,
    requestId: requestId(requestIdValue),
    outcome: result.outcome,
    text: result.text,
    detectedLanguage: result.detectedLanguage,
    metrics: {
      audioDurationMs: result.audioDurationMs,
      inferenceMs: result.inferenceMs,
    },
  }
}

function requestError(requestIdValue, code) {
  if (!ERROR_DETAILS[code]) throw new ProtocolViolation()
  return { type: 'request-error', protocolVersion: 1, requestId: requestId(requestIdValue), code, message: ERROR_DETAILS[code][0], retryable: ERROR_DETAILS[code][1] }
}

function shutdownAck(requestIdValue) {
  return { type: 'shutdown-ack', protocolVersion: 1, requestId: requestId(requestIdValue) }
}

module.exports = { ProtocolViolation, decodeInboundMessage, decodeOutboundMessage, hello, lifecycle, requestError, shutdownAck, transcriptionResult }
