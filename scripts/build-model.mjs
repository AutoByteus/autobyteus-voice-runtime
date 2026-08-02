#!/usr/bin/env node
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertDigest, copyFileWithMode, createTarGz, download, extractArchive, readJson, sha256, writeJson } from './file-utils.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalog = await readJson(path.join(projectRoot, 'metadata', 'model-candidates.json'))
const candidateId = process.argv[2] || 'sensevoice-small-int8-2024-07-17'
const source = catalog.candidates.find((candidate) => candidate.model.id === candidateId)
if (!source) throw new Error(`Unknown model candidate ${candidateId}.`)
const distDir = path.resolve(process.env.AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR || path.join(projectRoot, 'dist'))
const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autobyteus-model-'))
try {
  const archivePath = process.env.AUTOBYTEUS_MODEL_SOURCE_ARCHIVE_PATH || path.join(workDir, source.archive.fileName)
  if (!process.env.AUTOBYTEUS_MODEL_SOURCE_ARCHIVE_PATH) await download(source.archive.url, archivePath)
  await assertDigest(archivePath, source.archive.sha256, `${source.model.id} source archive`)
  const extracted = path.join(workDir, 'source')
  await extractArchive(archivePath, extracted)
  const staging = path.join(workDir, 'staging')
  await fs.mkdir(path.join(staging, 'metadata'), { recursive: true })
  for (const [name, identity] of Object.entries(source.files)) {
    const sourceFile = await findFile(extracted, path.basename(identity.path))
    await assertDigest(sourceFile, identity.sha256, `${source.model.id} ${name}`)
    await copyFileWithMode(sourceFile, path.join(staging, identity.path))
  }
  const notices = []
  for (const name of source.notices) {
    const relativePath = `licenses/${name}`
    await copyFileWithMode(path.join(projectRoot, relativePath), path.join(staging, relativePath))
    notices.push({ path: relativePath, sha256: await sha256(path.join(staging, relativePath)) })
  }
  const descriptor = {
    schemaVersion: 1,
    model: { id: source.model.id, version: source.model.version, modelType: source.model.modelType, sha256: source.model.sha256 },
    configuration: {
      type: source.recognizer.type,
      files: source.files,
      sampleRate: source.recognizer.sampleRate,
      featureDim: source.recognizer.featureDim,
      numThreads: source.recognizer.numThreads,
      provider: source.recognizer.provider,
      useInverseTextNormalization: source.recognizer.useInverseTextNormalization,
    },
    notices,
  }
  const descriptorPath = path.join(staging, 'metadata', 'model-provider.json')
  await writeJson(descriptorPath, descriptor)
  await writeJson(path.join(distDir, 'descriptors', 'model-provider.json'), descriptor)
  const outputPath = path.join(distDir, source.outputFileName)
  await createTarGz(staging, outputPath)
  await writeJson(`${outputPath}.proof.json`, {
    schemaVersion: 1,
    model: descriptor.model,
    archiveSha256: await sha256(outputPath),
    modelDescriptorSha256: await sha256(descriptorPath),
    sourceArchiveSha256: source.archive.sha256,
  })
  process.stdout.write(`${outputPath}\n`)
} finally {
  await fs.rm(workDir, { recursive: true, force: true })
}

async function findFile(root, name) {
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)
    if (entry.isFile() && entry.name === name) return target
    if (entry.isDirectory()) {
      const found = await findFile(target, name).catch(() => undefined)
      if (found) return found
    }
  }
  throw new Error(`Model archive does not contain ${name}.`)
}
