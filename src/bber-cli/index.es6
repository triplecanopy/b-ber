#!/usr/bin/env node

/* eslint-disable no-shadow, no-console, no-unused-vars */

/**
 * @module cli
 */

import yargs from 'yargs'
import * as commands from 'bber-cli/cmd'

/**
 * Start the build
 * @memberOf module:cli
 * @return {Object}
 */
const init = () => {
  const { build, clean, copy, container/* , editor */, generate, init, inject,
    footnotes, opf, pdf, mobiCSS, publish, render, scripts, sass, serve, site,
    theme, watch, xml, create, cover } = commands

  /**
   * Shows custom help if a CLI command fails
   * @return {String}
   */
  const showCustomHelp = () => console.log(`
  Usage: bber <command> [options]

  Where <command> is one of:
    build, clean, copy, container, generate, init, inject,
    footnotes, opf, pdf, mobiCSS, publish, render, scripts, sass, serve, site,
    theme, watch, xml, create, cover

  Some common commands are:

    Creating books
      bber create     Start a new project
      bber generate   Create a new chapter. Accepts arguments for metadata.
      bber watch      Preview the book in a browser during development
      bber build      Create an ePub, mobi, PDF, or all file formats

    Viewing books
      bber site     Clone the bber-reader into \`site\`
      bber serve    Preview the compiled epub in the bber-reader

  For more information on a command, enter bber <command> --help
  `)

  /**
   * checkCommands
   * @param  {Object} yargs Yargs module
   * @return {Object|Error}
   */
  const checkCommands = (yargs) => {
    if (!{}.hasOwnProperty.call(commands, yargs.argv._[0])) {
      showCustomHelp()
      process.exit(0)
    }
  }


  const { argv } = yargs // eslint-disable-line no-unused-vars
    .fail((msg, err, yargs) => {
      console.log(msg)
      showCustomHelp()
      if (process.argv.indexOf('-v') > 0 || process.argv.indexOf('--verbose') > 0) {
        console.log(err.stack)
      }
      process.exit(0)
    })

    .command(build)
    .command(clean)
    .command(copy)
    .command(container)
    // .command(editor)
    .command(generate)
    .command(init)
    .command(inject)
    .command(footnotes)
    .command(opf)
    .command(pdf)
    .command(publish)
    .command(render)
    .command(scripts)
    .command(sass)
    .command(serve)
    .command(site)
    .command(theme)
    .command(watch)
    .command(xml)
    .command(create)
    .command(cover)

    .options({
      v: {
        alias: 'verbose',
        describe: 'Show verbose output',
        default: false,
        type: 'boolean',
      },
    })
    .help('h')
    .alias('h', 'help')
    .demandCommand()
    .wrap(72)
    .argv

  checkCommands(yargs)
}

init()
