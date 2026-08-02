#!/usr/bin/env node
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import {
  assertDigest, copyFileWithMode, copyTree, createTarGz, download,
  extractArchive, readJson, sha256, writeJson,
} from './file-utils.mjs'

const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const metadata = await readJson(path.join(projectRoot, 'metadata', 'runtime-assets.json'))
const platform = process.argv[2]
const arch = process.argv[3]
if (!platform || !arch || process.argv.length !== 4) throw new Error('Usage: build-runtime.mjs <platform> <arch>')
const asset = metadata.assets.find((candidate) => candidate.platform === platform && candidate.arch === arch)
if (!asset) throw new Error(`Unsupported runtime target ${platform}/${arch}.`)
if (process.platform !== platform || process.arch !== arch) throw new Error(`Runtime package must be built on its target (${platform}/${arch}).`)
const buildCommit = process.env.AUTOBYTEUS_BUILD_COMMIT || (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot })).stdout.trim()
if (!/^[a-f0-9]{40}$/.test(buildCommit)) throw new Error('AUTOBYTEUS_BUILD_COMMIT must be a full Git SHA.')

const distDir = path.resolve(process.env.AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR || path.join(projectRoot, 'dist'))
const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `autobyteus-runtime-${platform}-${arch}-`))
try {
  const archivePath = process.env.AUTOBYTEUS_NODE_ARCHIVE_PATH || path.join(workDir, asset.hostArchive.fileName)
  if (!process.env.AUTOBYTEUS_NODE_ARCHIVE_PATH) await download(asset.hostArchive.url, archivePath)
  await assertDigest(archivePath, asset.hostArchive.sha256, 'Bundled Node archive')
  const extracted = path.join(workDir, 'node')
  await extractArchive(archivePath, extracted)
  const sourceHost = await findNamedFile(extracted, platform === 'win32' ? 'node.exe' : 'node', platform === 'win32' ? undefined : 'bin')
  const sourceLicense = await findNamedFile(extracted, 'LICENSE')
  const staging = path.join(workDir, 'staging')
  await fs.mkdir(staging, { recursive: true })
  await copyFileWithMode(sourceHost, path.join(staging, ...asset.hostExecutable.split('/')), 0o755)
  await copyFileWithMode(sourceLicense, path.join(staging, 'licenses', 'NODE-LICENSE.txt'))
  for (const sourceFolder of ['runtime', 'protocol', 'startup', 'licenses']) await copyTree(path.join(projectRoot, sourceFolder), path.join(staging, sourceFolder))
  for (const sourceFile of ['package.json', 'package-lock.json', 'THIRD_PARTY_NOTICES.md']) await copyFileWithMode(path.join(projectRoot, sourceFile), path.join(staging, sourceFile))
  for (const dependency of ['sherpa-onnx-node', asset.nativePackage, 'opencc-js']) {
    await verifyDependency(dependency, dependency === 'opencc-js' ? metadata.normalization.version : metadata.engine.wrapperVersion)
    await copyTree(path.join(projectRoot, 'node_modules', dependency), path.join(staging, 'node_modules', dependency))
  }
  const descriptor = await makeRuntimeDescriptor(staging, asset, buildCommit)
  const descriptorPath = path.join(staging, 'metadata', 'runtime-provider.json')
  await writeJson(descriptorPath, descriptor)
  const sidecarPath = path.join(distDir, 'descriptors', `runtime-provider-${platform}-${arch}.json`)
  await writeJson(sidecarPath, descriptor)
  const outputPath = path.join(distDir, asset.fileName)
  await createTarGz(staging, outputPath)
  await writeJson(`${outputPath}.proof.json`, {
    schemaVersion: 1, platform, arch, buildCommit,
    archiveSha256: await sha256(outputPath),
    runtimeDescriptorSha256: await sha256(descriptorPath),
    hostExecutableSha256: descriptor.host.executable.sha256,
    entrypointSha256: descriptor.worker.entrypoint.sha256,
  })
  process.stdout.write(`${outputPath}\n`)
} finally {
  await fs.rm(workDir, { recursive: true, force: true })
}

async function findNamedFile(root, name, parentName) {
  const entries = await fs.readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    const target = path.join(root, entry.name)
    if (entry.isFile() && entry.name === name && (!parentName || path.basename(path.dirname(target)) === parentName)) return target
    if (entry.isDirectory()) {
      const found = await findNamedFile(target, name, parentName).catch(() => undefined)
      if (found) return found
    }
  }
  throw new Error(`Archive does not contain ${name}.`)
}

async function verifyDependency(packageName, expectedVersion) {
  const packagePath = path.join(projectRoot, 'node_modules', packageName, 'package.json')
  const value = await readJson(packagePath)
  if (value.name !== packageName || value.version !== expectedVersion) throw new Error(`Dependency ${packageName}@${expectedVersion} is not installed exactly.`)
}

async function describedAsset(staging, relativePath) {
  const filePath = path.join(staging, ...relativePath.split('/'))
  return { path: relativePath, sha256: await sha256(filePath) }
}

async function makeRuntimeDescriptor(staging, target, buildCommit) {
  const wrapperRoot = 'node_modules/sherpa-onnx-node'
  const nativeRoot = `node_modules/${target.nativePackage}`
  return {
    schemaVersion: 1,
    runtime: { id: metadata.runtime.id, version: metadata.runtime.version, buildCommit },
    host: { kind: metadata.host.kind, version: metadata.host.version, platform: target.platform, arch: target.arch, executable: await describedAsset(staging, target.hostExecutable) },
    worker: { entrypoint: await describedAsset(staging, 'runtime/voice-input-worker.cjs') },
    protocol: { version: 1, schema: await describedAsset(staging, 'protocol/voice-input-protocol-v1.schema.json') },
    engine: {
      kind: metadata.engine.kind, version: metadata.engine.version, gitSha1: metadata.engine.gitSha1,
      wrapper: { packageName: metadata.engine.wrapperPackage, version: metadata.engine.wrapperVersion, packageMetadata: await describedAsset(staging, `${wrapperRoot}/package.json`), packageEntry: await describedAsset(staging, `${wrapperRoot}/sherpa-onnx.js`) },
      native: { packageName: target.nativePackage, version: metadata.engine.version, packageMetadata: await describedAsset(staging, `${nativeRoot}/package.json`), binary: await describedAsset(staging, target.nativeBinary) },
    },
    normalization: { packageName: metadata.normalization.packageName, version: metadata.normalization.version, packageMetadata: await describedAsset(staging, 'node_modules/opencc-js/package.json') },
    capabilities: metadata.capabilities,
  }
}
