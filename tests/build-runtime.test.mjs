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
const scriptPath = path.join(projectRoot, 'scripts', 'build-runtime.sh')

test('build-runtime packages the runtime launcher bundle for darwin arm64', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-runtime-build-'))
  const distDir = path.join(tempDir, 'dist')
  const metadataPath = path.join(tempDir, 'runtime-assets.json')
  const archivePath = path.join(distDir, 'voice-input-runtime-darwin-arm64.tar.gz')

  await fs.mkdir(distDir, { recursive: true })
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
            id: 'fixture-model',
            fileName: 'fixture-model.tar.gz',
            sourceRepo: 'example/fixture-model',
            distributionType: 'archive',
            version: 'fixture-model-v1',
          },
        },
      ],
    }, null, 2),
    'utf8',
  )

  await execFileAsync('bash', [scriptPath, 'darwin', 'arm64'], {
    env: {
      ...process.env,
      AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR: distDir,
      AUTOBYTEUS_VOICE_RUNTIME_METADATA_PATH: metadataPath,
    },
  })

  const { stdout } = await execFileAsync('tar', ['-tzf', archivePath])
  assert.match(stdout, /bin\/voice-input-worker/)
  assert.match(stdout, /voice_input_worker.py/)
  assert.match(stdout, /requirements-mlx.txt/)
  assert.match(stdout, /requirements-faster-whisper.txt/)
})
