#!/usr/bin/env node
import path from 'node:path'
import { createRequire } from 'node:module'
import { writeJson } from './file-utils.mjs'

const require = createRequire(import.meta.url)
const { normalizeTranscript } = require('../runtime/transcriptNormalizer.cjs')
const fixtures = [
  ['<|zh|>你好,世界.', 'zh', '你好，世界。'],
  ['軟體工程團隊', 'zh', '软体工程团队'],
  ['版本3.5%,AutoByteus.', 'zh', '版本3.5%，AutoByteus。'],
  ['Hello, AutoByteus 3.5%.', 'en', 'Hello, AutoByteus 3.5%.'],
  ['<|zh|><|NEUTRAL|><|Speech|>請使用GitHub。', 'zh', '请使用GitHub。'],
]
const results = fixtures.map(([input, language, expected]) => ({ expected, actual: normalizeTranscript(input, language).text }))
const passed = results.every((result) => result.actual === result.expected)
const outputPath = path.resolve(process.argv[2] || 'dist/normalization-proof.json')
await writeJson(outputPath, { schemaVersion: 1, passed, fixtureCount: fixtures.length, results: results.map((result) => ({ passed: result.actual === result.expected })) })
if (!passed) throw new Error('Transcript normalization fixtures failed.')
