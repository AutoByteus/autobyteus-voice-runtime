import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha256, writeJson } from '../../scripts/file-utils.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export async function createPackageFixture(root) {
  const runtimeRoot = path.join(root, 'runtime-package')
  const modelRoot = path.join(root, 'model-package')
  const hostPath = path.join(runtimeRoot, 'host', 'bin', process.platform === 'win32' ? 'node.exe' : 'node')
  await fs.mkdir(path.dirname(hostPath), { recursive: true })
  await fs.copyFile(process.execPath, hostPath, fsConstants.COPYFILE_FICLONE)
  await fs.chmod(hostPath, 0o755)
  await fs.cp(path.join(projectRoot, 'runtime'), path.join(runtimeRoot, 'runtime'), { recursive: true })
  await fs.mkdir(path.join(runtimeRoot, 'protocol'), { recursive: true })
  await fs.copyFile(path.join(projectRoot, 'protocol', 'voice-input-protocol-v1.schema.json'), path.join(runtimeRoot, 'protocol', 'voice-input-protocol-v1.schema.json'))
  await makeFakePackages(runtimeRoot)
  await fs.mkdir(path.join(modelRoot, 'metadata'), { recursive: true })
  await fs.writeFile(path.join(modelRoot, 'model.int8.onnx'), 'fixture-model-bytes')
  await fs.writeFile(path.join(modelRoot, 'tokens.txt'), 'fixture tokens')
  await fs.mkdir(path.join(modelRoot, 'licenses'), { recursive: true })
  await fs.writeFile(path.join(modelRoot, 'licenses', 'model-license.txt'), 'fixture license')
  const modelDescriptor = {
    schemaVersion: 1,
    model: { id: 'fixture-sensevoice', version: '2024-07-17', modelType: 'sense-voice', sha256: await sha256(path.join(modelRoot, 'model.int8.onnx')) },
    configuration: {
      type: 'sense-voice',
      files: { model: await described(modelRoot, 'model.int8.onnx'), tokens: await described(modelRoot, 'tokens.txt') },
      sampleRate: 16000, featureDim: 80, numThreads: 1, provider: 'cpu', useInverseTextNormalization: true,
    },
    notices: [await described(modelRoot, 'licenses/model-license.txt')],
  }
  const modelDescriptorPath = path.join(modelRoot, 'metadata', 'model-provider.json')
  await writeJson(modelDescriptorPath, modelDescriptor)
  const buildCommit = '1'.repeat(40)
  const runtimeDescriptor = await runtimeDescriptorFor(runtimeRoot, hostPath, buildCommit)
  const runtimeDescriptorPath = path.join(runtimeRoot, 'metadata', 'runtime-provider.json')
  await writeJson(runtimeDescriptorPath, runtimeDescriptor)
  const manifest = {
    candidateManifestSchemaVersion: 1,
    runtimeId: 'voice-input', runtimeVersion: '1.0.0', releaseCommit: buildCommit,
    capabilities: runtimeDescriptor.capabilities,
    selectedModel: modelDescriptor.model,
    runtimeAssets: [{
      platform: process.platform, arch: process.arch,
      hostKind: 'bundled-node', hostExecutable: relative(runtimeRoot, hostPath), hostVersion: process.versions.node,
      entrypoint: 'runtime/voice-input-worker.cjs',
      runtimeDescriptor: { path: 'metadata/runtime-provider.json', sha256: await sha256(runtimeDescriptorPath) },
    }],
    modelAsset: { descriptor: { path: 'metadata/model-provider.json', sha256: await sha256(modelDescriptorPath) } },
    dependencies: { engine: { kind: 'sherpa-onnx', version: '1.13.4', gitSha1: '14280725' } },
  }
  const manifestPath = path.join(root, 'candidate-manifest.json')
  await writeJson(manifestPath, manifest)
  return { runtimeRoot, modelRoot, hostPath, manifest, manifestPath, runtimeDescriptorPath, modelDescriptorPath }
}

async function makeFakePackages(root) {
  const wrapper = path.join(root, 'node_modules', 'sherpa-onnx-node')
  const native = path.join(root, 'node_modules', platformNativePackage())
  const opencc = path.join(root, 'node_modules', 'opencc-js')
  await fs.mkdir(wrapper, { recursive: true })
  await writeJson(path.join(wrapper, 'package.json'), { name: 'sherpa-onnx-node', version: '1.13.4', main: 'sherpa-onnx.js' })
  await fs.writeFile(path.join(wrapper, 'sherpa-onnx.js'), `
module.exports = {
  version: '1.13.4', gitSha1: '14280725',
  readWave() { return { samples: new Float32Array([0.1, 0.2]), sampleRate: 16000 } },
  OfflineRecognizer: { async createAsync(config) {
    const language = config.modelConfig.senseVoice.language
    return {
      createStream() { return { acceptWaveform() {} } },
      async decodeAsync() {},
      getResult() { return language === 'en' ? { text: 'Hello AutoByteus.', lang: 'en' } : { text: '<|zh|>測試,完成.', lang: 'zh' } },
    }
  } },
}
`)
  await fs.mkdir(native, { recursive: true })
  await writeJson(path.join(native, 'package.json'), { name: platformNativePackage(), version: '1.13.4' })
  await fs.writeFile(path.join(native, 'sherpa-onnx.node'), 'fixture-native')
  await fs.cp(path.join(projectRoot, 'node_modules', 'opencc-js'), opencc, { recursive: true })
}

async function runtimeDescriptorFor(root, hostPath, buildCommit) {
  const nativeRoot = `node_modules/${platformNativePackage()}`
  return {
    schemaVersion: 1,
    runtime: { id: 'voice-input', version: '1.0.0', buildCommit },
    host: { kind: 'bundled-node', version: process.versions.node, platform: process.platform, arch: process.arch, executable: await described(root, relative(root, hostPath)) },
    worker: { entrypoint: await described(root, 'runtime/voice-input-worker.cjs') },
    protocol: { version: 1, schema: await described(root, 'protocol/voice-input-protocol-v1.schema.json') },
    engine: {
      kind: 'sherpa-onnx', version: '1.13.4', gitSha1: '14280725',
      wrapper: { packageName: 'sherpa-onnx-node', version: '1.13.4', packageMetadata: await described(root, 'node_modules/sherpa-onnx-node/package.json'), packageEntry: await described(root, 'node_modules/sherpa-onnx-node/sherpa-onnx.js') },
      native: { packageName: platformNativePackage(), version: '1.13.4', packageMetadata: await described(root, `${nativeRoot}/package.json`), binary: await described(root, `${nativeRoot}/sherpa-onnx.node`) },
    },
    normalization: { packageName: 'opencc-js', version: '1.4.1', packageMetadata: await described(root, 'node_modules/opencc-js/package.json') },
    capabilities: { languageModes: ['auto', 'en', 'zh'], inverseTextNormalization: true, simplifiedChineseNormalization: true, maxInFlightRequests: 1 },
  }
}

export async function writePcmWav(filePath, { seconds = 0.2, amplitude = 2000 } = {}) {
  const sampleRate = 16000
  const sampleCount = Math.round(sampleRate * seconds)
  const dataSize = sampleCount * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write('WAVE', 8)
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36); buffer.writeUInt32LE(dataSize, 40)
  for (let index = 0; index < sampleCount; index += 1) buffer.writeInt16LE(index % 2 === 0 ? amplitude : -amplitude, 44 + index * 2)
  await fs.writeFile(filePath, buffer)
}

async function described(root, relativePath) {
  return { path: relativePath, sha256: await sha256(path.join(root, ...relativePath.split('/'))) }
}

function relative(root, target) {
  return path.relative(root, target).split(path.sep).join('/')
}

function platformNativePackage() {
  return `sherpa-onnx-${process.platform === 'win32' ? 'win' : process.platform}-${process.arch}`
}

export function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}
