'use strict'

const util = require('node:util')
const { fail } = require('./providerStartupError.cjs')

const SHA256 = /^[a-f0-9]{64}$/
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/
const GIT_SHA = /^[a-f0-9]{7,40}$/
const LANGUAGES = ['auto', 'en', 'zh']

function exactFields(value, required) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('SESSION_ASSET_INVALID')
  if (!util.isDeepStrictEqual(Object.keys(value).sort(), [...required].sort())) fail('SESSION_ASSET_INVALID')
}

function string(value, pattern) {
  if (typeof value !== 'string' || value.length === 0 || (pattern && !pattern.test(value))) fail('SESSION_ASSET_INVALID')
  return value
}

function asset(value) {
  exactFields(value, ['path', 'sha256'])
  return { path: string(value.path), sha256: string(value.sha256, SHA256) }
}

function packageIdentity(value, fields) {
  exactFields(value, ['packageName', 'version', ...fields])
  const result = { packageName: string(value.packageName), version: string(value.version, VERSION) }
  for (const field of fields) result[field] = asset(value[field])
  return result
}

function runtimeIdentity(value) {
  exactFields(value, ['id', 'version', 'buildCommit'])
  if (value.id !== 'voice-input') fail('SESSION_ASSET_INVALID')
  return { id: value.id, version: string(value.version, VERSION), buildCommit: string(value.buildCommit, /^[a-f0-9]{40}$/) }
}

function capabilities(value) {
  exactFields(value, ['languageModes', 'inverseTextNormalization', 'simplifiedChineseNormalization', 'maxInFlightRequests'])
  if (!util.isDeepStrictEqual(value.languageModes, LANGUAGES) || value.inverseTextNormalization !== true || value.simplifiedChineseNormalization !== true || value.maxInFlightRequests !== 1) fail('SESSION_ASSET_INVALID')
  return { languageModes: [...LANGUAGES], inverseTextNormalization: true, simplifiedChineseNormalization: true, maxInFlightRequests: 1 }
}

function decodeRuntimeDescriptor(value) {
  exactFields(value, ['schemaVersion', 'runtime', 'host', 'worker', 'protocol', 'engine', 'normalization', 'capabilities'])
  if (value.schemaVersion !== 1) fail('SESSION_ASSET_INVALID')
  exactFields(value.host, ['kind', 'version', 'platform', 'arch', 'executable'])
  exactFields(value.worker, ['entrypoint'])
  exactFields(value.protocol, ['version', 'schema'])
  exactFields(value.engine, ['kind', 'version', 'gitSha1', 'wrapper', 'native'])
  exactFields(value.normalization, ['packageName', 'version', 'packageMetadata'])
  if (value.host.kind !== 'bundled-node' || value.engine.kind !== 'sherpa-onnx' || value.protocol.version !== 1) fail('SESSION_ASSET_INVALID')
  return {
    schemaVersion: 1,
    runtime: runtimeIdentity(value.runtime),
    host: { kind: value.host.kind, version: string(value.host.version, VERSION), platform: string(value.host.platform), arch: string(value.host.arch), executable: asset(value.host.executable) },
    worker: { entrypoint: asset(value.worker.entrypoint) },
    protocol: { version: 1, schema: asset(value.protocol.schema) },
    engine: {
      kind: value.engine.kind, version: string(value.engine.version, VERSION), gitSha1: string(value.engine.gitSha1, GIT_SHA),
      wrapper: packageIdentity(value.engine.wrapper, ['packageMetadata', 'packageEntry']),
      native: packageIdentity(value.engine.native, ['packageMetadata', 'binary']),
    },
    normalization: packageIdentity(value.normalization, ['packageMetadata']),
    capabilities: capabilities(value.capabilities),
  }
}

function modelIdentity(value) {
  exactFields(value, ['id', 'version', 'modelType', 'sha256'])
  if (!['sense-voice', 'whisper'].includes(value.modelType)) fail('SESSION_ASSET_INVALID')
  return { id: string(value.id), version: string(value.version), modelType: value.modelType, sha256: string(value.sha256, SHA256) }
}

function recognizerConfiguration(value, modelType) {
  exactFields(value, ['type', 'files', 'sampleRate', 'featureDim', 'numThreads', 'provider', 'useInverseTextNormalization'])
  if (value.type !== modelType || !Number.isInteger(value.sampleRate) || !Number.isInteger(value.featureDim) || !Number.isInteger(value.numThreads) || value.provider !== 'cpu' || value.useInverseTextNormalization !== true) fail('SESSION_ASSET_INVALID')
  const requiredFiles = modelType === 'sense-voice' ? ['model', 'tokens'] : ['encoder', 'decoder', 'tokens']
  exactFields(value.files, requiredFiles)
  const files = Object.fromEntries(requiredFiles.map((name) => [name, asset(value.files[name])]))
  return { type: value.type, files, sampleRate: value.sampleRate, featureDim: value.featureDim, numThreads: value.numThreads, provider: value.provider, useInverseTextNormalization: true }
}

function decodeModelDescriptor(value) {
  exactFields(value, ['schemaVersion', 'model', 'configuration', 'notices'])
  if (value.schemaVersion !== 1 || !Array.isArray(value.notices) || value.notices.length === 0) fail('SESSION_ASSET_INVALID')
  const model = modelIdentity(value.model)
  const configuration = recognizerConfiguration(value.configuration, model.modelType)
  const identityFile = model.modelType === 'sense-voice' ? configuration.files.model : configuration.files.encoder
  if (model.sha256 !== identityFile.sha256) fail('SESSION_ASSET_INVALID')
  return { schemaVersion: 1, model, configuration, notices: value.notices.map(asset) }
}

module.exports = { decodeModelDescriptor, decodeRuntimeDescriptor }
