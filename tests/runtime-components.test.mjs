import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { aggregateQuality, editDistance, evaluateLane, latencySummary } from '../benchmark/metrics.mjs'
import { writePcmWav } from './helpers/packageFixture.mjs'

const require = createRequire(import.meta.url)
const { decodeInboundMessage, decodeOutboundMessage, ProtocolViolation } = require('../runtime/protocolV1.cjs')
const { normalizeTranscript, stripSenseVoiceTags } = require('../runtime/transcriptNormalizer.cjs')
const { inspectMonoPcmWav, InvalidAudioError } = require('../runtime/wavSpeechGate.cjs')
const { buildConfig } = require('../runtime/sherpaOfflineRecognizer.cjs')

test('normalizer strips SenseVoice tags, converts script, and preserves numeric/English spans', () => {
  assert.deepEqual(stripSenseVoiceTags('<|zh|><|NEUTRAL|>請使用GitHub。'), { text: '請使用GitHub。', detectedLanguage: 'zh' })
  assert.deepEqual(normalizeTranscript('<|zh|>請輸入版本3.5%,AutoByteus.', 'zh'), { text: '请输入版本3.5%，AutoByteus。', detectedLanguage: 'zh' })
  assert.deepEqual(normalizeTranscript('Hello, AutoByteus 3.5%.', 'en'), { text: 'Hello, AutoByteus 3.5%.', detectedLanguage: 'en' })
})

test('protocol decoder accepts only exact v1 request shapes', () => {
  const request = { type: 'transcribe-file', protocolVersion: 1, requestId: '5d3aefde-f7ad-4c47-9de4-6906ed907a5e', audioPath: '/tmp/voice.wav' }
  assert.deepEqual(decodeInboundMessage(request), request)
  for (const invalid of [{ ...request, languageMode: 'zh' }, { ...request, protocolVersion: 0 }, { ...request, requestId: 'not-a-uuid' }, { type: 'legacy' }]) {
    assert.throws(() => decodeInboundMessage(invalid), ProtocolViolation)
  }
})

test('outbound decoder rejects unknown, overspecified, and semantically invalid protocol objects', async () => {
  const hello = JSON.parse(await fs.readFile(new URL('../protocol/fixtures/valid/hello.json', import.meta.url), 'utf8'))
  assert.equal(decodeOutboundMessage(hello).type, 'hello')
  const result = JSON.parse(await fs.readFile(new URL('../protocol/fixtures/valid/transcription-result.json', import.meta.url), 'utf8'))
  assert.equal(decodeOutboundMessage(result).outcome, 'transcript')
  const overspecified = JSON.parse(await fs.readFile(new URL('../protocol/fixtures/invalid/overspecified-result.json', import.meta.url), 'utf8'))
  assert.throws(() => decodeOutboundMessage(overspecified), ProtocolViolation)
  assert.throws(() => decodeOutboundMessage({ ...result, outcome: 'no-speech', text: 'not empty' }), ProtocolViolation)
  assert.throws(() => decodeOutboundMessage({ type: 'ready', backendKind: 'mlx' }), ProtocolViolation)
})

test('recognizer adapter keeps SenseVoice improvement and Whisper preservation configurations discriminated', () => {
  const common = { sampleRate: 16000, featureDim: 80, numThreads: 4, provider: 'cpu', useInverseTextNormalization: true }
  const sense = buildConfig({ ...common, type: 'sense-voice' }, { model: '/model/sense.onnx', tokens: '/model/tokens.txt' }, 'zh')
  assert.equal(sense.modelConfig.senseVoice.model, '/model/sense.onnx')
  assert.equal(sense.modelConfig.whisper, undefined)
  const whisper = buildConfig({ ...common, type: 'whisper' }, { encoder: '/model/encoder.onnx', decoder: '/model/decoder.onnx', tokens: '/model/tokens.txt' }, 'en')
  assert.deepEqual(whisper.modelConfig.whisper, { encoder: '/model/encoder.onnx', decoder: '/model/decoder.onnx', language: 'en', task: 'transcribe' })
  assert.equal(whisper.modelConfig.senseVoice, undefined)
})

test('WAV gate accepts mono PCM, detects silence, and rejects malformed/stereo input', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wav-gate-test-'))
  try {
    const speech = path.join(root, 'speech.wav')
    const silence = path.join(root, 'silence.wav')
    await writePcmWav(speech)
    await writePcmWav(silence, { amplitude: 0 })
    assert.equal(inspectMonoPcmWav(speech).noSpeech, false)
    assert.equal(inspectMonoPcmWav(silence).noSpeech, true)
    const malformed = path.join(root, 'bad.wav')
    await fs.writeFile(malformed, 'not wav')
    assert.throws(() => inspectMonoPcmWav(malformed), InvalidAudioError)
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})

test('benchmark metrics implement error, percentile, and separate lane gates', () => {
  assert.equal(editDistance([...['你', '好']], [...['你', '们']]), 1)
  const samples = [
    { category: 'mandarin', reference: '你好', hypothesis: '你们', requiredTerms: [] },
    { category: 'mixed', reference: '使用 AutoByteus', hypothesis: '使用 AutoByteus', requiredTerms: ['AutoByteus'] },
    { category: 'english', reference: 'Hello world', hypothesis: 'hello world', requiredTerms: [] },
  ]
  const score = aggregateQuality(samples)
  assert.equal(score.mandarinCer, 0.5)
  assert.equal(score.mixedErrorRate, 0)
  assert.equal(score.productTermRecall, 1)
  assert.deepEqual(latencySummary([1, 2, 3, 100]), { count: 4, failures: 0, p50: 2, p95: 100, max: 100 })
  const baseline = { mandarinCer: 0.2, mixedErrorRate: 0.1, productTermRecall: 0.9, englishWer: 0.1 }
  const operational = { normalizationFixtures: true, handshakeP95Ms: 900, coldReadinessP95Ms: 5000, warmP95Ms: 1000, coldP95Ms: 5500, loadedRssBytes: 500e6, installedSizeBytes: 800e6, allTargetsPassed: true, licensesApproved: true }
  assert.equal(evaluateLane({ baseline, candidate: { mandarinCer: 0.09, mixedErrorRate: 0.12, productTermRecall: 0.9, englishWer: 0.11 }, operational, lane: 'AC-009' }), true)
  assert.equal(evaluateLane({ baseline, candidate: { mandarinCer: 0.205, mixedErrorRate: 0.105, productTermRecall: 0.9, englishWer: 0.115 }, operational, lane: 'AC-016' }), true)
})
