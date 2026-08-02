import { readJson } from './file-utils.mjs'

const TARGETS = ['darwin-arm64', 'darwin-x64', 'linux-x64', 'win32-x64']
const REQUIRED_GATES = [
  'quality', 'normalization', 'handshakeLatency', 'coldReadinessLatency',
  'warmLatency', 'coldLatency', 'loadedRss', 'installedSize', 'reproducibility',
  'platformSmoke', 'noticesAndLicenses',
]

export async function assertReleaseEvidence(filePath, expectedModel) {
  const evidence = await readJson(filePath)
  if (evidence.schemaVersion !== 1 || !['replace', 'preserve'].includes(evidence.decision)) throw new Error('Release evidence decision is not publishable.')
  const expectedLane = evidence.decision === 'replace' ? 'AC-009' : 'AC-016'
  if (evidence.lane !== expectedLane || evidence.selectedModelId !== expectedModel.id || evidence.selectedModelSha256 !== expectedModel.sha256) {
    throw new Error('Release evidence selects a different model or lane.')
  }
  const corpus = evidence.corpus || {}
  if (!corpus.licensedRealSpeech || corpus.clipCount < 120 || corpus.durationSeconds < 900 || corpus.speakerCount < 3 || corpus.environmentCount < 2) {
    throw new Error('Release evidence does not satisfy the licensed real corpus contract.')
  }
  if (!evidence.licenseReview?.approved || !evidence.licenseReview?.reference) throw new Error('Model/code redistribution review is not approved.')
  for (const gate of REQUIRED_GATES) if (evidence.gates?.[gate] !== true) throw new Error(`Release gate ${gate} did not pass.`)
  const targets = new Set((evidence.targets || []).filter((target) => target.passed).map((target) => `${target.platform}-${target.arch}`))
  for (const target of TARGETS) if (!targets.has(target)) throw new Error(`Missing passing packaged proof for ${target}.`)
  if (!evidence.runnerCommit || !/^[a-f0-9]{40}$/.test(evidence.runnerCommit)) throw new Error('Release evidence runner commit is invalid.')
  return evidence
}
