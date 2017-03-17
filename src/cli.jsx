#!/usr/bin/env node

/* eslint-disable no-shadow, no-console */

/**
 * @module cli
 */

import yargs from 'yargs'
import loader from './loader'
import * as commands from './cmds'

/**
 * Start the build
 * @memberOf module:cli
 * @return {}
 */
const load = () => {
  const {
    build, clean, copy, create/* , editor */, generate, init, inject, opf, pdf,
    /* mobiCSS, */publish, render, scripts, sass, serve, site, theme, watch, xml } = commands

  /**
   * Shows custom help if a CLI command fails
   * @return {String}
   */
  const showCustomHelp = () => console.log(`
  Usage: bber <command> [options]

  Where <command> is one of:
    build, clean, copy, create, editor, generate, init, inject, opf, pdf,
    publish, render, scripts, sass, serve, site, theme, watch, xml

  Some common commands are:

    Creating books
      bber init       Create an empty project and file structure, defaults to \`_book\`
      bber generate   Create a new chapter. Accepts arguments for metadata.
      bber watch      Preview the book in a web-browser during development
      bber build      Create an ePub, mobi, PDF, or all file formats

    Viewing books
      bber site     Clone the bber-reader into \`site\`
      bber serve    Preview the compiled epub in the bber-reader

  For more information on a command, enter bber <command> --help
  `)

  /**
   * checkCommands
   * @param  {Object} yargs
   * @return {}
   */
  const checkCommands = (yargs) => {
    if (!{}.hasOwnProperty.call(commands, yargs.argv._[0])) {
      showCustomHelp()
      process.exit(0)
    }
  }


  const { argv } = yargs // eslint-disable-line no-unused-vars
    .fail((msg/* , err, yargs */) => {
      console.log(msg)
      showCustomHelp()
      process.exit(0)
    })

    .command(build)
    .command(clean)
    .command(copy)
    .command(create)
    // .command(editor)
    .command(generate)
    .command(init)
    .command(inject)
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

    .help('h')
    .alias('h', 'help')
    .demandCommand()
    .wrap(72)
    .argv

  checkCommands(yargs)
}

loader(load)
