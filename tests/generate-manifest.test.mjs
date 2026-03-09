import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const scriptPath = path.join(projectRoot, 'scripts', 'generate-manifest.mjs')

test('generate-manifest emits release-backed URLs and checksums', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-runtime-manifest-'))
  const distDir = path.join(tempDir, 'dist')
  const metadataPath = path.join(tempDir, 'runtime-assets.json')
  const outputPath = path.join(distDir, 'voice-input-runtime-manifest.json')

  await fs.mkdir(distDir, { recursive: true })
  await fs.writeFile(path.join(distDir, 'voice-input-runtime-darwin-arm64.tar.gz'), 'runtime-bytes', 'utf8')
  await fs.writeFile(path.join(distDir, 'voice-input-model-whisper-small-mlx.tar.gz'), 'model-bytes', 'utf8')
  await fs.writeFile(
    metadataPath,
    JSON.stringify({
      schemaVersion: 2,
      runtimeId: 'voice-input',
      assets: [
        {
          platform: 'darwin',
          arch: 'arm64',
          fileName: 'voice-input-runtime-darwin-arm64.tar.gz',
          entrypoint: 'bin/voice-input-worker',
          distributionType: 'archive',
          backendKind: 'mlx',
          model: {
            id: 'whisper-small-mlx',
            fileName: 'voice-input-model-whisper-small-mlx.tar.gz',
            sourceRepo: 'mlx-community/whisper-small-mlx',
            distributionType: 'archive',
            version: 'mlx-community/whisper-small-mlx',
          },
        },
      ],
    }, null, 2),
    'utf8',
  )

  await execFileAsync('node', [scriptPath, outputPath], {
    env: {
      ...process.env,
      AUTOBYTEUS_VOICE_RUNTIME_VERSION: '0.2.0',
      AUTOBYTEUS_RELEASE_REPOSITORY: 'AutoByteus/autobyteus-voice-runtime',
      AUTOBYTEUS_RELEASE_TAG: 'v0.2.0',
      AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR: distDir,
      AUTOBYTEUS_VOICE_RUNTIME_METADATA_PATH: metadataPath,
    },
  })

  const manifest = JSON.parse(await fs.readFile(outputPath, 'utf8'))

  assert.equal(manifest.schemaVersion, 2)
  assert.equal(manifest.runtimeVersion, '0.2.0')
  assert.equal(manifest.assets.length, 1)
  assert.equal(
    manifest.assets[0].url,
    'https://github.com/AutoByteus/autobyteus-voice-runtime/releases/download/v0.2.0/voice-input-runtime-darwin-arm64.tar.gz',
  )
  assert.match(manifest.assets[0].sha256, /^[a-f0-9]{64}$/)
  assert.equal(manifest.assets[0].backendKind, 'mlx')
  assert.equal(
    manifest.assets[0].model.url,
    'https://github.com/AutoByteus/autobyteus-voice-runtime/releases/download/v0.2.0/voice-input-model-whisper-small-mlx.tar.gz',
  )
  assert.equal(manifest.assets[0].model.version, 'mlx-community/whisper-small-mlx')
  assert.equal(manifest.assets[0].model.sizeBytes, 'model-bytes'.length)
})
