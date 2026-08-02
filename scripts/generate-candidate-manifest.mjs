#!/usr/bin/env node
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { readJson, sha256, writeJson } from './file-utils.mjs'

const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.resolve(process.env.AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR || path.join(projectRoot, 'dist'))
const platform = process.argv[2]
const arch = process.argv[3]
if (!platform || !arch || process.argv.length !== 4) throw new Error('Usage: generate-candidate-manifest.mjs <platform> <arch>')
const metadata = await readJson(path.join(projectRoot, 'metadata', 'runtime-assets.json'))
const modelCatalog = await readJson(path.join(projectRoot, 'metadata', 'model-candidates.json'))
const target = metadata.assets.find((asset) => asset.platform === platform && asset.arch === arch)
if (!target) throw new Error('Unsupported candidate target.')
const runtimeDescriptorPath = path.join(distDir, 'descriptors', `runtime-provider-${platform}-${arch}.json`)
const modelDescriptorPath = path.join(distDir, 'descriptors', 'model-provider.json')
const runtimeDescriptor = await readJson(runtimeDescriptorPath)
const modelDescriptor = await readJson(modelDescriptorPath)
const modelSource = modelCatalog.candidates.find((candidate) => candidate.model.id === modelDescriptor.model.id)
if (!modelSource) throw new Error('Model descriptor is not a reviewed benchmark candidate.')
const buildCommit = process.env.AUTOBYTEUS_BUILD_COMMIT || (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot })).stdout.trim()
if (runtimeDescriptor.runtime.buildCommit !== buildCommit) throw new Error('Candidate descriptor commit mismatch.')
const manifest = {
  candidateManifestSchemaVersion: 1,
  runtimeId: metadata.runtime.id,
  runtimeVersion: metadata.runtime.version,
  releaseCommit: buildCommit,
  protocol: { version: 1 },
  startup: { providerSessionConfigVersion: 1, invocation: { arguments: ['--session-config', '<absolute-config-path>'] } },
  capabilities: metadata.capabilities,
  selectedModel: modelDescriptor.model,
  runtimeAssets: [{
    platform, arch,
    fileName: target.fileName,
    archiveFormat: target.archiveFormat,
    hostKind: runtimeDescriptor.host.kind,
    hostExecutable: runtimeDescriptor.host.executable.path,
    hostVersion: runtimeDescriptor.host.version,
    hostSha256: runtimeDescriptor.host.executable.sha256,
    entrypoint: runtimeDescriptor.worker.entrypoint.path,
    runtimeDescriptor: { path: 'metadata/runtime-provider.json', sha256: await sha256(runtimeDescriptorPath) },
  }],
  modelAsset: {
    fileName: modelSource.outputFileName,
    archiveFormat: 'tar.gz',
    descriptor: { path: 'metadata/model-provider.json', sha256: await sha256(modelDescriptorPath) },
  },
  dependencies: { host: metadata.host, engine: metadata.engine, normalization: metadata.normalization },
}
const outputPath = path.join(distDir, `candidate-manifest-${platform}-${arch}.json`)
await writeJson(outputPath, manifest)
process.stdout.write(`${outputPath}\n`)
