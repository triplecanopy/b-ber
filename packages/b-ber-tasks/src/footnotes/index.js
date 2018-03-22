/**
 * @module footnotes
 */

/* eslint-disable class-methods-use-this */


import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import renderLayouts from 'layouts'
import {isArray} from 'lodash'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import {modelFromString} from '@canopycanopycanopy/b-ber-lib/utils'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'

const cwd = process.cwd()

class Footnotes {
    get src() {
        return state.src
    }
    get dist() {
        return state.dist
    }
    get footnotes() {
        return state.footnotes
    }

    get fileName() {
        return 'notes'
    }
    get file() {
        return {
            name: this.fileName,
            path: path.join(this.dist, 'OPS', 'text', `${this.fileName}.xhtml`),
        }
    }

    /**
     * @constructor
     */
    constructor() {
        this.init = this.init.bind(this)
    }

    writeFootnotes() {
        return new Promise(resolve => {
            const notes = this.footnotes.reduce((acc, cur) => acc.concat(cur.notes), '')
            const markup = renderLayouts(new File({
                path: '.tmp',
                layout: 'page',
                contents: new Buffer(notes),
            }), {page}).contents.toString()

            fs.writeFile(this.file.path, markup, 'utf8', err => {
                if (err) throw err

                const fileData = {
                    ...modelFromString(`${this.file.name}`, state.src),
                    in_toc: false,
                    linear: false,
                    generated: true,
                }

                state.add('spine', fileData)

                log.info(`Created default footnotes page [${this.file.name}.xhtml]`)

                resolve()
            })
        })
    }

    testParams(callback) {
        if (!this.src || !this.dist) {
            log.error(new Error(`[Footnotes#testParams] requires both [input] and [output] parameters`))
        }

        const input = path.resolve(cwd, this.src)
        const output = path.resolve(cwd, this.dist)

        try {
            if (!fs.existsSync(input)) {
                throw new Error(`Cannot resolve input path: [${input}]. Run [bber init] to start a new project`)
            }
        } catch (err) {
            log.error(err)
        }

        if (!isArray(this.footnotes)) {
            log.error(new Error(`[bber.state] has not initialized in [Footnotes#testParams], aborting`))
        }

        return fs.mkdirs(output, err => callback(err, this.footnotes))
    }

    init() {
        return new Promise(resolve =>
            this.testParams((err0, footnotes) => {
                if (err0) throw err0
                if (!footnotes.length) {
                    log.info('No footnotes found in source files')
                    return resolve(footnotes)
                }
                log.info('Generating linked footnotes from data found in source')
                return this.writeFootnotes()
                    .catch(err1 => log.error(err1))
                    .then(resolve)
            })
        )
    }
}

const footnotes = new Footnotes()
export default footnotes.init
