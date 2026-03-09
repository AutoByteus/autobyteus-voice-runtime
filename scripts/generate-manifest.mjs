#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distDir = process.env.AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR || path.join(projectRoot, 'dist')
const metadataPath = process.env.AUTOBYTEUS_VOICE_RUNTIME_METADATA_PATH || path.join(projectRoot, 'metadata', 'runtime-assets.json')
const outputPath = process.argv[2] || path.join(distDir, 'voice-input-runtime-manifest.json')
const runtimeVersion = process.env.AUTOBYTEUS_VOICE_RUNTIME_VERSION || '0.3.0'
const releaseRepository = process.env.AUTOBYTEUS_RELEASE_REPOSITORY || 'AutoByteus/autobyteus-voice-runtime'
const releaseTag = process.env.AUTOBYTEUS_RELEASE_TAG || `v${runtimeVersion}`

function sha256(filePath) {
  const hash = crypto.createHash('sha256')
  hash.update(fs.readFileSync(filePath))
  return hash.digest('hex')
}

function buildReleaseAssetUrl(fileName) {
  return `https://github.com/${releaseRepository}/releases/download/${releaseTag}/${fileName}`
}

function buildModel(model) {
  return {
    id: model.id,
    sourceRepo: model.sourceRepo,
    sourceRevision: model.sourceRevision || undefined,
    version: model.version || model.id || model.sourceRepo,
  }
}

const metadata = fs.existsSync(metadataPath)
  ? JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
  : { schemaVersion: 2, runtimeId: 'voice-input', assets: [] }

const assets = metadata.assets.map((asset) => {
  const assetPath = path.join(distDir, asset.fileName)
  return {
    platform: asset.platform,
    arch: asset.arch,
    fileName: asset.fileName,
    url: buildReleaseAssetUrl(asset.fileName),
    sha256: fs.existsSync(assetPath) ? sha256(assetPath) : '',
    entrypoint: asset.entrypoint,
    distributionType: asset.distributionType,
    backendKind: asset.backendKind,
    model: buildModel(asset.model),
  }
})

const manifest = {
  schemaVersion: metadata.schemaVersion || 2,
  runtimeId: metadata.runtimeId || 'voice-input',
  runtimeVersion,
  generatedAt: new Date().toISOString(),
  assets,
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
