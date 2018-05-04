/**
 * Export XHTML in the epub output directory as a single XML document
 * @module xml
 */


import path from 'path'
import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import HtmlToXml from '@canopycanopycanopy/b-ber-lib/HtmlToXml'
import {parseHTMLFiles} from '@canopycanopycanopy/b-ber-lib/utils'
import state from '@canopycanopycanopy/b-ber-lib/State'
import {serialize} from '../async'
import * as tasks from '../'

const cwd = process.cwd()
const parser = new HtmlToXml()
const sequence = ['clean', 'container', 'sass', 'copy', 'scripts', 'render', 'loi', 'footnotes', 'inject', 'opf']


/**
 * [description]
 * @return {Object<Promise|Error>}
 */
const initialize = () =>
    new Promise(resolve => {
        state.update('build', 'epub') // set the proper build vars
        state.update('toc', state.buildTypes.epub.tocEntries)
        state.update('spine', state.buildTypes.epub.spineEntries)

        return serialize(sequence, tasks).then(() => {
            resolve(state.spine.map(n => n.fileName))
        })
    })


/**
 * [description]
 * @param  {String} str [description]
 * @return {Object<Promise|Error>}
 */

const inddFRMT = str =>
    new Promise(resolve => {
        const rmvComments = str.replace(/<!--[\s\S]*?-->/g, "") // removes comments
        const rmvBreaks = rmvComments.replace(/\/pagebreak>[\s\S]*?</g, "/pagebreak><") // removes whitespace between pagebreak and following selectors
        resolve(rmvBreaks)
    })

/**
 * [description]
 * @param  {String} str [description]
 * @return {Object<Promise|Error>}
 */

const writeXML = str =>
    new Promise(resolve => {
        const fpath = path.join(cwd, `Export-${new Date().toISOString().replace(/:/g, '-')}.xml`)
        fs.writeFile(fpath, str, 'utf8', err => {
            if (err) throw err
            resolve()
        })
    })

/**
 * [description]
 * @return {Object<Promise|Error>}
 */
const xml = () =>
    new Promise(resolve =>
        initialize()
            .then(manifest => parseHTMLFiles(manifest, parser, state.dist))
            .then(inddFRMT)
            .then(writeXML)
            .catch(err => log.error(err))
            .then(resolve)
    )

export default xml
