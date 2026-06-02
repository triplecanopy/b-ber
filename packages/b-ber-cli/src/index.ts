#!/usr/bin/env node
import bber from './app'
import pkg from '../package.json'

if (process.argv.indexOf('--version') > -1) {
  console.log(pkg.version)
} else {
  bber()
}
