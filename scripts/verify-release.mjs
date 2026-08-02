#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { assertReleaseEvidence } from './release-evidence.mjs'
import { fileSize, readJson, sha256 } from './file-utils.mjs'

const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.resolve(process.env.AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR || path.join(projectRoot, 'dist'))
const manifestPath = path.resolve(process.argv[2] || path.join(distDir, 'voice-input-runtime-manifest.json'))
const manifest = await readJson(manifestPath)
exactFields(manifest, ['schemaVersion', 'runtimeId', 'runtimeVersion', 'releaseCommit', 'protocol', 'startup', 'capabilities', 'selectedModel', 'runtimeAssets', 'modelAsset', 'dependencies', 'notices', 'contractFixtures', 'releaseEvidence'])
if (manifest.schemaVersion !== 3 || manifest.runtimeId !== 'voice-input' || !/^[a-f0-9]{40}$/.test(manifest.releaseCommit)) throw new Error('Manifest identity is invalid.')
if (manifest.protocol?.version !== 1 || manifest.startup?.providerSessionConfigVersion !== 1 || JSON.stringify(manifest.startup.invocation?.arguments) !== JSON.stringify(['--session-config', '<absolute-config-path>'])) throw new Error('Manifest startup/protocol contract is invalid.')
if (!Array.isArray(manifest.runtimeAssets) || manifest.runtimeAssets.length !== 4) throw new Error('Manifest must contain exactly four runtime assets.')
const evidencePath = await verifyAsset(manifest.releaseEvidence)
await assertReleaseEvidence(evidencePath, manifest.selectedModel)
await verifyAsset(manifest.protocol.schema)
await verifyAsset(manifest.startup.schema)
for (const notice of manifest.notices) await verifyAsset(notice)
const contractPath = await verifyAsset(manifest.contractFixtures)
const contractEntries = await archiveEntries(contractPath)
for (const required of ['runtime-manifest-v3.schema.json', 'protocol/voice-input-protocol-v1.schema.json', 'startup/provider-session-config-v1.schema.json']) if (!contractEntries.includes(required)) throw new Error(`Contract archive is missing ${required}.`)

const requiredTargets = new Set(['darwin-arm64', 'darwin-x64', 'linux-x64', 'win32-x64'])
for (const asset of manifest.runtimeAssets) {
  const target = `${asset.platform}-${asset.arch}`
  if (!requiredTargets.delete(target)) throw new Error(`Duplicate or unsupported runtime target ${target}.`)
  if (asset.hostKind !== 'bundled-node' || asset.entrypoint !== 'runtime/voice-input-worker.cjs' || asset.archiveFormat !== 'tar.gz') throw new Error(`Runtime command contract is invalid for ${target}.`)
  const archivePath = await verifyAsset(asset)
  const entries = await archiveEntries(archivePath)
  assertSafeEntries(entries)
  for (const required of [asset.hostExecutable, asset.entrypoint, asset.runtimeDescriptor.path, 'protocol/voice-input-protocol-v1.schema.json', 'startup/provider-session-config-v1.schema.json', 'THIRD_PARTY_NOTICES.md']) {
    if (!entries.includes(required)) throw new Error(`Runtime ${target} is missing ${required}.`)
  }
  if (entries.some((entry) => /(?:^|\/)(?:voice_input_worker\.py|voice-input-worker\.(?:sh|cmd)|run_pip_ipv4\.py|requirements-(?:mlx|faster-whisper)\.txt)$/.test(entry))) throw new Error(`Runtime ${target} contains a legacy production path.`)
  const descriptorBytes = await archiveFile(archivePath, asset.runtimeDescriptor.path)
  if (digestBytes(descriptorBytes) !== asset.runtimeDescriptor.sha256) throw new Error(`Runtime descriptor mismatch for ${target}.`)
  const descriptor = JSON.parse(descriptorBytes.toString('utf8'))
  if (descriptor.runtime.buildCommit !== manifest.releaseCommit || descriptor.host.executable.path !== asset.hostExecutable || descriptor.worker.entrypoint.path !== asset.entrypoint) throw new Error(`Runtime descriptor identity mismatch for ${target}.`)
}
if (requiredTargets.size !== 0) throw new Error('Manifest runtime target coverage is incomplete.')
const modelArchivePath = await verifyAsset(manifest.modelAsset)
const modelEntries = await archiveEntries(modelArchivePath)
assertSafeEntries(modelEntries)
if (!modelEntries.includes(manifest.modelAsset.descriptor.path)) throw new Error('Model archive lacks its descriptor.')
const modelDescriptorBytes = await archiveFile(modelArchivePath, manifest.modelAsset.descriptor.path)
if (digestBytes(modelDescriptorBytes) !== manifest.modelAsset.descriptor.sha256) throw new Error('Model descriptor digest mismatch.')
const modelDescriptor = JSON.parse(modelDescriptorBytes.toString('utf8'))
if (JSON.stringify(modelDescriptor.model) !== JSON.stringify(manifest.selectedModel) || !['sense-voice', 'whisper'].includes(modelDescriptor.configuration?.type)) throw new Error('Selected model identity mismatch.')
if (!Array.isArray(modelDescriptor.notices) || modelDescriptor.notices.length < 1) throw new Error('Model notices are incomplete.')
process.stdout.write(`Verified ${manifestPath}\n`)

async function verifyAsset(asset) {
  if (!asset || typeof asset.fileName !== 'string' || !/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isInteger(asset.size) || asset.size < 1) throw new Error('Manifest asset identity is invalid.')
  const filePath = path.resolve(distDir, asset.fileName)
  if (path.dirname(filePath) !== distDir) throw new Error('Manifest asset path is not flat and contained.')
  if (await sha256(filePath) !== asset.sha256 || await fileSize(filePath) !== asset.size) throw new Error(`Manifest asset ${asset.fileName} failed integrity verification.`)
  if (typeof asset.url !== 'string' || !asset.url.endsWith(`/${asset.fileName}`)) throw new Error(`Manifest asset URL mismatch for ${asset.fileName}.`)
  return filePath
}

async function archiveEntries(archivePath) {
  const { stdout } = await execFileAsync('tar', ['-tzf', archivePath], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  return stdout.split('\n').filter(Boolean).map((entry) => entry.replace(/^\.\//, '').replace(/\/$/, '')).filter(Boolean)
}

function assertSafeEntries(entries) {
  for (const entry of entries) if (path.posix.isAbsolute(entry) || path.posix.normalize(entry) !== entry || entry === '..' || entry.startsWith('../')) throw new Error('Archive contains an unsafe path.')
}

async function archiveFile(archivePath, relativePath) {
  const result = await execFileAsync('tar', ['-xOzf', archivePath, relativePath], { encoding: 'buffer', maxBuffer: 4 * 1024 * 1024 })
  return result.stdout
}

function digestBytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

function exactFields(value, fields) {
  const actual = Object.keys(value).sort()
  const expected = [...fields].sort()
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) throw new Error('Manifest has unknown or missing fields.')
}
