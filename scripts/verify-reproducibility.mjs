#!/usr/bin/env node
import path from 'node:path'
import { sha256, writeJson } from './file-utils.mjs'

const [firstPath, secondPath, platform, arch, outputPath] = process.argv.slice(2)
if (![firstPath, secondPath, platform, arch, outputPath].every(Boolean)) throw new Error('Usage: verify-reproducibility.mjs <first> <second> <platform> <arch> <output>')
const firstSha256 = await sha256(path.resolve(firstPath))
const secondSha256 = await sha256(path.resolve(secondPath))
const proof = { schemaVersion: 1, platform, arch, firstSha256, secondSha256, byteIdentical: firstSha256 === secondSha256 }
await writeJson(path.resolve(outputPath), proof)
if (!proof.byteIdentical) throw new Error(`Runtime package is not reproducible for ${platform}/${arch}.`)
