'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { fail } = require('./providerStartupError.cjs')

const MAX_JSON_BYTES = 1024 * 1024

function parseJsonFile(filePath, category) {
  let stat
  try {
    stat = fs.lstatSync(filePath)
  } catch {
    fail(category)
  }
  if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_JSON_BYTES) fail(category)
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    fail(category)
  }
}

function canonicalRoot(root) {
  let real
  try {
    real = fs.realpathSync(root)
  } catch {
    fail('SESSION_PATH_INVALID')
  }
  if (!fs.statSync(real).isDirectory()) fail('SESSION_PATH_INVALID')
  return real
}

function canonicalContainedFile(root, relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0 || relativePath.includes('\\') || path.posix.isAbsolute(relativePath)) fail('SESSION_PATH_INVALID')
  const normalized = path.posix.normalize(relativePath)
  if (normalized !== relativePath || normalized === '..' || normalized.startsWith('../')) fail('SESSION_PATH_INVALID')
  const candidate = path.resolve(root, ...relativePath.split('/'))
  let real
  try {
    real = fs.realpathSync(candidate)
  } catch {
    fail('SESSION_ASSET_INVALID')
  }
  const relative = path.relative(root, real)
  if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) fail('SESSION_PATH_INVALID')
  if (!fs.statSync(real).isFile()) fail('SESSION_ASSET_INVALID')
  return real
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function verifyDigest(filePath, expected) {
  if (sha256(filePath) !== expected) fail('SESSION_ASSET_INVALID')
}

function verifyAssets(root, assets) {
  return Object.fromEntries(Object.entries(assets).map(([name, asset]) => {
    const filePath = canonicalContainedFile(root, asset.path)
    verifyDigest(filePath, asset.sha256)
    return [name, filePath]
  }))
}

function packageIdentity(metadataPath, expectedName, expectedVersion) {
  const value = parseJsonFile(metadataPath, 'SESSION_ASSET_INVALID')
  if (value.name !== expectedName || value.version !== expectedVersion) fail('SESSION_IDENTITY_MISMATCH')
}

module.exports = { canonicalContainedFile, canonicalRoot, packageIdentity, parseJsonFile, verifyAssets, verifyDigest }
