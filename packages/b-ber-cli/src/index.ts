#!/usr/bin/env node
import log from '@canopycanopycanopy/b-ber-logger'
import pkg from '../package.json'
import {
  exitCodeOnFailure,
  exitOnUncaughtFailure,
  exitWithFailure,
} from './lib/exit'
import { loggerOptions } from './lib/logger-options'

const { argv } = process

if (argv.includes('--version') || argv.includes('-v')) {
  console.log(pkg.version)
} else {
  log.configure(loggerOptions(argv.slice(2)))
  exitOnUncaughtFailure()
  exitCodeOnFailure()

  // Imported only now, once the logger is configured and failures exit:
  // importing the commands imports b-ber-lib's State, which reads the project
  // as it loads, and can log or fail while it does (a malformed config.yml)
  import('./app').then(({ default: bber }) => bber(), exitWithFailure)
}
