#!/usr/bin/env node
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { ProviderClient } from './providerClient.mjs'
import { aggregateQuality, latencySummary } from './metrics.mjs'
import { V03BaselineAdapter } from './adapters/v0_3BaselineAdapter.mjs'
import { assertDigest, readJson, sha256, writeJson } from '../scripts/file-utils.mjs'

const execFileAsync = promisify(execFile)
const values = parseArgs(process.argv.slice(2))
const corpusPath = path.resolve(values.corpus)
const corpusRoot = path.dirname(corpusPath)
const corpus = await readJson(corpusPath)
const clips = await validateCorpus(corpus, corpusRoot)
const manifest = await readJson(values.candidateManifest)
const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autobyteus-benchmark-'))
try {
  const baselineSamples = await runBaseline(clips)
  const candidateSamples = await runCandidateQuality(clips)
  const performance = await runPerformance(clips[0])
  const report = {
    schemaVersion: 1,
    runnerCommit: values.runnerCommit,
    corpus: {
      id: corpus.corpusId, version: corpus.version, manifestSha256: await sha256(corpusPath),
      licensedRealSpeech: corpus.license.licensedRealSpeech, provenanceReference: corpus.license.provenanceReference,
      clipCount: clips.length, durationSeconds: clips.reduce((total, clip) => total + clip.durationMs, 0) / 1000,
      speakerCount: new Set(clips.map((clip) => clip.speakerId)).size,
      environmentCount: new Set(clips.map((clip) => clip.environmentId)).size,
    },
    environment: { platform: process.platform, arch: process.arch, osRelease: os.release(), hostnameHash: await hashText(os.hostname()) },
    baseline: summarizeQuality(baselineSamples),
    candidateIdentity: manifest.selectedModel,
    candidate: summarizeQuality(candidateSamples),
    performance,
    privacy: { rawAudioIncluded: false, transcriptsIncluded: false, localPathsIncluded: false },
  }
  await writeJson(values.output, report)
  process.stdout.write(`${values.output}\n`)
} finally {
  await fs.rm(workDir, { recursive: true, force: true })
}

async function runBaseline(allClips) {
  const adapter = new V03BaselineAdapter({ runtimeRoot: values.baselineRuntimeRoot, modelPath: values.baselineModelPath, backend: values.baselineBackend })
  const samples = []
  await adapter.start()
  try {
    for (const clip of allClips) {
      const response = await adapter.transcribeFile(clip.absolutePath, clip.languageMode)
      if (!response.ok) throw new Error(`Historical baseline failed for clip ${clip.id}.`)
      samples.push(sample(clip, response.text || ''))
    }
  } finally { await adapter.stop() }
  return samples
}

async function runCandidateQuality(allClips) {
  const samples = []
  for (const languageMode of ['zh', 'auto', 'en']) {
    const applicable = allClips.filter((clip) => clip.languageMode === languageMode)
    if (applicable.length === 0) continue
    const client = new ProviderClient({ manifest, runtimeRoot: values.candidateRuntimeRoot, modelRoot: values.candidateModelRoot, languageMode, configPath: path.join(workDir, `quality-${languageMode}.json`) })
    await client.start()
    try {
      for (const clip of applicable) {
        const { response } = await client.transcribeFile(clip.absolutePath)
        if (response.type !== 'transcription-result') throw new Error(`Candidate failed for clip ${clip.id}.`)
        samples.push(sample(clip, response.text))
      }
    } finally { await client.shutdown() }
  }
  return samples
}

async function runPerformance(clip) {
  const handshake = []
  const readiness = []
  const cold = []
  const warm = []
  let loadedRssBytes = 0
  for (let index = 0; index < 30; index += 1) {
    const client = new ProviderClient({ manifest, runtimeRoot: values.candidateRuntimeRoot, modelRoot: values.candidateModelRoot, languageMode: clip.languageMode, configPath: path.join(workDir, `cold-${index}.json`) })
    const start = await client.start()
    const result = await client.transcribeFile(clip.absolutePath)
    handshake.push(start.handshakeMs)
    readiness.push(start.readinessMs)
    cold.push(start.handshakeMs + start.readinessMs + result.elapsedMs)
    loadedRssBytes = Math.max(loadedRssBytes, await residentBytes(client.process.pid))
    await client.shutdown()
  }
  const client = new ProviderClient({ manifest, runtimeRoot: values.candidateRuntimeRoot, modelRoot: values.candidateModelRoot, languageMode: clip.languageMode, configPath: path.join(workDir, 'warm.json') })
  await client.start()
  await client.transcribeFile(clip.absolutePath)
  for (let index = 0; index < 100; index += 1) warm.push((await client.transcribeFile(clip.absolutePath)).elapsedMs)
  loadedRssBytes = Math.max(loadedRssBytes, await residentBytes(client.process.pid))
  await client.shutdown()
  return {
    handshake: latencySummary(handshake), readiness: latencySummary(readiness), coldPostStop: latencySummary(cold), warmPostStop: latencySummary(warm),
    loadedRssBytes,
    installedSizeBytes: await directoryBytes(values.candidateRuntimeRoot) + await directoryBytes(values.candidateModelRoot),
  }
}

function sample(clip, hypothesis) {
  return { id: clip.id, category: clip.category, speakerId: clip.speakerId, reference: clip.reference, hypothesis, requiredTerms: clip.requiredTerms }
}

function summarizeQuality(samples) {
  const byCategory = Object.fromEntries(['mandarin', 'mixed', 'english'].map((category) => [category, aggregateQuality(samples.filter((sampleValue) => sampleValue.category === category))]))
  const bySpeaker = Object.fromEntries([...new Set(samples.map((sampleValue) => sampleValue.speakerId))].sort().map((speaker) => [speaker, aggregateQuality(samples.filter((sampleValue) => sampleValue.speakerId === speaker))]))
  return { aggregate: aggregateQuality(samples), byCategory, bySpeaker }
}

async function validateCorpus(value, root) {
  if (value.schemaVersion !== 1 || !value.license?.licensedRealSpeech || !Array.isArray(value.clips) || value.clips.length < 120) throw new Error('Corpus contract is incomplete.')
  const duration = value.clips.reduce((total, clip) => total + clip.durationMs, 0)
  const categories = Object.fromEntries(['mandarin', 'mixed', 'english'].map((category) => [category, value.clips.filter((clip) => clip.category === category).length]))
  if (duration < 900000 || categories.mandarin < 60 || categories.mixed < 30 || categories.english < 30) throw new Error('Corpus category or duration quota failed.')
  const speakers = new Map()
  const environments = new Set()
  let mixedEnglishTokens = 0
  let mixedTermOccurrences = 0
  const result = []
  for (const clip of value.clips) {
    if (clip.durationMs < 3000 || clip.durationMs > 15000 || !['mandarin', 'mixed', 'english'].includes(clip.category) || !['auto', 'en', 'zh'].includes(clip.languageMode)) throw new Error('Corpus clip metadata is invalid.')
    speakers.set(clip.speakerId, (speakers.get(clip.speakerId) || 0) + 1)
    environments.add(clip.environmentId)
    if (clip.category === 'mixed') {
      mixedEnglishTokens += (clip.reference.match(/[A-Za-z][A-Za-z0-9]*/g) || []).length
      mixedTermOccurrences += clip.requiredTerms.length
    }
    const absolutePath = path.resolve(root, ...clip.path.split('/'))
    if (path.relative(root, absolutePath).startsWith('..')) throw new Error('Corpus path escapes its root.')
    await assertDigest(absolutePath, clip.sha256, 'Corpus clip')
    result.push({ ...clip, absolutePath })
  }
  if (speakers.size < 3 || environments.size < 2 || Math.max(...speakers.values()) > value.clips.length / 2 || mixedEnglishTokens < 100 || mixedTermOccurrences < 40) throw new Error('Corpus diversity or mixed-language quota failed.')
  return result
}

async function residentBytes(pid) {
  if (process.platform === 'win32') return 0
  const { stdout } = await execFileAsync('ps', ['-o', 'rss=', '-p', String(pid)])
  return Number(stdout.trim()) * 1024
}

async function directoryBytes(root) {
  let total = 0
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)
    total += entry.isDirectory() ? await directoryBytes(target) : (await fs.stat(target)).size
  }
  return total
}

function parseArgs(args) {
  const parsed = {}
  for (let index = 0; index < args.length; index += 2) parsed[args[index].replace(/^--/, '')] = args[index + 1]
  for (const key of ['corpus', 'candidateManifest', 'candidateRuntimeRoot', 'candidateModelRoot', 'baselineRuntimeRoot', 'baselineModelPath', 'baselineBackend', 'runnerCommit', 'output']) if (!parsed[key]) throw new Error(`Missing --${key}.`)
  if (!/^[a-f0-9]{40}$/.test(parsed.runnerCommit)) throw new Error('Runner commit must be a full Git SHA.')
  return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, key === 'baselineBackend' || key === 'runnerCommit' ? value : path.resolve(value)]))
}

async function hashText(value) {
  const crypto = await import('node:crypto')
  return crypto.createHash('sha256').update(value).digest('hex')
}
