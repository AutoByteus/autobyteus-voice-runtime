'use strict'

class ProviderStartupError extends Error {
  constructor(category) {
    super(category)
    this.name = 'ProviderStartupError'
    this.category = category
  }
}

function fail(category) {
  throw new ProviderStartupError(category)
}

module.exports = { ProviderStartupError, fail }
