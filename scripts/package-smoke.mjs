#!/usr/bin/env node
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ProviderClient, materializeProviderSessionConfig } from '../benchmark/providerClient.mjs'
import { readJson, sha256, writeJson } from './file-utils.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = parseArgs(process.argv.slice(2))
const manifest = await readJson(args.manifest)
const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autobyteus-package-smoke-'))
const evidence = { schemaVersion: 1, platform: process.platform, arch: process.arch, preHello: [], protocol: {} }
try {
  const validConfigPath = path.join(workDir, 'valid-session.json')
  const materialized = await materializeProviderSessionConfig({ manifest, runtimeRoot: args.runtimeRoot, modelRoot: args.modelRoot, languageMode: 'zh', configPath: validConfigPath })
  const baseConfig = materialized.value
  const commands = commandPaths(manifest, args.runtimeRoot)
  evidence.preHello.push(await expectPreHello(commands, [], 'STARTUP_ARGUMENT_INVALID'))
  evidence.preHello.push(await expectPreHello(commands, ['--unknown', validConfigPath], 'STARTUP_ARGUMENT_INVALID'))
  evidence.preHello.push(await invalidConfigCase(commands, workDir, baseConfig, 'unknown-field', (value) => ({ ...value, backend: 'python' }), 'SESSION_CONFIG_INVALID'))
  evidence.preHello.push(await invalidConfigCase(commands, workDir, baseConfig, 'digest', (value) => ({ ...value, runtimeDescriptor: { ...value.runtimeDescriptor, sha256: '0'.repeat(64) } }), 'SESSION_ASSET_INVALID'))
  evidence.preHello.push(await invalidConfigCase(commands, workDir, baseConfig, 'identity', (value) => ({ ...value, expected: { ...value.expected, host: { ...value.expected.host, version: '0.0.0' } } }), 'SESSION_IDENTITY_MISMATCH'))
  evidence.preHello.push(await invalidConfigCase(commands, workDir, baseConfig, 'engine-identity', (value) => ({ ...value, expected: { ...value.expected, engine: { ...value.expected.engine, gitSha1: '0000000' } } }), 'SESSION_IDENTITY_MISMATCH'))
  evidence.preHello.push(await invalidConfigCase(commands, workDir, baseConfig, 'model-identity', (value) => ({ ...value, expected: { ...value.expected, model: { ...value.expected.model, sha256: '0'.repeat(64) } } }), 'SESSION_IDENTITY_MISMATCH'))
  evidence.preHello.push(await invalidConfigCase(commands, workDir, baseConfig, 'language', (value) => ({ ...value, languageMode: 'fr' }), 'SESSION_LANGUAGE_UNSUPPORTED'))
  evidence.preHello.push(await modelFileMismatchCase(commands, workDir, baseConfig, args.modelRoot))
  evidence.preHello.push(await escapingSymlinkCase(commands, workDir, baseConfig, args.runtimeRoot))

  const zh = await runTranscription(manifest, args, workDir, 'zh', args.zhWav)
  const en = await runTranscription(manifest, args, workDir, 'en', args.enWav)
  const silence = await runTranscription(manifest, args, workDir, 'zh', args.silenceWav)
  if (zh.response.outcome !== 'transcript' || !['zh', 'yue'].includes(zh.response.detectedLanguage)) throw new Error('Mandarin package smoke did not return a transcript.')
  if (en.response.outcome !== 'transcript' || en.response.detectedLanguage !== 'en') throw new Error('English package smoke did not return an English transcript.')
  if (silence.response.outcome !== 'no-speech' || silence.response.text !== '') throw new Error('No-speech package smoke did not return no-speech.')
  evidence.protocol = {
    handshakeMs: zh.start.handshakeMs,
    readinessMs: zh.start.readinessMs,
    mandarin: summarize(zh.response),
    english: summarize(en.response),
    noSpeech: summarize(silence.response),
    gracefulShutdown: true,
  }

  const malformedConfigPath = path.join(workDir, 'malformed-session.json')
  const malformedClient = new ProviderClient({ manifest, runtimeRoot: args.runtimeRoot, modelRoot: args.modelRoot, languageMode: 'zh', configPath: malformedConfigPath })
  await malformedClient.start()
  malformedClient.write({ type: 'legacy-transcribe', protocolVersion: 0 })
  await malformedClient.waitForExit(2000)
  if (!malformedClient.stderr.toString('utf8').includes('PROTOCOL_INVALID')) throw new Error('Malformed protocol input did not terminate safely.')
  evidence.protocol.malformedTerminates = true

  const restartConfigPath = path.join(workDir, 'restart-session.json')
  const restartClient = new ProviderClient({ manifest, runtimeRoot: args.runtimeRoot, modelRoot: args.modelRoot, languageMode: 'en', configPath: restartConfigPath })
  await restartClient.start()
  restartClient.process.kill('SIGKILL')
  await restartClient.waitForExit(2000)
  const recovered = new ProviderClient({ manifest, runtimeRoot: args.runtimeRoot, modelRoot: args.modelRoot, languageMode: 'en', configPath: path.join(workDir, 'recovered-session.json') })
  await recovered.start()
  await recovered.shutdown()
  evidence.protocol.cleanRestartAfterProcessLoss = true
  await writeJson(args.output, evidence)
  process.stdout.write(`${args.output}\n`)
} finally {
  await fs.rm(workDir, { recursive: true, force: true })
}

async function runTranscription(manifestValue, values, work, languageMode, audioPath) {
  const client = new ProviderClient({ manifest: manifestValue, runtimeRoot: values.runtimeRoot, modelRoot: values.modelRoot, languageMode, configPath: path.join(work, `${languageMode}-${path.basename(audioPath)}.json`) })
  const start = await client.start()
  const result = await client.transcribeFile(audioPath)
  await client.shutdown()
  if (result.response.type !== 'transcription-result') throw new Error(`Package smoke transcription failed with ${result.response.code}.`)
  return { start, response: result.response }
}

function summarize(response) {
  return { outcome: response.outcome, detectedLanguage: response.detectedLanguage, audioDurationMs: response.metrics.audioDurationMs, inferenceMs: response.metrics.inferenceMs }
}

async function invalidConfigCase(commands, work, base, name, mutate, category) {
  const configPath = path.join(work, `${name}.json`)
  await writeJson(configPath, mutate(structuredClone(base)))
  return expectPreHello(commands, ['--session-config', configPath], category)
}

async function escapingSymlinkCase(commands, work, base, runtimeRoot) {
  const fakeRoot = path.join(work, 'escaping-root')
  await fs.mkdir(path.join(fakeRoot, 'metadata'), { recursive: true })
  await fs.symlink(path.join(runtimeRoot, base.runtimeDescriptor.path), path.join(fakeRoot, 'metadata', 'runtime-provider.json'))
  const configPath = path.join(work, 'escaping-symlink.json')
  await writeJson(configPath, { ...base, runtimeRoot: fakeRoot })
  return expectPreHello(commands, ['--session-config', configPath], 'SESSION_PATH_INVALID')
}

async function modelFileMismatchCase(commands, work, base, modelRoot) {
  const descriptor = await readJson(path.join(modelRoot, base.modelDescriptor.path))
  const identityKey = descriptor.configuration.type === 'sense-voice' ? 'model' : 'encoder'
  descriptor.configuration.files[identityKey].sha256 = '0'.repeat(64)
  descriptor.model.sha256 = '0'.repeat(64)
  const relativePath = 'metadata/model-provider-invalid-file.json'
  const descriptorPath = path.join(modelRoot, relativePath)
  await writeJson(descriptorPath, descriptor)
  const configPath = path.join(work, 'model-file-digest.json')
  await writeJson(configPath, { ...base, modelDescriptor: { path: relativePath, sha256: await sha256(descriptorPath) }, expected: { ...base.expected, model: descriptor.model } })
  return expectPreHello(commands, ['--session-config', configPath], 'SESSION_ASSET_INVALID')
}

function expectPreHello(commands, workerArgs, category) {
  return new Promise((resolve, reject) => {
    const child = spawn(commands.host, [commands.entrypoint, ...workerArgs], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
    let stdout = Buffer.alloc(0)
    let stderr = Buffer.alloc(0)
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`Pre-hello case ${category} timed out.`)) }, 5000)
    child.stdout.on('data', (chunk) => { stdout = Buffer.concat([stdout, chunk]) })
    child.stderr.on('data', (chunk) => { stderr = Buffer.concat([stderr, chunk]).subarray(-64 * 1024) })
    child.on('exit', (code) => {
      clearTimeout(timer)
      if (code === 0 || stdout.length !== 0 || !stderr.toString('utf8').includes(category)) reject(new Error(`Pre-hello case ${category} did not fail safely.`))
      else resolve({ category, noProtocolStdout: true })
    })
  })
}

function commandPaths(manifestValue, runtimeRoot) {
  const asset = manifestValue.runtimeAssets.find((value) => value.platform === process.platform && value.arch === process.arch)
  if (!asset) throw new Error('Candidate manifest has no current-host runtime asset.')
  return { host: path.resolve(runtimeRoot, ...asset.hostExecutable.split('/')), entrypoint: path.resolve(runtimeRoot, ...asset.entrypoint.split('/')) }
}

function parseArgs(values) {
  const parsed = {}
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index]
    const value = values[index + 1]
    if (!key?.startsWith('--') || !value) throw new Error('Package smoke arguments must be --name value pairs.')
    parsed[key.slice(2)] = path.resolve(value)
  }
  for (const key of ['manifest', 'runtimeRoot', 'modelRoot', 'zhWav', 'enWav', 'silenceWav', 'output']) if (!parsed[key]) throw new Error(`Missing --${key}.`)
  return parsed
}
