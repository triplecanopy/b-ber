#!/usr/bin/env node

/* eslint-disable no-shadow */

import yargs from 'yargs'
import deps from './deps'
import * as tasks from './tasks'
import { log } from './log'
import { rpad, hrtimeformat } from './utils'
import { delayedPromise, forEachSerial } from './async'

const showCustomHelp = () => console.log(`
Usage: bber <command> [options]

Where <command> is one of:
  clean, config, copy, create, deploy, props, init, inject, md, opf, publish,
  render, sass, scripts, serve, site, tasks, templates, utils, loi, epub, mobi,
  watch, editor, xml, generate

Some common commands are:

  Creating books
    bber init       Create an empty project and file structure, defaults to \`_book\`
    bber generate   Create a new chapter and add it to pages.yml. Accepts
                    arguments for metadata.
    bber watch      Preview the book in a web-browser during development
    bber build      Compile and copy assets in \`_book\` to the output directory,
                    defaults to \`book\`
    bber epub       Compile an epub from the assets in \`book\`
    bber mobi       Compile a mobi file from the assets in \`book\`

  Viewing books
    bber site     Clone the bber-reader into \`site\`
    bber serve    Preview the compiled epub in the bber-reader

For more information on a command, enter bber <command> --help
`)

const checkCommands = (yarg, argv, required) => {
  // No command was given, and help has already been shown in `yargs.fail`
  if (!argv._.length) {
    return false
  }

  // Command was given but doesn't exist in `tasks` or the sequence doesn't exist in `deps`
  if (argv._.length && (typeof tasks[argv._[0]] === 'undefined' && !{}.hasOwnProperty.call(deps, argv._[0]))) {
    log.info(`The task \`${argv._[0]}\` does not exist.`)
    return showCustomHelp()
  }

  // A valid command was given, but there are args missing
  if (argv._.length < required) {
    log.info(`Missing required arguments for \`${argv._}\``)
    return yargs.showHelp()
  }


  const sequence = {}.hasOwnProperty.call(deps, argv._[0]) ? deps[argv._[0]] : [argv._[0]]
  const start = process.hrtime()
  let total, seq, diff

  async function serial() {
    await forEachSerial(sequence, async (func) => {
      seq = process.hrtime()
      await delayedPromise(0, tasks[func].call(this))
      diff = process.hrtime(seq)
      log.info(`Resolved ${rpad(func, ' ', 8)} ${hrtimeformat(diff)}`)
    })
    total = process.hrtime(start)
    log.info('---')
    log.info(`Finished ${rpad(argv._[0], ' ', 8)} ${hrtimeformat(total)}`)
  }

  return serial()
}

let { argv } = yargs.fail((msg, err) => {
  if (err) { throw err }
  log.info(msg)
  return showCustomHelp()
}).epilog('For more information on a command, enter $0 <command> --help')
  .usage('\nUsage: $0 <command> [options]')
  .demand(1)
  .example('$0 create [options]')

  .command('build', 'Build the `book` dir (calls \'clean\', \'create\', \'copy\', \'sass\', \'scripts\', \'render\', \'loi\', \'inject\', \'opf\')', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 build')
    .config({ cmd: 'build' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('clean', 'Remove the _output dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 clean')
    .config({ cmd: 'clean' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('copy', 'Copy static assets to output dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 copy')
    .config({ cmd: 'copy' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('create', 'Create an Epub dir structure', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 create [options]')
    .config({ cmd: 'create' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('generate', 'Create a new chapter and add it to pages.yml. Accepts arguments for metadata.', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })

    .alias('g', 'generate')

    .options('section_title', {
      alias: 'n',
      demand: false,
      default: '',
      describe: 'Define the chapters\'s title',
      type: 'string'
    })

    .options('landmark_type', {
      alias: 'l',
      demand: false,
      default: '',
      describe: 'Define the chapters\'s landmark type',
      type: 'string'
    })

    .options('landmark_title', {
      alias: 't',
      demand: false,
      default: '',
      describe: 'Define the chapters\'s landmark title',
      type: 'string'
    })

    .usage('\nUsage: $0 generate [options]')
    .config({ cmd: 'generate' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('editor', 'Start web-based editor', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 editor')
    .config({ cmd: 'editor' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('epub', 'Create an Epub (calls \'clean\', \'create\', \'copy\', \'sass\', \'scripts\', \'render\', \'loi\', \'inject\', \'opf\')', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 epub')
    .config({ cmd: 'epub' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('init', 'Initalize b-ber', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })

    .options('src', {
      alias: 's',
      demand: false,
      default: '_book',
      describe: 'Define the book\'s src path',
      type: 'string'
    })

    .options('dist', {
      alias: 'd',
      demand: false,
      default: 'book',
      describe: 'Define the book\'s dist path',
      type: 'string'
    })

    .usage('\nUsage: $0 init')
    .config({ cmd: 'init' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('inject', 'Inject scripts and styles into XHTML', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 inject')
    .config({ cmd: 'inject' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('mobi', 'Create a Mobi', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 mobi')
    .config({ cmd: 'mobi' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('opf', 'Generate the opf', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 opf')
    .config({ cmd: 'opf' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('publish', 'Move book to the _site dir', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
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
    .config({ cmd: 'publish' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('render', 'Transform Markdown to XHTML', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 render')
    .config({ cmd: 'render' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('scripts', 'Transform coffeescript to JavaScript', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 scripts')
    .config({ cmd: 'scripts' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('sass', 'Compile SCSS', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 sass')
    .config({ cmd: 'sass' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('serve', 'Preview a book in the bber-reader', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 serve')
    .config({ cmd: 'serve' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('site', 'Download bber-reader', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
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
    .config({ cmd: 'path]' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('theme', 'Select a theme for the book', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })

    .options('list', {
      alias: 'l',
      demand: false,
      describe: 'List the installed themes',
      type: 'boolean'
    })

    .options('set', {
      alias: 's',
      demand: false,
      describe: 'Set the current theme',
      type: 'string'
    })

    .usage('\nUsage: $0 theme')
    .config({ cmd: 'theme' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('watch', 'Preview a book in the browser', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 watch')
    .config({ cmd: 'watch' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

  .command('xml', 'Export a book as an XML document', (yargs) => {
    ({ argv } = yargs.fail((msg, err) => {
      if (err) { throw err }
      log.info(msg)
      yargs.showHelp()
    })
    .usage('\nUsage: $0 xml')
    .config({ cmd: 'xml' })
    .alias('h', 'help')
    .help('help')
    .wrap(null))
    // checkCommands(yargs, argv, 1)
  })

checkCommands(yargs, argv, 1)
