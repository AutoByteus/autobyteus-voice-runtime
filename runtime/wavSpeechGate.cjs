'use strict'

const fs = require('node:fs')
const path = require('node:path')

class InvalidAudioError extends Error {
  constructor() {
    super('INVALID_AUDIO')
    this.name = 'InvalidAudioError'
  }
}

function invalid() {
  throw new InvalidAudioError()
}

function inspectMonoPcmWav(audioPath) {
  if (typeof audioPath !== 'string' || !path.isAbsolute(audioPath)) invalid()
  let stat
  let buffer
  try {
    stat = fs.statSync(audioPath)
    if (!stat.isFile() || stat.size < 44 || stat.size > 64 * 1024 * 1024) invalid()
    buffer = fs.readFileSync(audioPath)
  } catch (error) {
    if (error instanceof InvalidAudioError) throw error
    invalid()
  }
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') invalid()
  let offset = 12
  let format
  let data
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4)
    const size = buffer.readUInt32LE(offset + 4)
    const start = offset + 8
    const end = start + size
    if (end > buffer.length) invalid()
    if (id === 'fmt ') {
      if (size < 16) invalid()
      format = {
        encoding: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        byteRate: buffer.readUInt32LE(start + 8),
        blockAlign: buffer.readUInt16LE(start + 12),
        bitsPerSample: buffer.readUInt16LE(start + 14),
      }
    } else if (id === 'data') {
      data = buffer.subarray(start, end)
    }
    offset = end + (size % 2)
  }
  if (!format || !data || format.encoding !== 1 || format.channels !== 1 || format.bitsPerSample !== 16) invalid()
  if (format.sampleRate < 8000 || format.sampleRate > 48000 || format.blockAlign !== 2 || format.byteRate !== format.sampleRate * 2 || data.length % 2 !== 0) invalid()
  const sampleCount = data.length / 2
  if (sampleCount === 0) invalid()
  let sumSquares = 0
  let peak = 0
  for (let index = 0; index < data.length; index += 2) {
    const sample = data.readInt16LE(index) / 32768
    sumSquares += sample * sample
    peak = Math.max(peak, Math.abs(sample))
  }
  const durationMs = (sampleCount / format.sampleRate) * 1000
  if (durationMs < 100 || durationMs > 30_000) invalid()
  const rms = Math.sqrt(sumSquares / sampleCount)
  return Object.freeze({ audioDurationMs: Math.round(durationMs * 1000) / 1000, sampleRate: format.sampleRate, noSpeech: rms < 0.001 || peak < 0.003 })
}

module.exports = { InvalidAudioError, inspectMonoPcmWav }
