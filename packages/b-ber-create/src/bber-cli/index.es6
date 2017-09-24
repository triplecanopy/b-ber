#!/usr/bin/env node

/* eslint-disable no-shadow, no-console, no-unused-vars */

/**
 * @module cli
 */

import yargs from 'yargs'
import * as commands from 'bber-cli/cmd'
import { version } from 'bber-utils'

import { log } from 'bber-plugins'
import store from 'bber-lib/store'


import { sequences } from 'bber-shapes/sequences'

/**
 * Start the build
 * @memberOf module:cli
 * @return {Object}
 */
const init = () => {

    /**
     * Shows custom help if a CLI command fails
     * @return {String}
     */
    const showCustomHelp = () => console.log(`
    Usage: bber <command> [options]

    Where <command> is one of:

        ${
            Object.keys(commands).sort().reduce((acc, curr) => {
                const a = acc.split('\n')
                const l = a[a.length - 1].length
                return acc.concat(l > 70 ? `\n\t${curr}, ` : `${curr}, `)
            }, '').slice(0, -2)
        }


    Some common commands are:

        Creating projects
            bber create     Start a new project
            bber generate   Create a new chapter. Accepts arguments for metadata.
            bber watch      Preview the publication's contents in a browser
            bber build      Create an ePub, mobi, PDF, or all file formats

    For more information on a command, enter bber <command> --help

    bber version ${version()}
    `)

    /**
     * checkCommands
     * @param  {Object} yargs Yargs module
     * @return {Object|Error}
     */
    const checkCommands = (yargs) => {

        const cmd = yargs.argv._[0]

        if (!{}.hasOwnProperty.call(commands, cmd)) {
            showCustomHelp()
            process.exit(0)
        }

        let cmdSequence = sequences[cmd] || [cmd]
        let commanders = {}

        if (cmd === 'build') {

            const { epub, mobi, pdf, web, sample } = yargs.argv
            commanders = [epub, mobi, pdf, web, sample].filter(Boolean).length === 0
                ? { epub: true, mobi: true, pdf: true, web: true, sample: true } // build all by default
                : { epub, mobi, pdf, web, sample }

            Object.entries(commanders).forEach(([k, v]) => {
                if (v) { cmdSequence.push(...sequences[k]) }
            })

        }

        store.update('sequence', cmdSequence)
        log.registerSequence(store, cmd, commanders)

    }

    checkCommands(yargs)

    yargs // eslint-disable-line no-unused-vars
        .fail((msg, err, yargs) => {

            // TODO: log.error()

            console.log(msg)
            showCustomHelp()
            console.log(err.stack)
            process.exit(1)
        })

        .command(commands.build)
        .command(commands.clean)
        .command(commands.copy)
        .command(commands.container)
        // .command(commands.editor)
        .command(commands.generate)
        .command(commands.init)
        .command(commands.inject)
        .command(commands.footnotes)
        .command(commands.opf)
        .command(commands.pdf)
        .command(commands.publish)
        .command(commands.render)
        .command(commands.scripts)
        .command(commands.sass)
        // .command(commands.serve)
        // .command(commands.site)
        .command(commands.theme)
        .command(commands.watch)
        .command(commands.xml)
        .command(commands.create)
        .command(commands.cover)

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
        .wrap(70)
        .argv


}

init()
