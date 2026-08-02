const PUNCTUATION = /[\p{P}\p{S}]/gu
const HAN_OR_WORD = /\p{Script=Han}|[A-Za-z0-9]+(?:[._+-][A-Za-z0-9]+)*/gu
const WORD = /[A-Za-z0-9]+(?:[._+-][A-Za-z0-9]+)*/gu

export function editDistance(reference, hypothesis) {
  const previous = Array.from({ length: hypothesis.length + 1 }, (_value, index) => index)
  for (let row = 1; row <= reference.length; row += 1) {
    const current = [row]
    for (let column = 1; column <= hypothesis.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (reference[row - 1] === hypothesis[column - 1] ? 0 : 1),
      )
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[hypothesis.length]
}

export function mandarinUnits(text) {
  return Array.from(text.normalize('NFKC').replace(PUNCTUATION, '').replace(/\s/gu, ''))
}

export function mixedUnits(text) {
  return (text.normalize('NFKC').match(HAN_OR_WORD) || []).map((unit) => /[A-Za-z]/.test(unit) ? unit.toLowerCase() : unit)
}

export function englishUnits(text) {
  return (text.normalize('NFKC').match(WORD) || []).map((word) => word.toLowerCase())
}

export function errorRate(reference, hypothesis, tokenizer) {
  const expected = tokenizer(reference)
  const actual = tokenizer(hypothesis)
  return { edits: editDistance(expected, actual), units: expected.length, rate: expected.length === 0 ? (actual.length === 0 ? 0 : 1) : editDistance(expected, actual) / expected.length }
}

export function termRecall(referenceTerms, hypothesis) {
  const normalized = hypothesis.normalize('NFKC').toLowerCase()
  const terms = referenceTerms.map((term) => term.normalize('NFKC'))
  const recalled = terms.filter((term) => normalized.includes(term.toLowerCase()))
  const exactCase = terms.filter((term) => hypothesis.includes(term))
  return { occurrences: terms.length, recalled: recalled.length, exactCase: exactCase.length }
}

export function percentile(values, percentileValue) {
  if (!Array.isArray(values) || values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.min(sorted.length - 1, Math.ceil(percentileValue * sorted.length) - 1)]
}

export function latencySummary(values, failures = 0) {
  return { count: values.length, failures, p50: percentile(values, 0.5), p95: percentile(values, 0.95), max: values.length ? Math.max(...values) : null }
}

export function aggregateQuality(samples) {
  const totals = {
    mandarin: { edits: 0, units: 0 }, mixed: { edits: 0, units: 0 }, english: { edits: 0, units: 0 },
    terms: { recalled: 0, occurrences: 0, exactCase: 0 }, punctuationExact: 0, sampleCount: samples.length,
  }
  for (const sample of samples) {
    const tokenizer = sample.category === 'mandarin' ? mandarinUnits : sample.category === 'mixed' ? mixedUnits : englishUnits
    const score = errorRate(sample.reference, sample.hypothesis, tokenizer)
    totals[sample.category].edits += score.edits
    totals[sample.category].units += score.units
    const terms = termRecall(sample.requiredTerms || [], sample.hypothesis)
    totals.terms.recalled += terms.recalled
    totals.terms.occurrences += terms.occurrences
    totals.terms.exactCase += terms.exactCase
    if (punctuation(sample.reference) === punctuation(sample.hypothesis)) totals.punctuationExact += 1
  }
  return {
    mandarinCer: ratio(totals.mandarin.edits, totals.mandarin.units),
    mixedErrorRate: ratio(totals.mixed.edits, totals.mixed.units),
    englishWer: ratio(totals.english.edits, totals.english.units),
    productTermRecall: ratio(totals.terms.recalled, totals.terms.occurrences),
    productTermExactCase: ratio(totals.terms.exactCase, totals.terms.occurrences),
    punctuationExactRate: ratio(totals.punctuationExact, totals.sampleCount),
    totals,
  }
}

export function evaluateLane({ baseline, candidate, operational, lane }) {
  const common = operational.normalizationFixtures && operational.handshakeP95Ms <= 1000 && operational.coldReadinessP95Ms <= 6000 && operational.warmP95Ms <= 1500 && operational.coldP95Ms <= 6000 && operational.loadedRssBytes <= 1024 ** 3 && operational.installedSizeBytes <= 1.25 * 1024 ** 3 && operational.allTargetsPassed && operational.licensesApproved
  if (lane === 'AC-009') {
    return common && candidate.mandarinCer <= 0.10 && candidate.mandarinCer <= baseline.mandarinCer * 0.85 && candidate.mixedErrorRate <= 0.15 && candidate.productTermRecall >= 0.85 && candidate.englishWer <= 0.15 && candidate.englishWer <= baseline.englishWer + 0.02
  }
  if (lane === 'AC-016') {
    return common && candidate.mandarinCer <= baseline.mandarinCer + 0.01 && candidate.mixedErrorRate <= baseline.mixedErrorRate + 0.01 && candidate.productTermRecall >= baseline.productTermRecall && candidate.englishWer <= baseline.englishWer + 0.02
  }
  throw new Error('Unknown model selection lane.')
}

function punctuation(text) {
  return (text.normalize('NFKC').match(PUNCTUATION) || []).join('')
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 1 : numerator / denominator
}
