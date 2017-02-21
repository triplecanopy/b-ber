#!/usr/bin/env node

/* eslint-disable no-shadow */

import yargs from 'yargs'
import fs from 'fs-extra'
import path from 'path'
import YAML from 'yamljs'
import config from './config'
import * as commands from './cmds'

const {
  build, clean, copy, create, editor, generate, init, inject, opf, publish,
  render, scripts, sass, serve, site, theme, watch, xml } = commands


const cwd = process.cwd()

const showCustomHelp = () => console.log(`
Usage: bber <command> [options]

Where <command> is one of:
  build, clean, copy, create, editor, generate, init, inject, opf, publish,
  render, scripts, sass, serve, site, theme, watch, xml

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

const checkCommands = (yargs) => {
  if (!{}.hasOwnProperty.call(commands, yargs.argv._[0])) {
    showCustomHelp()
    process.exit(0)
  }
}

const configFileOrDefaults = (type) => {
  const buildConfig = { src: config.src, dist: `${config.dist}-${type}`, pageList: [] }
  const fpath = path.join(cwd, config.src, `${type}.yml`)
  try {
    if (fs.statSync(fpath)) {
      Object.assign(buildConfig, { pageList: YAML.load(fpath) })
    }
  }
  catch (err) {
    return buildConfig
  }
  return buildConfig
}

const { argv } = yargs // eslint-disable-line no-unused-vars
  .fail((msg, err, yargs) => {
    console.log(msg)
    showCustomHelp()
    process.exit(0)
  })

  .command(build)
  .command(clean)
  .command(copy)
  .command(create)
  .command(generate)
  .command(editor)
  .command(init)
  .command(inject)
  .command(opf)
  .command(publish)
  .command(render)
  .command(scripts)
  .command(sass)
  .command(serve)
  .command(site)
  .command(theme)
  .command(watch)
  .command(xml)

  .config({
    bber: {
      ...config,
      sample: configFileOrDefaults('sample'),
      epub: configFileOrDefaults('epub'),
      mobi: configFileOrDefaults('mobi'),
      pdf: configFileOrDefaults('pdf')
    }
  })

  .help('h')
  .alias('h', 'help')
  .demandCommand(1)
  .wrap(72)
  .argv

checkCommands(yargs)
