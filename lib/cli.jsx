#!/usr/bin/env node

/* eslint-disable no-shadow */

import yargs from 'yargs'
import * as tasks from './tasks'

const checkCommands = (yarg, argv, required, sequence) => {
  if (argv._.length < required) { return yarg.showHelp() }

  const seq = !sequence || sequence.length < 1 ? argv._ : sequence
  seq.map(_ => tasks[_])

  function delayedPromise(time, value) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(value), time)
    })
  }
  async function forEachSerial(iterable, asyncBlock) {
    for (let item of iterable) {
      await asyncBlock(item)
    }
  }

  async function serial() {
    await forEachSerial(seq, async (func) => {
      console.log("Resolved serial: " + await delayedPromise(0, func()))
    })
    console.log("Done with serial!")
  }

  // bootstrap
  return serial()
}

let { argv } = yargs.fail((msg, err) => {
  if (err) { throw err }
  console.log(msg)
  yargs.showHelp()
}).epilog('For more information on a command, enter $0 <command> --help')
  .usage('\nUsage: $0 <command> [options]')
  .demand(1)
  .example('$0 create [options]')
  .command('create', 'Create an Epub dir structure', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 serve')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('sass', 'Compile the sass', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      console.log(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 sass')
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    checkCommands(yargs, argv, 1)
  })
  .command('scripts', 'Compile the scripts', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
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
      console.log(msg)
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
