#!/usr/bin/env node
import pkg from '../package.json'
import bber from './app'

if (process.argv.indexOf('--version') > -1) {
  console.log(pkg.version)
} else {
  bber()
}
