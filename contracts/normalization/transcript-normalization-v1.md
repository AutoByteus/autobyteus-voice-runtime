# Transcript Normalization V1

English applies NFKC, whitespace collapse, and conservative ASCII punctuation
spacing only. Chinese applies NFKC, the pinned OpenCC Traditional-to-Simplified
mapping, Chinese punctuation stabilization, whitespace collapse, and Han/Latin
boundary rules while preserving recognized Latin/alphanumeric spans. Auto applies
only the transformations proved by its fixtures and never translates text.
Runtime results preserve distinct `rawText` and `normalizedText`. Chinese scoring
applies this same transformation symmetrically to reference and hypothesis. No
vocabulary correction, context term, hotword, or expected-term rewrite exists.
