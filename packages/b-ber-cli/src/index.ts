#!/usr/bin/env node
import pkg from '../package.json'
import bber from './app'

const { argv } = process

if (argv.includes('--version') || argv.includes('-v')) {
  console.log(pkg.version)
} else {
  bber()
}
