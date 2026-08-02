#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertDigest, download, readJson } from './file-utils.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const candidateId = process.argv[2]
const outputPath = path.resolve(process.argv[3] || '')
if (!candidateId || !process.argv[3]) throw new Error('Usage: fetch-model-source.mjs <candidate-id> <output-path>')
const catalog = await readJson(path.join(projectRoot, 'metadata', 'model-candidates.json'))
const candidate = catalog.candidates.find((value) => value.model.id === candidateId)
if (!candidate) throw new Error(`Unknown model candidate ${candidateId}.`)
await download(candidate.archive.url, outputPath)
await assertDigest(outputPath, candidate.archive.sha256, `${candidateId} source archive`)
process.stdout.write(`${outputPath}\n`)
