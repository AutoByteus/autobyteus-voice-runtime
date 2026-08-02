import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { assertReleaseEvidence } from '../scripts/release-evidence.mjs'
import { sha256, writeJson } from '../scripts/file-utils.mjs'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)
const { decodeSessionConfig, parseStartupArguments, ProviderStartupError } = require('../runtime/providerSessionConfigV1.cjs')
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildCommit = 'a'.repeat(40)

test('canonical startup fixtures enforce schema 1 and reject protocol 0/unknown/traversal inputs', async () => {
  const valid = JSON.parse(await fs.readFile(path.join(projectRoot, 'startup/fixtures/valid/provider-session-config.json'), 'utf8'))
  assert.equal(decodeSessionConfig(valid).schemaVersion, 1)
  assert.equal(parseStartupArguments(['--session-config', '/tmp/config.json']), '/tmp/config.json')
  for (const name of ['unknown-field.json', 'traversal.json', 'protocol-zero.json']) {
    const invalid = JSON.parse(await fs.readFile(path.join(projectRoot, 'startup/fixtures/invalid', name), 'utf8'))
    assert.throws(() => decodeSessionConfig(invalid), ProviderStartupError)
  }
  for (const args of [[], ['--backend', 'mlx'], ['--session-config', 'relative.json'], ['--session-config', '/a', '--session-config', '/b']]) {
    assert.throws(() => parseStartupArguments(args), (error) => error.category === 'STARTUP_ARGUMENT_INVALID')
  }
})

test('dependency graph and repository contain no legacy production runtime', async () => {
  const packageLock = JSON.parse(await fs.readFile(path.join(projectRoot, 'package-lock.json'), 'utf8'))
  const root = packageLock.packages['']
  assert.equal(root.dependencies['sherpa-onnx-node'], '1.13.4')
  assert.equal(root.dependencies['opencc-js'], '1.4.1')
  for (const version of Object.values(root.optionalDependencies)) assert.equal(version, '1.13.4')
  const files = await listFiles(projectRoot)
  const legacy = files.filter((file) => /(?:voice_input_worker\.py|voice-input-worker\.(?:sh|cmd)|run_pip_ipv4\.py|requirements-(?:mlx|faster-whisper)\.txt)$/.test(file))
  assert.deepEqual(legacy, [])
  const runtimeSources = await Promise.all(files.filter((file) => file.startsWith('runtime/')).map((file) => fs.readFile(path.join(projectRoot, file), 'utf8')))
  const joined = runtimeSources.join('\n')
  assert.doesNotMatch(joined, /ELECTRON_RUN_AS_NODE|python|pip install|protocolVersion\s*[:=]\s*0/i)
})

test('release evidence gate is fail-closed and accepts only complete all-target proof', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'release-evidence-test-'))
  try {
    const blockedPath = path.join(projectRoot, 'evidence', 'release-evidence.example.json')
    await assert.rejects(() => assertReleaseEvidence(blockedPath, selectedModel()))
    const goodPath = path.join(root, 'good.json')
    await writeJson(goodPath, passingEvidence())
    assert.equal((await assertReleaseEvidence(goodPath, selectedModel())).decision, 'replace')
    const incomplete = passingEvidence()
    incomplete.targets.pop()
    await writeJson(path.join(root, 'incomplete.json'), incomplete)
    await assert.rejects(() => assertReleaseEvidence(path.join(root, 'incomplete.json'), selectedModel()))
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})

test('manifest generation emits schema 3 and fails closed on absent archive identities', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'manifest-v3-test-'))
  try {
    const dist = path.join(root, 'dist')
    await fs.mkdir(path.join(dist, 'descriptors'), { recursive: true })
    const metadata = JSON.parse(await fs.readFile(path.join(projectRoot, 'metadata/runtime-assets.json'), 'utf8'))
    for (const target of metadata.assets) {
      const archivePath = path.join(dist, target.fileName)
      await fs.writeFile(archivePath, `runtime-${target.platform}-${target.arch}`)
      await writeJson(path.join(dist, 'descriptors', `runtime-provider-${target.platform}-${target.arch}.json`), {
        runtime: { buildCommit }, host: { kind: 'bundled-node', version: metadata.host.version, executable: { path: target.hostExecutable, sha256: '1'.repeat(64) } }, worker: { entrypoint: { path: 'runtime/voice-input-worker.cjs', sha256: '2'.repeat(64) } },
      })
      await writeJson(`${archivePath}.proof.json`, { archiveSha256: await sha256(archivePath) })
    }
    const modelArchive = path.join(dist, 'voice-input-model-sensevoice-small-int8-2024-07-17.tar.gz')
    await fs.writeFile(modelArchive, 'model-archive')
    await writeJson(path.join(dist, 'descriptors', 'model-provider.json'), { model: selectedModel() })
    await writeJson(`${modelArchive}.proof.json`, { archiveSha256: await sha256(modelArchive) })
    const evidencePath = path.join(root, 'evidence.json')
    await writeJson(evidencePath, passingEvidence())
    const output = path.join(dist, 'manifest.json')
    await execFileAsync(process.execPath, [path.join(projectRoot, 'scripts/generate-manifest.mjs'), output], {
      env: { ...process.env, AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR: dist, AUTOBYTEUS_RELEASE_EVIDENCE_PATH: evidencePath, AUTOBYTEUS_RELEASE_COMMIT: buildCommit },
    })
    const manifest = JSON.parse(await fs.readFile(output, 'utf8'))
    assert.equal(manifest.schemaVersion, 3)
    assert.equal(manifest.runtimeAssets.length, 4)
    assert.deepEqual(manifest.startup.invocation.arguments, ['--session-config', '<absolute-config-path>'])
    assert.equal(manifest.selectedModel.id, selectedModel().id)
    await fs.rm(path.join(dist, metadata.assets[0].fileName))
    await assert.rejects(() => execFileAsync(process.execPath, [path.join(projectRoot, 'scripts/generate-manifest.mjs'), output], {
      env: { ...process.env, AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR: dist, AUTOBYTEUS_RELEASE_EVIDENCE_PATH: evidencePath, AUTOBYTEUS_RELEASE_COMMIT: buildCommit },
    }))
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})

function selectedModel() {
  return { id: 'sensevoice-small-int8-2024-07-17', version: '2024-07-17', modelType: 'sense-voice', sha256: 'c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51' }
}

function passingEvidence() {
  return {
    schemaVersion: 1, decision: 'replace', lane: 'AC-009', selectedModelId: selectedModel().id, selectedModelSha256: selectedModel().sha256, runnerCommit: buildCommit,
    corpus: { licensedRealSpeech: true, clipCount: 120, durationSeconds: 900, speakerCount: 3, environmentCount: 2 },
    licenseReview: { approved: true, reference: 'review-001' },
    targets: [['darwin', 'arm64'], ['darwin', 'x64'], ['linux', 'x64'], ['win32', 'x64']].map(([platform, arch]) => ({ platform, arch, passed: true })),
    gates: Object.fromEntries(['quality', 'normalization', 'handshakeLatency', 'coldReadinessLatency', 'warmLatency', 'coldLatency', 'loadedRss', 'installedSize', 'reproducibility', 'platformSmoke', 'noticesAndLicenses'].map((gate) => [gate, true])),
  }
}

async function listFiles(root) {
  const result = []
  async function visit(current, prefix) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'dist', '.work'].includes(entry.name)) continue
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) await visit(path.join(current, entry.name), relative)
      else result.push(relative)
    }
  }
  await visit(root, '')
  return result
}
