#!/usr/bin/env node
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { assertReleaseEvidence } from './release-evidence.mjs'
import { copyFileWithMode, copyTree, createTarGz, fileSize, readJson, sha256, writeJson } from './file-utils.mjs'

const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.resolve(process.env.AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR || path.join(projectRoot, 'dist'))
const metadata = await readJson(path.join(projectRoot, 'metadata', 'runtime-assets.json'))
const modelCatalog = await readJson(path.join(projectRoot, 'metadata', 'model-candidates.json'))
const runtimeVersion = process.env.AUTOBYTEUS_VOICE_RUNTIME_VERSION || metadata.runtime.version
const releaseCommit = process.env.AUTOBYTEUS_RELEASE_COMMIT || (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot })).stdout.trim()
const releaseRepository = process.env.AUTOBYTEUS_RELEASE_REPOSITORY || 'AutoByteus/autobyteus-voice-runtime'
const releaseTag = process.env.AUTOBYTEUS_RELEASE_TAG || `v${runtimeVersion}`
const evidencePath = path.resolve(process.env.AUTOBYTEUS_RELEASE_EVIDENCE_PATH || path.join(projectRoot, 'evidence', 'release-evidence.json'))
const outputPath = path.resolve(process.argv[2] || path.join(distDir, 'voice-input-runtime-manifest.json'))
if (!/^[a-f0-9]{40}$/.test(releaseCommit)) throw new Error('Release commit must be a full Git SHA.')
if (runtimeVersion !== metadata.runtime.version) throw new Error('Release version does not match runtime package identity.')
const evidenceInput = await readJson(evidencePath)
const evidenceCandidate = modelCatalog.candidates.find((candidate) => candidate.model.id === evidenceInput.selectedModelId)
if (!evidenceCandidate) throw new Error('Release evidence selects an unknown model candidate.')
const evidence = await assertReleaseEvidence(evidencePath, evidenceCandidate.model)
const modelSource = evidenceCandidate

function releaseUrl(fileName) {
  return `https://github.com/${releaseRepository}/releases/download/${releaseTag}/${fileName}`
}

async function publishableAsset(sourcePath, fileName = path.basename(sourcePath)) {
  const destination = path.join(distDir, fileName)
  if (path.resolve(sourcePath) !== path.resolve(destination)) await copyFileWithMode(sourcePath, destination)
  return { fileName, url: releaseUrl(fileName), sha256: await sha256(destination), size: await fileSize(destination) }
}

const protocolSchema = await publishableAsset(path.join(projectRoot, 'protocol', 'voice-input-protocol-v1.schema.json'))
const startupSchema = await publishableAsset(path.join(projectRoot, 'startup', 'provider-session-config-v1.schema.json'))
const releaseEvidence = await publishableAsset(evidencePath, 'voice-input-release-evidence.json')
const contractFixtures = await buildContractAsset()
const modelDescriptorPath = path.join(distDir, 'descriptors', 'model-provider.json')
const modelDescriptor = await readJson(modelDescriptorPath)
if (modelDescriptor.model.id !== evidence.selectedModelId || modelDescriptor.model.sha256 !== evidence.selectedModelSha256) throw new Error('Packaged model descriptor does not match release evidence.')
const modelArchivePath = path.join(distDir, modelSource.outputFileName)
const modelProof = await readJson(`${modelArchivePath}.proof.json`)
if (modelProof.archiveSha256 !== await sha256(modelArchivePath)) throw new Error('Model package proof does not match archive.')

const runtimeAssets = []
for (const asset of metadata.assets) {
  const archivePath = path.join(distDir, asset.fileName)
  const proof = await readJson(`${archivePath}.proof.json`)
  const descriptorPath = path.join(distDir, 'descriptors', `runtime-provider-${asset.platform}-${asset.arch}.json`)
  const descriptor = await readJson(descriptorPath)
  if (proof.archiveSha256 !== await sha256(archivePath) || descriptor.runtime.buildCommit !== releaseCommit) throw new Error(`Runtime proof mismatch for ${asset.platform}/${asset.arch}.`)
  runtimeAssets.push({
    platform: asset.platform,
    arch: asset.arch,
    ...(await publishableAsset(archivePath)),
    archiveFormat: asset.archiveFormat,
    hostKind: descriptor.host.kind,
    hostExecutable: descriptor.host.executable.path,
    hostVersion: descriptor.host.version,
    hostSha256: descriptor.host.executable.sha256,
    entrypoint: descriptor.worker.entrypoint.path,
    runtimeDescriptor: { path: 'metadata/runtime-provider.json', sha256: await sha256(descriptorPath) },
  })
}

const noticePaths = ['THIRD_PARTY_NOTICES.md', ...((await fs.readdir(path.join(projectRoot, 'licenses'))).sort().map((name) => `licenses/${name}`))]
const notices = []
for (const relativePath of noticePaths) notices.push(await publishableAsset(path.join(projectRoot, relativePath), relativePath.replaceAll('/', '-')))
const manifest = {
  schemaVersion: 3,
  runtimeId: metadata.runtime.id,
  runtimeVersion,
  releaseCommit,
  protocol: { version: 1, schema: protocolSchema },
  startup: { providerSessionConfigVersion: 1, schema: startupSchema, invocation: { arguments: ['--session-config', '<absolute-config-path>'] } },
  capabilities: metadata.capabilities,
  selectedModel: modelDescriptor.model,
  runtimeAssets,
  modelAsset: {
    ...(await publishableAsset(modelArchivePath)),
    archiveFormat: 'tar.gz',
    descriptor: { path: 'metadata/model-provider.json', sha256: await sha256(modelDescriptorPath) },
  },
  dependencies: {
    host: { kind: metadata.host.kind, version: metadata.host.version },
    engine: metadata.engine,
    normalization: metadata.normalization,
  },
  notices,
  contractFixtures,
  releaseEvidence,
}
await writeJson(outputPath, manifest)
process.stdout.write(`${outputPath}\n`)

async function buildContractAsset() {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-runtime-contracts-'))
  try {
    await copyTree(path.join(projectRoot, 'protocol'), path.join(work, 'protocol'))
    await copyTree(path.join(projectRoot, 'startup'), path.join(work, 'startup'))
    await copyFileWithMode(path.join(projectRoot, 'metadata', 'runtime-manifest-v3.schema.json'), path.join(work, 'runtime-manifest-v3.schema.json'))
    const archivePath = path.join(distDir, 'voice-input-runtime-contracts-v1.tar.gz')
    await createTarGz(work, archivePath)
    return publishableAsset(archivePath)
  } finally { await fs.rm(work, { recursive: true, force: true }) }
}
