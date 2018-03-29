/* eslint-disable class-methods-use-this */

/**
 * Scans directory contents and reads YAML files to create the `spine` and
 * `guide` elements in the `content.opf`. Writes essential navigation
 * documents (`toc.ncx`, `toc.xhtml`) to the output directory
 * @module navigation
 * @see {@link module:navigation#Navigation}
 */

import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import find from 'lodash/find'
import difference from 'lodash/difference'
import uniq from 'lodash/uniq'
import remove from 'lodash/remove'
import isArray from 'lodash/isArray'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import state from '@canopycanopycanopy/b-ber-lib/State'
import ManifestItemProperties from '@canopycanopycanopy/b-ber-lib/ManifestItemProperties'
import log from '@canopycanopycanopy/b-ber-logger'
import Toc from '@canopycanopycanopy/b-ber-templates/Toc'
import Ncx from '@canopycanopycanopy/b-ber-templates/Ncx'
// import Opf from '@canopycanopycanopy/b-ber-templates/Opf'
import Guide from '@canopycanopycanopy/b-ber-templates/Opf/Guide'
import Spine from '@canopycanopycanopy/b-ber-templates/Opf/Spine'


import {promiseAll, nestedContentToYAML, flattenSpineFromYAML, modelFromString, opsPath} from '@canopycanopycanopy/b-ber-lib/utils'
// import {pathInfoFromFiles} from '@canopycanopycanopy/b-ber-tasks/opf/helpers' // TODO: fixme

// copied from opf/helpers
const isRemote = file => /^http/.test(file)

const pathInfoFromFile = (file, dest) => {
    if (isRemote(file)) {
        return {
            absolutePath: file,
            opsPath: file,
            name: file,
            extension: '',
            remote: true,
        }
    } else {
        return {
            absolutePath: file,
            opsPath: opsPath(file, dest),
            name: path.basename(file),
            extension: path.extname(file),
            remote: false,
        }
    }
}

const pathInfoFromFiles = (arr, dest) =>
    arr.map(file => pathInfoFromFile(file, dest))


// end


/**
 * @alias module:navigation#Navigation
 */
class Navigation {
    get src() {
        return state.src
    }

    get dist() {
        return state.dist
    }

    get build() {
        return state.build
    }

    /**
     * [constructor description]
     * @constructor
     * @return {Object}
     */
    constructor() {
        this.navDocs = [
            'toc.ncx',
            `text${path.sep}toc.xhtml`,
        ]
    }

    /**
     * Remove the `toc.xhtml` and `toc.ncx` from the output directory
     * @return {Promise<Object|Error>}
     */
    createEmptyNavDocuments() {
        return new Promise(resolve => {
            log.info(`Creating navigation documents [${this.navDocs.join(', ')}]`)
            const promises = []
            this.navDocs.forEach(_ => {
                promises.push(new Promise(() =>
                    fs.writeFile(path.join(this.dist, 'OPS', _), '', err => {
                        if (err) throw err

                        const fileData = {
                            ...modelFromString(_.substring(0, _.indexOf('.')), state.src),
                            in_toc: false,
                            linear: false,
                            generated: true,
                        }

                        state.add('spine', fileData)

                        resolve()
                    })
                ))
            })

            return promiseAll(promises).then(resolve)
        })
    }

    /**
     * Retrieve a list of all XHTML files in the output directory
     * @return {Promise<Object|Error>}
     */
    getAllXhtmlFiles() {
        return new Promise(resolve =>
            rrdir(`${this.dist}${path.sep}OPS`, (err, filearr) => {
                if (err) throw err
                // TODO: better testing here, make sure we're not including symlinks, for example
                const fileObjects = pathInfoFromFiles(filearr, this.dist)
                // only get html files
                const xhtmlFileObjects = fileObjects.filter(_ => ManifestItemProperties.isHTML(_))
                // prepare for diffing
                const filesFromSystem = uniq(xhtmlFileObjects.map(_ => path.basename(_.name, _.extension)))
                resolve({filesFromSystem, fileObjects})
            })
        )
    }

    deepRemove(collection, fileName) {
        const found = remove(collection, {fileName})
        if (found.length) {
            return collection
        }

        collection.forEach(item => { // check against prop names
            if (item.nodes && item.nodes.length) {
                return this.deepRemove(item.nodes, fileName)
            }
            return item
        })

        return collection
    }

    /**
     * Resolve discrepancies between files that exist in the output directory and
     * those that are listed in the YAML manifest
     * @param  {Array} filesFromSystem XHTML files in the output directory
     * @param  {Array} filesFromYaml   Entries in the YAML manifest
     * @return {Promise<Object<Array>|Error>}
     */
    compareXhtmlWithYaml({filesFromSystem, fileObjects}) {
        return new Promise(resolve => { // eslint-disable-line consistent-return
            const {spine} = state // current build process's spine
            const {spineList} = state.buildTypes[this.build] // spine items pulled in from type.yml file
            const flow = uniq(spine.map(a => a.generated ? null : a.fileName).filter(Boolean)) // one-dimensional flow of the book used for the spine, omitting figures pages
            const pages = flattenSpineFromYAML(spineList)

            const missingFiles = difference(flow, filesFromSystem) // extra files on system
            const missingEntries = difference(filesFromSystem, pages) // extra entries in YAML

            if (missingFiles.length || missingEntries.length) {
                // there are discrepencies between the files on the system and files
                // declared in the `this.build`.yml file
                if (missingFiles.length) {
                    // there are extra entries in the YAML (i.e., missing XHTML pages)

                    missingEntries.forEach(_ => {
                        log.warn(`Removing redundant entry [${_}] in ${this.build}.yml`)
                    })

                    missingFiles.forEach(item => {
                        remove(spine, {fileName: item})
                        state.update('spine', spine)

                        const _flowIndex = flow.indexOf(item)
                        flow.splice(_flowIndex, 1)

                        const _toc = this.deepRemove(state.toc, item)
                        state.update('toc', _toc)
                    })

                    const yamlpath = path.join(this.src, `${this.build}.yml`)
                    const nestedYamlToc = nestedContentToYAML(state.toc)
                    const content = isArray(nestedYamlToc) && nestedYamlToc.length === 0 ? '' : YamlAdaptor.dump(nestedYamlToc)

                    fs.writeFile(yamlpath, content, err => {
                        if (err) throw err
                        log.info(`Wrote ${this.build}.yml`)
                    })
                }

                if (missingEntries.length) {
                    // there are missing entries in the YAML (i.e., extra XHTML pages),
                    // but we don't know where to interleave them, so we just append
                    // them to the top-level list of files

                    missingEntries.forEach(a => {
                        if (/figure_/.test(a) === false) { // don't warn for figures pages
                            log.warn(`Adding missing entry [${a}] to [${this.build}.yml]`)
                        }
                    })


                    // add the missing entry to the spine
                    // TODO: add to toc? add to flow/pages?
                    // TODO: there need to be some handlers for parsing user-facing attrs
                    const missingEntriesWithAttributes = missingEntries.map(fileName => {
                        if (/figure_/.test(fileName)) return null
                        const item = find(spine, {fileName})

                        // if the file has attributes that need to be listed
                        // in the type.yml files, then we return an object
                        // with the appropriate attributes. otherwise, we
                        // return a string (the file's basename)
                        if (item && (item.in_toc === false || item.linear === false)) {
                            const fileObj = {[fileName]: {}}
                            if (item.in_toc === false) fileObj[fileName].in_toc = false
                            if (item.linear === false) fileObj[fileName].linear = false
                            return fileObj
                        }
                        return fileName
                    }).filter(Boolean)


                    const yamlpath = path.join(this.src, `${this.build}.yml`)
                    const content = isArray(missingEntriesWithAttributes) && missingEntriesWithAttributes.length === 0 ? '' : YamlAdaptor.dump(missingEntriesWithAttributes)

                    fs.appendFile(yamlpath, content, err => {
                        if (err) throw err
                    })
                }
            }

            const filesFromYaml = {entries: pages, flow}
            resolve({pages, flow, fileObjects, filesFromSystem, filesFromYaml})
        })
    }

    createTocStringsFromTemplate({pages, ...args}) {
        log.info('Building [toc.xhtml]')
        return new Promise(resolve => {
            const strings = {}
            const {toc} = state
            const tocHTML = Toc.items(toc)

            strings.toc = renderLayouts(
                new File({
                    path: '.tmp',
                    layout: 'document',
                    contents: new Buffer(tocHTML),
                }),
                {document: Toc.document()}
            ).contents.toString()

            resolve({pages, strings, ...args})
        })
    }

    createNcxStringsFromTemplate({pages, ...args}) {
        log.info('Building [toc.ncx]')
        return new Promise(resolve => {
            const strings = {}
            const {toc} = state
            const ncxXML = Ncx.navPoints(toc)

            strings.ncx = renderLayouts(
                new File({
                    path: '.tmp',
                    layout: 'document',
                    contents: new Buffer(ncxXML),
                }), {document: Ncx.document()}
            ).contents.toString()

            resolve({pages, strings, ...args})
        })
    }

    createGuideStringsFromTemplate({flow, fileObjects, ...args}) {
        log.info('Building [guide]')
        return new Promise(resolve => {
            const strings = {}
            const {spine} = state
            const guideXML = Guide.items(spine)

            strings.guide = renderLayouts(
                new File({
                    path: '.tmp',
                    layout: 'guide',
                    contents: new Buffer(guideXML),
                }),
                {guide: Guide.body()}
            ).contents.toString()

            resolve({strings, flow, fileObjects, ...args})
        })
    }

    createSpineStringsFromTemplate({flow, fileObjects, ...args}) {
        log.info('Building [spine]')
        return new Promise(resolve => {
            const strings = {}
            const {spine} = state

            // TODO: find somewhere better for this. we add entries to the spine
            // programatically, but then they're also found on the system, so we
            // dedupe them here
            const generatedFiles = remove(spine, a => a.generated === true)
            generatedFiles.forEach(a => {
                if (!find(spine, {fileName: a.fileName})) {
                    spine.push(a)
                }
            })

            const spineXML = Spine.items(spine)

            strings.spine = renderLayouts(
                new File({
                    path: '.tmp',
                    layout: 'spine',
                    contents: new Buffer(spineXML),
                }),
                {spine: Spine.body()}
            ).contents.toString()

            resolve({strings, flow, fileObjects, ...args})
        })
    }

    /**
     * Returns a new object from an array of return values from `Promise.all`.
     * Deep merges a single property passed in as `property`. Uses `Object.assign`
     * @param  {Array<Object>} args  The objects to merge
     * @param  {String} property     The properties of `args` to merge
     * @return {Object}              Deep merged object
     */
    deepMergePromiseArrayValues(args, property) {
        const props = Object.assign({}, ...args.map(_ => _[property]))
        return Object.assign({}, [...args], {[property]: props}) // TODO: this is weird ...
    }

    writeTocXhtmlFile(args) {
        return new Promise(resolve => {
            const result = this.deepMergePromiseArrayValues(args, 'strings')
            const {toc} = result.strings
            const filepath = path.join(this.dist, 'OPS', 'text', 'toc.xhtml')
            fs.writeFile(filepath, toc, err => {
                if (err) throw err
                log.info(`Wrote toc.xhtml [${filepath}]`)
                resolve(result)
            })
        })
    }

    writeTocNcxFile(args) {
        return new Promise(resolve => {
            const result = this.deepMergePromiseArrayValues(args, 'strings')
            const {ncx} = result.strings
            const filepath = path.join(this.dist, 'OPS', 'toc.ncx')
            fs.writeFile(filepath, ncx, err => {
                if (err) throw err
                log.info(`Wrote toc.ncx [${filepath}]`)
                resolve(result)
            })
        })
    }

    normalizeResponseObject(args) {
        return new Promise(resolve => {
            const normalizedResponse = this.deepMergePromiseArrayValues(args, 'strings')
            resolve(normalizedResponse)
        })
    }

    /**
     * Initialize promise chain to build ebook navigation structure
     * @return {Promise<Object|Error>}
     */
    init() {
        return new Promise(resolve =>
            this.createEmptyNavDocuments()
                .then(resp => this.getAllXhtmlFiles(resp))
                .then(resp => this.compareXhtmlWithYaml(resp))
                .then(resp => promiseAll([
                    this.createTocStringsFromTemplate(resp),
                    this.createNcxStringsFromTemplate(resp),
                    this.createGuideStringsFromTemplate(resp),
                    this.createSpineStringsFromTemplate(resp),
                ]))

                // TODO: while the files are being parsed, attributes should be added to
                // the file objects, so that we don't have to perform multiple lookups
                // throughout the build. this means that we're causing side-effects, but
                // it'd be an efficient way of creating easily-accessible objects later
                // on.

                .then(resp => promiseAll([
                    // the two following methods both merge the results from `Promise.all`
                    // and return identical new objects containing all navigation
                    // information to the next method in the chain
                    this.writeTocXhtmlFile(resp),
                    this.writeTocNcxFile(resp),
                ]))
                // merge the values from the arrays returned above and pass the response
                // along to write the `content.opf`
                .then(resp => this.normalizeResponseObject(resp))
                .catch(err => log.error(err))
                .then(resolve)
        )
    }
}

export default Navigation
