'use strict'

const OpenCC = require('opencc-js')

const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' })
const LANGUAGE_TAGS = new Map([
  ['zh', 'zh'], ['en', 'en'], ['yue', 'yue'], ['ja', 'ja'], ['ko', 'ko'],
  ['中文', 'zh'], ['英文', 'en'], ['粤语', 'yue'], ['日文', 'ja'], ['韩文', 'ko'],
])
const TAG = /<\|([^|>]+)\|>/gu
const HAN = '\\p{Script=Han}'

function stripSenseVoiceTags(text) {
  let detectedLanguage
  const stripped = text.replace(TAG, (_match, rawTag) => {
    const tag = String(rawTag).trim().toLowerCase()
    if (!detectedLanguage && LANGUAGE_TAGS.has(tag)) detectedLanguage = LANGUAGE_TAGS.get(tag)
    return ''
  })
  return { text: stripped, detectedLanguage }
}

function normalizeChinesePunctuation(text) {
  let normalized = text
  const replacements = new Map([[',', '，'], ['.', '。'], ['?', '？'], ['!', '！'], [';', '；'], [':', '：']])
  for (const [ascii, chinese] of replacements) {
    const escaped = ascii.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    normalized = normalized
      .replace(new RegExp(`(?<=[${HAN}])${escaped}(?=\\s|[${HAN}]|$)`, 'gu'), chinese)
      .replace(new RegExp(`(?<=[${HAN}\\u3000-\\u303f\\uff00-\\uffef])\\s*${escaped}(?=[${HAN}])`, 'gu'), chinese)
  }
  if (new RegExp(`[${HAN}]`, 'u').test(normalized)) {
    normalized = normalized
      .replace(/(?<!\d),(?!\d)/gu, '，')
      .replace(/(?<!\d)\.(?=\s*$)/gu, '。')
      .replace(/\?(?=\s|$)/gu, '？')
      .replace(/!(?=\s|$)/gu, '！')
      .replace(/;(?=\s|$)/gu, '；')
      .replace(/:(?=\s|$)/gu, '：')
  }
  return normalized
}

function normalizeSpacing(text) {
  return text
    .replace(/\s+/gu, ' ')
    .replace(/\s+([，。！？；：、])/gu, '$1')
    .replace(/([（【“])\s+/gu, '$1')
    .replace(new RegExp(`(?<=[${HAN}])\\s+(?=[${HAN}，。！？；：、])`, 'gu'), '')
    .trim()
}

function normalizeTranscript(rawText, sessionLanguage, engineLanguage) {
  const tagged = stripSenseVoiceTags(typeof rawText === 'string' ? rawText : '')
  const detectedLanguage = tagged.detectedLanguage || normalizeLanguage(engineLanguage) || (sessionLanguage === 'auto' ? 'unknown' : sessionLanguage)
  let text = tagged.text.normalize('NFKC')
  if (sessionLanguage === 'zh' || detectedLanguage === 'zh' || detectedLanguage === 'yue') {
    text = toSimplified(text)
    text = normalizeChinesePunctuation(text)
  }
  text = normalizeSpacing(text)
  return Object.freeze({ text, detectedLanguage })
}

function normalizeLanguage(value) {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase().replace(/^<\||\|>$/g, '')
  return LANGUAGE_TAGS.get(normalized)
}

module.exports = { normalizeTranscript, stripSenseVoiceTags }
