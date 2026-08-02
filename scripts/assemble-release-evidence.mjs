#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateLane } from '../benchmark/metrics.mjs'
import { readJson, writeJson } from './file-utils.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = parseArgs(process.argv.slice(2))
const benchmark = await readJson(args.benchmark)
const catalog = await readJson(path.join(projectRoot, 'metadata', 'model-candidates.json'))
const model = catalog.candidates.find((candidate) => candidate.model.id === benchmark.candidateIdentity?.id)?.model
if (!model || model.sha256 !== benchmark.candidateIdentity.sha256) throw new Error('Benchmark report does not identify a reviewed model candidate.')
if ((args.lane === 'AC-009' && model.modelType !== 'sense-voice') || (args.lane === 'AC-016' && model.modelType !== 'whisper')) throw new Error('Candidate model does not belong to the requested decision lane.')
const licenseReview = await readJson(args.licenseReview)
const normalization = await readJson(args.normalizationProof)
const modelReproducibility = await readJson(args.modelReproducibilityProof)
const smokes = await Promise.all(args.smokeProof.map(readJson))
const reproducibility = await Promise.all(args.reproducibilityProof.map(readJson))
const baseline = benchmark.baseline.aggregate
const candidate = benchmark.candidate.aggregate
const performance = benchmark.performance
const targets = smokes.map((proof) => ({ platform: proof.platform, arch: proof.arch, passed: proof.protocol?.gracefulShutdown === true && proof.protocol?.malformedTerminates === true && proof.protocol?.cleanRestartAfterProcessLoss === true && proof.preHello?.every((entry) => entry.noProtocolStdout) === true }))
const allTargetsPassed = requiredTargets().every((required) => targets.some((target) => `${target.platform}-${target.arch}` === required && target.passed))
const reproducibleTargets = new Set(reproducibility.filter((proof) => proof.byteIdentical === true).map((proof) => `${proof.platform}-${proof.arch}`))
const operational = {
  normalizationFixtures: normalization.passed === true,
  handshakeP95Ms: performance.handshake.p95,
  coldReadinessP95Ms: performance.readiness.p95,
  warmP95Ms: performance.warmPostStop.p95,
  coldP95Ms: performance.coldPostStop.p95,
  loadedRssBytes: performance.loadedRssBytes,
  installedSizeBytes: performance.installedSizeBytes,
  allTargetsPassed,
  licensesApproved: licenseReview.approved === true,
}
const qualityPassed = args.lane === 'AC-009'
  ? candidate.mandarinCer <= 0.10 && candidate.mandarinCer <= baseline.mandarinCer * 0.85 && candidate.mixedErrorRate <= 0.15 && candidate.productTermRecall >= 0.85 && candidate.englishWer <= 0.15 && candidate.englishWer <= baseline.englishWer + 0.02
  : candidate.mandarinCer <= baseline.mandarinCer + 0.01 && candidate.mixedErrorRate <= baseline.mixedErrorRate + 0.01 && candidate.productTermRecall >= baseline.productTermRecall && candidate.englishWer <= baseline.englishWer + 0.02
const completeReproducibility = modelReproducibility.byteIdentical === true && requiredTargets().every((target) => reproducibleTargets.has(target))
const passed = qualityPassed && evaluateLane({ baseline, candidate, operational, lane: args.lane }) && completeReproducibility
const decision = passed ? (args.lane === 'AC-009' ? 'replace' : 'preserve') : 'blocked'
const gates = {
  quality: qualityPassed,
  normalization: operational.normalizationFixtures,
  handshakeLatency: operational.handshakeP95Ms <= 1000,
  coldReadinessLatency: operational.coldReadinessP95Ms <= 6000,
  warmLatency: operational.warmP95Ms <= 1500,
  coldLatency: operational.coldP95Ms <= 6000,
  loadedRss: operational.loadedRssBytes <= 1024 ** 3,
  installedSize: operational.installedSizeBytes <= 1.25 * 1024 ** 3,
  reproducibility: completeReproducibility,
  platformSmoke: allTargetsPassed,
  noticesAndLicenses: licenseReview.approved === true,
}
const evidence = {
  schemaVersion: 1,
  decision,
  lane: args.lane,
  selectedModelId: model.id,
  selectedModelSha256: model.sha256,
  runnerCommit: benchmark.runnerCommit,
  corpus: benchmark.corpus,
  quality: { baseline, candidate },
  performance,
  licenseReview: { approved: licenseReview.approved === true, reference: licenseReview.reference || '' },
  targets,
  gates,
}
await writeJson(args.output, evidence)
if (!passed) {
  process.stderr.write('Release evidence is blocked; no publishable evidence was produced.\n')
  process.exitCode = 1
} else process.stdout.write(`${args.output}\n`)

function requiredTargets() {
  return ['darwin-arm64', 'darwin-x64', 'linux-x64', 'win32-x64']
}

function parseArgs(values) {
  const single = {}
  const multiple = { smokeProof: [], reproducibilityProof: [] }
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index]?.replace(/^--/, '')
    const value = values[index + 1]
    if (key in multiple) multiple[key].push(path.resolve(value))
    else single[key] = value
  }
  for (const key of ['benchmark', 'licenseReview', 'normalizationProof', 'modelReproducibilityProof', 'lane', 'output']) if (!single[key]) throw new Error(`Missing --${key}.`)
  if (!['AC-009', 'AC-016'].includes(single.lane) || multiple.smokeProof.length !== 4 || multiple.reproducibilityProof.length !== 4) throw new Error('Evidence inputs do not cover one approved lane and all targets.')
  return { ...single, benchmark: path.resolve(single.benchmark), licenseReview: path.resolve(single.licenseReview), normalizationProof: path.resolve(single.normalizationProof), modelReproducibilityProof: path.resolve(single.modelReproducibilityProof), output: path.resolve(single.output), ...multiple }
}
