#!/usr/bin/env node

/* eslint-disable no-shadow, no-console, no-unused-vars, no-unused-expressions */
/**
 * @module cli
 */

import yargs from 'yargs'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes/sequences'
import * as commands from './cmd'

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
            bber serve      Preview the publication's contents in a browser
            bber build      Create an ePub, mobi, PDF, or all file formats

    For more information on a command, enter bber <command> --help

    bber version ${state.version}
    `)

    /**
     * checkCommands
     * @param  {Object} yargs Yargs module
     * @return {Object|Error}
     */
    const checkCommands = yargs => {

        const cmd = yargs.argv._[0]

        if (!{}.hasOwnProperty.call(commands, cmd)) {
            showCustomHelp()
            process.exit(0)
        }

        const cmdSequence = sequences[cmd] || [cmd]
        let commanders = {}

        if (cmd === 'build') {

            const {epub, mobi, pdf, web, sample, reader} = yargs.argv
            commanders = [epub, mobi, pdf, web, sample, reader].filter(Boolean).length === 0
                ? {epub: true, mobi: true, pdf: true, web: true, sample: true, reader: true} // build all by default
                : {epub, mobi, pdf, web, sample, reader}


            Object.entries(commanders).forEach(([k, v]) => {
                if (v) cmdSequence.push(...sequences[k])
            })

        }

        state.update('sequence', cmdSequence)
        log.registerSequence(state, cmd/*, commanders, sequences*/)

    }

    checkCommands(yargs)

    yargs
        .fail((msg, err, yargs) => {
            console.log(msg)
            showCustomHelp()
            console.log(err.stack)
            process.exit(1)
        })

        .command(commands.build)
        .command(commands.clean)
        .command(commands.copy)
        .command(commands.container)
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
        .command(commands.theme)
        .command(commands.serve)
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
