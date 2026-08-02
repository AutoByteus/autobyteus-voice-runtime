import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'

const execFileAsync = promisify(execFile)

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

export async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function sha256(filePath) {
  const hash = crypto.createHash('sha256')
  const data = await fs.readFile(filePath)
  hash.update(data)
  return hash.digest('hex')
}

export async function assertDigest(filePath, expected, subject = 'asset') {
  const actual = await sha256(filePath)
  if (actual !== expected) throw new Error(`${subject} digest mismatch.`)
  return actual
}

export async function fileSize(filePath) {
  return (await fs.stat(filePath)).size
}

export async function download(url, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume()
        download(response.headers.location, destination).then(resolve, reject)
        return
      }
      if (response.statusCode !== 200) {
        response.resume()
        reject(new Error(`Download failed with status ${response.statusCode}.`))
        return
      }
      const output = createWriteStream(destination)
      response.pipe(output)
      output.on('finish', () => output.close(resolve))
      output.on('error', reject)
    })
    request.on('error', reject)
  })
}


export async function extractArchive(archivePath, destination) {
  await fs.mkdir(destination, { recursive: true })
  await execFileAsync('tar', ['-xf', archivePath, '-C', destination])
}

export async function createTarGz(sourceDirectory, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await normalizeTreeTimes(sourceDirectory)
  const entries = (await fs.readdir(sourceDirectory)).sort()
  const temporaryTar = `${outputPath}.temporary.tar`
  const args = ['-cf', temporaryTar, '-C', sourceDirectory, ...entries]
  await execFileAsync('tar', args, { env: { ...process.env, COPYFILE_DISABLE: '1', TZ: 'UTC' } })
  try {
    await pipeline(createReadStream(temporaryTar), createGzip({ level: 9, mtime: 0 }), createWriteStream(outputPath))
  } finally {
    await fs.rm(temporaryTar, { force: true })
  }
}

async function normalizeTreeTimes(root) {
  const epoch = new Date(0)
  async function visit(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(target)
      if (!entry.isSymbolicLink()) await fs.utimes(target, epoch, epoch)
    }
    await fs.utimes(current, epoch, epoch)
  }
  await visit(root)
}

export async function copyFileWithMode(source, destination, mode) {
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.copyFile(source, destination)
  if (mode !== undefined) await fs.chmod(destination, mode)
}

export async function copyTree(source, destination) {
  await fs.cp(source, destination, { recursive: true, dereference: false })
}
