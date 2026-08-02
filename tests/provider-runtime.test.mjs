import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { ProviderClient, materializeProviderSessionConfig } from '../benchmark/providerClient.mjs'
import { createPackageFixture, writePcmWav } from './helpers/packageFixture.mjs'
import { writeJson } from '../scripts/file-utils.mjs'

let root
let fixture
let speechPath
let silencePath

test.before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-provider-test-'))
  fixture = await createPackageFixture(root)
  speechPath = path.join(root, 'speech.wav')
  silencePath = path.join(root, 'silence.wav')
  await writePcmWav(speechPath)
  await writePcmWav(silencePath, { amplitude: 0 })
})

test.after(async () => fs.rm(root, { recursive: true, force: true }))

test('packaged command binds verified identity, transcribes, detects no-speech, and shuts down', async () => {
  const client = new ProviderClient({ manifest: fixture.manifest, runtimeRoot: fixture.runtimeRoot, modelRoot: fixture.modelRoot, languageMode: 'zh', configPath: path.join(root, 'valid.json') })
  const start = await client.start()
  assert.ok(start.handshakeMs >= 0)
  assert.ok(start.readinessMs >= 0)
  const speech = await client.transcribeFile(speechPath)
  assert.equal(speech.response.type, 'transcription-result')
  assert.equal(speech.response.outcome, 'transcript')
  assert.equal(speech.response.text, '测试，完成。')
  assert.equal(speech.response.detectedLanguage, 'zh')
  const silence = await client.transcribeFile(silencePath)
  assert.equal(silence.response.outcome, 'no-speech')
  assert.equal(silence.response.text, '')
  await client.shutdown()
  assert.equal(client.state, 'stopped')
})

test('worker fails before protocol stdout for strict startup categories', async () => {
  const configPath = path.join(root, 'base.json')
  const { value } = await materializeProviderSessionConfig({ manifest: fixture.manifest, runtimeRoot: fixture.runtimeRoot, modelRoot: fixture.modelRoot, languageMode: 'zh', configPath })
  await assertPreHello([], 'STARTUP_ARGUMENT_INVALID')
  await assertPreHello(['--unknown', configPath], 'STARTUP_ARGUMENT_INVALID')
  await invalidCase(value, 'unknown', (config) => ({ ...config, backend: 'python' }), 'SESSION_CONFIG_INVALID')
  await invalidCase(value, 'digest', (config) => ({ ...config, modelDescriptor: { ...config.modelDescriptor, sha256: '0'.repeat(64) } }), 'SESSION_ASSET_INVALID')
  await invalidCase(value, 'identity', (config) => ({ ...config, expected: { ...config.expected, runtime: { ...config.expected.runtime, version: '9.9.9' } } }), 'SESSION_IDENTITY_MISMATCH')
  await invalidCase(value, 'language', (config) => ({ ...config, languageMode: 'fr' }), 'SESSION_LANGUAGE_UNSUPPORTED')
  const fakeRoot = path.join(root, 'escape-root')
  await fs.mkdir(path.join(fakeRoot, 'metadata'), { recursive: true })
  await fs.symlink(fixture.runtimeDescriptorPath, path.join(fakeRoot, 'metadata', 'runtime-provider.json'))
  await invalidCase(value, 'escape', (config) => ({ ...config, runtimeRoot: fakeRoot }), 'SESSION_PATH_INVALID')
})

test('protocol rejects request language overrides and protocol zero without a dual path', async () => {
  for (const invalidMessage of [
    { type: 'transcribe-file', protocolVersion: 1, requestId: crypto.randomUUID(), audioPath: speechPath, languageMode: 'en' },
    { type: 'transcribe-file', protocolVersion: 0, requestId: crypto.randomUUID(), audioPath: speechPath },
  ]) {
    const client = new ProviderClient({ manifest: fixture.manifest, runtimeRoot: fixture.runtimeRoot, modelRoot: fixture.modelRoot, languageMode: 'zh', configPath: path.join(root, `invalid-protocol-${invalidMessage.protocolVersion}-${Object.keys(invalidMessage).length}.json`) })
    await client.start()
    client.write(invalidMessage)
    await client.waitForExit(2000)
    assert.match(client.stderr.toString('utf8'), /PROTOCOL_INVALID/)
    assert.equal(client.state, 'failed')
  }
})

async function invalidCase(base, name, mutate, category) {
  const configPath = path.join(root, `${name}.json`)
  await writeJson(configPath, mutate(structuredClone(base)))
  await assertPreHello(['--session-config', configPath], category)
}

function assertPreHello(workerArgs, category) {
  const entrypoint = path.join(fixture.runtimeRoot, 'runtime', 'voice-input-worker.cjs')
  return new Promise((resolve, reject) => {
    const child = spawn(fixture.hostPath, [entrypoint, ...workerArgs], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`${category} case timed out.`)) }, 3000)
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('exit', (code) => {
      clearTimeout(timer)
      try {
        assert.notEqual(code, 0)
        assert.equal(stdout, '')
        assert.match(stderr, new RegExp(category))
        resolve()
      } catch (error) { reject(error) }
    })
  })
}
