#!/usr/bin/env node
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertDigest, copyFileWithMode, download, extractArchive, readJson } from './file-utils.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalog = await readJson(path.join(projectRoot, 'metadata', 'model-candidates.json'))
const source = catalog.candidates.find((candidate) => candidate.model.id === 'sensevoice-small-int8-2024-07-17')
const output = path.resolve(process.argv[2] || 'dist/smoke-fixtures')
const work = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-smoke-fixtures-'))
try {
  const archive = process.env.AUTOBYTEUS_MODEL_SOURCE_ARCHIVE_PATH || path.join(work, source.archive.fileName)
  if (!process.env.AUTOBYTEUS_MODEL_SOURCE_ARCHIVE_PATH) await download(source.archive.url, archive)
  await assertDigest(archive, source.archive.sha256, 'SenseVoice source archive')
  const extracted = path.join(work, 'source')
  await extractArchive(archive, extracted)
  await fs.mkdir(output, { recursive: true })
  for (const language of ['en', 'zh']) await copyFileWithMode(await findFile(extracted, `${language}.wav`, 'test_wavs'), path.join(output, `${language}.wav`))
  await writeSilence(path.join(output, 'silence.wav'))
  process.stdout.write(`${output}\n`)
} finally { await fs.rm(work, { recursive: true, force: true }) }

async function findFile(root, name, parent) {
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)
    if (entry.isFile() && entry.name === name && path.basename(path.dirname(target)) === parent) return target
    if (entry.isDirectory()) {
      const found = await findFile(target, name, parent).catch(() => undefined)
      if (found) return found
    }
  }
  throw new Error(`Source archive does not contain ${parent}/${name}.`)
}

async function writeSilence(filePath) {
  const sampleRate = 16000
  const dataSize = sampleRate * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write('WAVE', 8)
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36); buffer.writeUInt32LE(dataSize, 40)
  await fs.writeFile(filePath, buffer)
}
