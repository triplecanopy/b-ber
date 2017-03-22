'use strict'

const bunyan = require('bunyan')

class Logger {
  constructor() {
    this.infos = []
    this.warnings = []
    this.errors = []

    bunyan.prototype.info = (message) => {
      this.infos.push({ message })
    }
    bunyan.prototype.warn = (message) => {
      this.warnings.push({ message })
    }
    bunyan.prototype.error = (message) => {
      this.errors.push({ message })
    }
  }

  reset() {
    this.infos = []
    this.warnings = []
    this.errors = []
  }
}

module.exports = Logger
