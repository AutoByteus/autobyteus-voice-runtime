'use strict'

const fs = require('node:fs')
const path = require('node:path')
const util = require('node:util')
const { ProviderStartupError, fail } = require('./providerStartupError.cjs')
const { decodeModelDescriptor, decodeRuntimeDescriptor } = require('./providerDescriptorsV1.cjs')
const { canonicalContainedFile, canonicalRoot, packageIdentity, parseJsonFile, verifyAssets, verifyDigest } = require('./providerAssetIntegrity.cjs')

const SHA256 = /^[a-f0-9]{64}$/
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/
const GIT_SHA = /^[a-f0-9]{7,40}$/
const LANGUAGES = ['auto', 'en', 'zh']

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function exactFields(value, required) {
  if (!isObject(value) || !util.isDeepStrictEqual(Object.keys(value).sort(), [...required].sort())) fail('SESSION_CONFIG_INVALID')
}

function expectString(value, pattern) {
  if (typeof value !== 'string' || value.length === 0 || (pattern && !pattern.test(value))) fail('SESSION_CONFIG_INVALID')
  return value
}

function decodeReference(value) {
  exactFields(value, ['path', 'sha256'])
  return { path: expectString(value.path), sha256: expectString(value.sha256, SHA256) }
}

function decodeRuntimeIdentity(value) {
  exactFields(value, ['id', 'version', 'buildCommit'])
  if (value.id !== 'voice-input') fail('SESSION_CONFIG_INVALID')
  return { id: value.id, version: expectString(value.version, VERSION), buildCommit: expectString(value.buildCommit, /^[a-f0-9]{40}$/) }
}

function decodeHostIdentity(value) {
  exactFields(value, ['kind', 'version', 'platform', 'arch'])
  if (value.kind !== 'bundled-node' || !['darwin', 'linux', 'win32'].includes(value.platform) || !['arm64', 'x64'].includes(value.arch)) fail('SESSION_CONFIG_INVALID')
  return { kind: value.kind, version: expectString(value.version, VERSION), platform: value.platform, arch: value.arch }
}

function decodeEngineIdentity(value) {
  exactFields(value, ['kind', 'version', 'gitSha1'])
  if (value.kind !== 'sherpa-onnx') fail('SESSION_CONFIG_INVALID')
  return { kind: value.kind, version: expectString(value.version, VERSION), gitSha1: expectString(value.gitSha1, GIT_SHA) }
}

function decodeModelIdentity(value) {
  exactFields(value, ['id', 'version', 'modelType', 'sha256'])
  if (!['sense-voice', 'whisper'].includes(value.modelType)) fail('SESSION_CONFIG_INVALID')
  return { id: expectString(value.id), version: expectString(value.version), modelType: value.modelType, sha256: expectString(value.sha256, SHA256) }
}

function decodeCapabilities(value) {
  exactFields(value, ['languageModes', 'inverseTextNormalization', 'simplifiedChineseNormalization', 'maxInFlightRequests'])
  if (!util.isDeepStrictEqual(value.languageModes, LANGUAGES) || value.inverseTextNormalization !== true || value.simplifiedChineseNormalization !== true || value.maxInFlightRequests !== 1) fail('SESSION_CONFIG_INVALID')
  return { languageModes: [...LANGUAGES], inverseTextNormalization: true, simplifiedChineseNormalization: true, maxInFlightRequests: 1 }
}

function decodeSessionConfig(value) {
  exactFields(value, ['schemaVersion', 'protocolVersion', 'runtimeRoot', 'runtimeDescriptor', 'modelRoot', 'modelDescriptor', 'expected', 'languageMode'])
  if (value.schemaVersion !== 1 || value.protocolVersion !== 1 || !path.isAbsolute(value.runtimeRoot) || !path.isAbsolute(value.modelRoot)) fail('SESSION_CONFIG_INVALID')
  exactFields(value.expected, ['runtime', 'host', 'engine', 'model', 'capabilities'])
  if (typeof value.languageMode !== 'string') fail('SESSION_CONFIG_INVALID')
  return {
    schemaVersion: 1, protocolVersion: 1,
    runtimeRoot: value.runtimeRoot, runtimeDescriptor: decodeReference(value.runtimeDescriptor),
    modelRoot: value.modelRoot, modelDescriptor: decodeReference(value.modelDescriptor),
    expected: {
      runtime: decodeRuntimeIdentity(value.expected.runtime), host: decodeHostIdentity(value.expected.host),
      engine: decodeEngineIdentity(value.expected.engine), model: decodeModelIdentity(value.expected.model),
      capabilities: decodeCapabilities(value.expected.capabilities),
    },
    languageMode: value.languageMode,
  }
}

function parseStartupArguments(argv) {
  if (!Array.isArray(argv) || argv.length !== 2 || argv[0] !== '--session-config' || typeof argv[1] !== 'string' || !path.isAbsolute(argv[1])) fail('STARTUP_ARGUMENT_INVALID')
  return argv[1]
}

function identitiesEqual(actual, expected) {
  if (!util.isDeepStrictEqual(actual, expected)) fail('SESSION_IDENTITY_MISMATCH')
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

function loadVerifiedProviderSession(argv, entrypointPath) {
  const configPath = parseStartupArguments(argv)
  const config = decodeSessionConfig(parseJsonFile(configPath, 'SESSION_CONFIG_INVALID'))
  if (!LANGUAGES.includes(config.languageMode)) fail('SESSION_LANGUAGE_UNSUPPORTED')
  const runtimeRoot = canonicalRoot(config.runtimeRoot)
  const modelRoot = canonicalRoot(config.modelRoot)
  const runtimeDescriptorPath = canonicalContainedFile(runtimeRoot, config.runtimeDescriptor.path)
  const modelDescriptorPath = canonicalContainedFile(modelRoot, config.modelDescriptor.path)
  verifyDigest(runtimeDescriptorPath, config.runtimeDescriptor.sha256)
  verifyDigest(modelDescriptorPath, config.modelDescriptor.sha256)
  const runtimeDescriptor = decodeRuntimeDescriptor(parseJsonFile(runtimeDescriptorPath, 'SESSION_ASSET_INVALID'))
  const modelDescriptor = decodeModelDescriptor(parseJsonFile(modelDescriptorPath, 'SESSION_ASSET_INVALID'))
  const runtimePaths = verifyAssets(runtimeRoot, {
    hostExecutable: runtimeDescriptor.host.executable, workerEntrypoint: runtimeDescriptor.worker.entrypoint,
    protocolSchema: runtimeDescriptor.protocol.schema, wrapperPackageMetadata: runtimeDescriptor.engine.wrapper.packageMetadata,
    wrapperPackageEntry: runtimeDescriptor.engine.wrapper.packageEntry, nativePackageMetadata: runtimeDescriptor.engine.native.packageMetadata,
    nativeBinary: runtimeDescriptor.engine.native.binary, normalizationPackageMetadata: runtimeDescriptor.normalization.packageMetadata,
  })
  const modelPaths = verifyAssets(modelRoot, { ...modelDescriptor.configuration.files, ...Object.fromEntries(modelDescriptor.notices.map((asset, index) => [`notice${index}`, asset])) })
  if (fs.realpathSync(process.execPath) !== runtimePaths.hostExecutable || fs.realpathSync(entrypointPath) !== runtimePaths.workerEntrypoint) fail('SESSION_IDENTITY_MISMATCH')
  if (process.platform !== runtimeDescriptor.host.platform || process.arch !== runtimeDescriptor.host.arch || process.versions.node !== runtimeDescriptor.host.version) fail('SESSION_IDENTITY_MISMATCH')
  packageIdentity(runtimePaths.wrapperPackageMetadata, runtimeDescriptor.engine.wrapper.packageName, runtimeDescriptor.engine.wrapper.version)
  packageIdentity(runtimePaths.nativePackageMetadata, runtimeDescriptor.engine.native.packageName, runtimeDescriptor.engine.native.version)
  packageIdentity(runtimePaths.normalizationPackageMetadata, runtimeDescriptor.normalization.packageName, runtimeDescriptor.normalization.version)
  let sherpa
  try { sherpa = require(runtimePaths.wrapperPackageEntry) } catch { fail('SESSION_ASSET_INVALID') }
  if (sherpa.version !== runtimeDescriptor.engine.version || sherpa.gitSha1 !== runtimeDescriptor.engine.gitSha1) fail('SESSION_IDENTITY_MISMATCH')
  const actual = {
    runtime: runtimeDescriptor.runtime,
    host: { kind: runtimeDescriptor.host.kind, version: runtimeDescriptor.host.version, platform: runtimeDescriptor.host.platform, arch: runtimeDescriptor.host.arch },
    engine: { kind: runtimeDescriptor.engine.kind, version: sherpa.version, gitSha1: sherpa.gitSha1 },
    model: modelDescriptor.model,
    capabilities: runtimeDescriptor.capabilities,
  }
  identitiesEqual(actual, config.expected)
  if (!actual.capabilities.languageModes.includes(config.languageMode)) fail('SESSION_LANGUAGE_UNSUPPORTED')
  return deepFreeze({ identity: actual, languageMode: config.languageMode, recognizer: { configuration: modelDescriptor.configuration, modelPaths, wrapperPackageEntry: runtimePaths.wrapperPackageEntry } })
}

module.exports = { ProviderStartupError, decodeSessionConfig, loadVerifiedProviderSession, parseStartupArguments }
