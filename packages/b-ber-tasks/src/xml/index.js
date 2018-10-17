/**
 * Export XHTML in the epub output directory as a single XML document
 * @module xml
 */

import path from 'path'
import fs from 'fs-extra'
import isPlainObject from 'lodash/isPlainObject'
import log from '@canopycanopycanopy/b-ber-logger'
import HtmlToXml from '@canopycanopycanopy/b-ber-lib/HtmlToXml'
import state from '@canopycanopycanopy/b-ber-lib/State'
import * as tasks from '../'

const cwd = process.cwd()
const parser = new HtmlToXml()
const sequence = [
    'clean',
    'container',
    'sass',
    'copy',
    'scripts',
    'render',
    'loi',
    'footnotes',
    'inject',
    'opf',
]

const initialize = () =>
    new Promise(resolve => {
        state.update('build', 'epub') // set the proper build vars
        state.update('toc', state.buildTypes.epub.tocEntries)
        state.update('spine', state.buildTypes.epub.spineEntries)

        return tasks.async.serialize(sequence, tasks).then(() => {
            resolve(state.spine.map(n => n.fileName))
        })
    })

const formatForInDesign = str =>
    new Promise(resolve => {
        let str_ = str
        str_ = str_.replace(/<!--[\s\S]*?-->/g, '')
        str_ = str_.replace(/\/pagebreak>[\s\S]*?</g, '/pagebreak><')
        resolve(str_)
    })

const writeXML = str => {
    const fpath = path.join(
        cwd,
        `Export-${new Date().toISOString().replace(/:/g, '-')}.xml`,
    )
    return fs.writeFile(fpath, str, 'utf8')
}

const parseHTMLFiles = (files, parser, dist) =>
    new Promise(resolve => {
        const dirname = path.join(dist, 'OPS', 'text')
        const promises = files
            .map((a, index, arr) => {
                let data

                const fname = isPlainObject(a)
                    ? Object.keys(a)[0]
                    : typeof a === 'string'
                        ? a
                        : null
                const ext = '.xhtml'

                if (!fname) return null

                const fpath = path.join(dirname, `${fname}${ext}`)

                try {
                    if (!fs.existsSync(fpath)) return null
                    data = fs.readFileSync(fpath, 'utf8')
                } catch (err) {
                    log.warn(err.message)
                    return null
                }

                return parser.parse(data, index, arr)
            })
            .filter(Boolean)

        Promise.all(promises)
            .catch(log.error)
            .then(docs => resolve(docs.join('\n')))
    })

/**
 * [description]
 * @return {Object<Promise|Error>}
 */
const xml = () =>
    initialize()
        .then(manifest => parseHTMLFiles(manifest, parser, state.dist))
        .then(formatForInDesign)
        .then(writeXML)
        .catch(log.error)

export default xml
