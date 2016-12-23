#!/usr/bin/env node

/* eslint-disable no-shadow */

import yargs from 'yargs'
import logger from './logger'
import deps from './deps'
import * as tasks from './tasks'
import { rpad, hrtimeformat } from './utils'
import { delayedPromise, forEachSerial } from './async'

const checkCommands = (yarg, argv, required) => {
  if (argv._.length < required) { return yarg.showHelp() }
  const sequence = {}.hasOwnProperty.call(deps, argv._) ? deps[argv._] : [argv._[0]]
  const start = process.hrtime()
  let total, seq, diff

  async function serial() {
    await forEachSerial(sequence, async (func) => {
      seq = process.hrtime()
      await delayedPromise(0, tasks[func].call(this))
      diff = process.hrtime(seq)
      logger.info(`Resolved ${rpad(func, ' ', 8)} ${hrtimeformat(diff)}`)
    })
    total = process.hrtime(start)
    logger.info('---')
    logger.info(`Finished ${rpad(argv._[0], ' ', 8)} ${hrtimeformat(total)}`)
  }

  // bootstrap
  return serial()
}

let { argv } = yargs.fail((msg, err) => {
  if (err) { throw err }
  logger.info(msg)
  yargs.showHelp()
}).epilog('For more information on a command, enter $0 <command> --help')
  .usage('\nUsage: $0 <command> [options]')
  .demand(1)
  .example('$0 create [options]')
  .command('create', 'Create an Epub dir structure', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 create [options]')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('markit', 'Convert markdown to HTML', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 markit')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('serve', 'Start a development server', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 serve')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('scripts', 'Compile the scripts', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 scripts')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('render', 'Render layouts', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 render')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('sass', 'Compile SCSS', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 sass')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('inject', 'Inject scripts and styles', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 inject')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('copy', 'Copy static assets to output dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 copy')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('opf', 'Generate the opf', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 opf')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('clean', 'Remove the _output dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 clean')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('build', 'Build the _output dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 build')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('site', 'Clone Gomez', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })

    .options('path', {
      alias: 'p',
      demand: false,
      default: './_site',
      describe: 'Define the site path',
      type: 'string'
    })

    .usage('\nUsage: $0 site [path]')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('init', 'Initalize b-ber', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })

    .options('src', {
      alias: 's',
      demand: false,
      default: './_book',
      describe: 'Define the book\'s src path',
      type: 'string'
    })

    .options('dist', {
      alias: 'd',
      demand: false,
      default: './book',
      describe: 'Define the book\'s dist path',
      type: 'string'
    })

    .usage('\nUsage: $0 init')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('publish', 'Move book to the _site dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })

    .options('input', {
      alias: 'i',
      demand: false,
      default: './book',
      describe: 'Define the input path',
      type: 'string'
    })

    .options('output', {
      alias: 'o',
      demand: false,
      default: './_site',
      describe: 'Define the output path',
      type: 'string'
    })

    .usage('\nUsage: $0 publish')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('epub', 'Create an Epub', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 epub')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('mobi', 'Create a Mobi', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      logger.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 mobi')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })

