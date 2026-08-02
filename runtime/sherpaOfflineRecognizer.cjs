'use strict'

const { performance } = require('node:perf_hooks')
const { normalizeTranscript } = require('./transcriptNormalizer.cjs')
const { inspectMonoPcmWav } = require('./wavSpeechGate.cjs')

class SherpaOfflineRecognizer {
  static async create(verifiedSession) {
    if (!Object.isFrozen(verifiedSession) || !verifiedSession.recognizer) throw new Error('Verified provider session required.')
    const sherpa = require(verifiedSession.recognizer.wrapperPackageEntry)
    const descriptor = verifiedSession.recognizer.configuration
    const paths = verifiedSession.recognizer.modelPaths
    const config = buildConfig(descriptor, paths, verifiedSession.languageMode)
    const recognizer = await sherpa.OfflineRecognizer.createAsync(config)
    return new SherpaOfflineRecognizer(verifiedSession, sherpa, recognizer)
  }

  constructor(verifiedSession, sherpa, recognizer) {
    this.session = verifiedSession
    this.sherpa = sherpa
    this.recognizer = recognizer
  }

  async transcribeFile(audioPath) {
    const inspection = inspectMonoPcmWav(audioPath)
    if (inspection.noSpeech) {
      return { outcome: 'no-speech', text: '', detectedLanguage: this.session.languageMode === 'auto' ? 'unknown' : this.session.languageMode, audioDurationMs: inspection.audioDurationMs, inferenceMs: 0 }
    }
    const wave = this.sherpa.readWave(audioPath)
    if (!wave || !wave.samples || wave.sampleRate !== inspection.sampleRate) throw new Error('Invalid decoded WAV.')
    const stream = this.recognizer.createStream()
    stream.acceptWaveform({ samples: wave.samples, sampleRate: wave.sampleRate })
    const started = performance.now()
    await this.recognizer.decodeAsync(stream)
    const result = this.recognizer.getResult(stream) || {}
    const inferenceMs = performance.now() - started
    const normalized = normalizeTranscript(result.text, this.session.languageMode, result.lang || result.language)
    return {
      outcome: normalized.text.length === 0 ? 'no-speech' : 'transcript',
      text: normalized.text,
      detectedLanguage: normalized.detectedLanguage,
      audioDurationMs: inspection.audioDurationMs,
      inferenceMs: Math.round(inferenceMs * 1000) / 1000,
    }
  }
}

function buildConfig(descriptor, paths, languageMode) {
  const modelConfig = {
    tokens: paths.tokens,
    numThreads: descriptor.numThreads,
    debug: 0,
    provider: descriptor.provider,
  }
  if (descriptor.type === 'sense-voice') {
    modelConfig.senseVoice = {
      model: paths.model,
      language: languageMode,
      useInverseTextNormalization: descriptor.useInverseTextNormalization ? 1 : 0,
    }
  } else if (descriptor.type === 'whisper') {
    modelConfig.whisper = {
      encoder: paths.encoder,
      decoder: paths.decoder,
      language: languageMode === 'auto' ? '' : languageMode,
      task: 'transcribe',
    }
  } else {
    throw new Error('Unsupported verified model type.')
  }
  return { featConfig: { sampleRate: descriptor.sampleRate, featureDim: descriptor.featureDim }, modelConfig }
}

module.exports = { SherpaOfflineRecognizer, buildConfig }
