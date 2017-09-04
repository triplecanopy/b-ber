/* eslint-disable class-methods-use-this */
/**
 * Scans directory contents and reads YAML files to create the `spine` and
 * `guide` elements in the `content.opf`. Writes essential navigation
 * documents (`toc.ncx`, `toc.xhtml`) to the output directory
 * @module navigation
 * @see {@link module:navigation#Navigation}
 */

// vendor
import Promise from 'zousan'
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import Yaml from 'bber-lib/yaml'
import { find, difference, uniq, remove, isArray } from 'lodash'

// utility
import store from 'bber-lib/store'
import Props from 'bber-lib/props'
import { log } from 'bber-plugins'
import {
    src,
    dist,
    build,
    promiseAll,
    nestedContentToYAML,
    flattenSpineFromYAML,
    // modelFromString,
} from 'bber-utils'

// templates
import { tocTmpl, tocItem } from 'bber-templates/toc-xhtml'
import { ncxTmpl, navPoint } from 'bber-templates/toc-ncx'
import { opfGuide, opfSpine, guideItems, spineItems } from 'bber-templates/opf'

// helpers
import { pathInfoFromFiles } from 'bber-output/opf/helpers'

/**
 * @alias module:navigation#Navigation
 */
class Navigation {
    get src() {
        return src()
    }

    get dist() {
        return dist()
    }

    get build() {
        return build()
    }

    /**
     * [constructor description]
     * @constructor
     * @return {Object}
     */
    constructor() {
        this.navDocs = [
            'toc.ncx',
            'toc.xhtml',
        ]
    }

    /**
     * Remove the `toc.xhtml` and `toc.ncx` from the output directory
     * @return {Promise<Object|Error>}
     */
    createEmptyNavDocuments() {
        return new Promise((resolve) => {
            log.info(`bber-output/opf: Creating navigation documents: [${this.navDocs.join(', ')}]`)
            const promises = []
            this.navDocs.forEach((_) => {
                promises.push(new Promise(() =>
                    fs.writeFile(path.join(this.dist, 'OPS', _), '', (err) => {
                        if (err) { throw err }
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
            rrdir(`${this.dist}/OPS`, (err, filearr) => {
                if (err) { throw err }
                // TODO: better testing here, make sure we're not including symlinks, for example
                const fileObjects = pathInfoFromFiles(filearr, this.dist)
                // only get html files
                const xhtmlFileObjects = fileObjects.filter(_ => Props.isHTML(_))
                // prepare for diffing
                const filesFromSystem = uniq(xhtmlFileObjects.map(_ => path.basename(_.name, _.extension)))
                resolve({ filesFromSystem, fileObjects })
            })
        )
    }

    deepRemove(collection, fileName) {
        const found = remove(collection, { fileName })
        if (found.length) {
            return collection
        }

        collection.forEach((item) => { // check against prop names
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
    compareXhtmlWithYaml({ filesFromSystem, fileObjects }) {
        return new Promise((resolve) => { // eslint-disable-line consistent-return
            const { spine } = store // current build process's spine
            const { spineList } = store.bber[this.build] // spine items pulled in from type.yml file
            const flow = uniq(spine.map(_ => _.generated ? null : _.fileName).filter(Boolean)) // one-dimensional flow of the book used for the spine, omitting figures pages
            const pages = flattenSpineFromYAML(spineList)

            const missingFiles = difference(flow, filesFromSystem) // extra files on system
            const missingEntries = difference(filesFromSystem, pages) // extra entries in YAML

            if (missingFiles.length || missingEntries.length) {
                // there are discrepencies between the files on the system and files
                // declared in the `this.build`.yml file
                if (missingFiles.length) {
                    // there are extra entries in the YAML (i.e., missing XHTML pages)
                    log.warn(`bber-output/opf: XHTML pages for ${this.build}.yml do not exist:\n${
                        missingEntries.reduce((acc, curr) =>
                            acc.concat(`  ${curr}\n`), '').replace(/\n$/, '')}`
                        )
                    log.warn(`Removing redundant entries in ${this.build}.yml`)

                    missingFiles.forEach((item) => {
                        remove(spine, { fileName: item })
                        store.update('spine', spine)

                        const _pagesIndex = pages.indexOf(item)
                        pages.splice(_pagesIndex, 1)

                        const _flowIndex = flow.indexOf(item)
                        flow.splice(_flowIndex, 1)

                        const _toc = this.deepRemove(store.toc, item)
                        store.update('toc', _toc)
                    })

                    const yamlpath = path.join(this.src, `${this.build}.yml`)
                    const nestedYamlToc = nestedContentToYAML(store.toc)
                    const content = isArray(nestedYamlToc) && nestedYamlToc.length === 0 ? '' : Yaml.dump(nestedYamlToc)

                    fs.writeFile(yamlpath, content, (err) => {
                        if (err) { throw err }
                        log.info(`bber-output/opf: Wrote ${this.build}.yml`)
                    })
                }

                if (missingEntries.length) {
                    // there are missing entries in the YAML (i.e., extra XHTML pages),
                    // but we don't know where to interleave them, so we just append
                    // them to the top-level list of files
                    log.warn(`bber-output/opf: Missing entries in ${this.build}.yml:\n${
                        missingEntries.reduce((acc, curr) =>
                            acc.concat(`  ${curr}\n`), '').replace(/\n$/, '')}`
                        )
                    log.warn(`bber-output/opf: Adding missing entries to [${this.build}.yml]`)

                    // add the missing entry to the spine
                    // TODO: add to toc? add to flow/pages?
                    // TODO: there need to be some handlers for parsing user-facing attrs
                    const missingEntriesWithAttributes = missingEntries.map((fileName) => {
                        if (/figure-/.test(fileName)) { return }
                        const item = find(spine, { fileName })
                        if (item && (item.in_toc === false || item.linear === false)) {
                            const fileObj = { [fileName]: {} }
                            if (item.in_toc === false) { fileObj[fileName].in_toc = false }
                            if (item.linear === false) { fileObj[fileName].linear = false }
                            return fileObj
                        }
                        return fileName
                    }).filter(Boolean)


                    const yamlpath = path.join(this.src, `${this.build}.yml`)
                    const content = isArray(missingEntriesWithAttributes) && missingEntriesWithAttributes.length === 0 ? '' : Yaml.dump(missingEntriesWithAttributes)

                    fs.appendFile(yamlpath, content, (err) => {
                        if (err) { throw err }
                    })
                }
            }

            const filesFromYaml = { entries: pages, flow }
            resolve({ pages, flow, fileObjects, filesFromSystem, filesFromYaml })
        })
    }

    createTocStringsFromTemplate({ pages, ...args }) {
        log.info('bber-output/opf: Building [toc.xhtml]')
        return new Promise((resolve) => {
            const strings = {}
            const { toc } = store
            const tocHTML = tocItem(toc)

            strings.toc = renderLayouts(new File({
                path: './.tmp',
                layout: 'tocTmpl',
                contents: new Buffer(tocHTML),
            }), { tocTmpl })
            .contents
            .toString()

            resolve({ pages, strings, ...args })
        })
    }

    createNcxStringsFromTemplate({ pages, ...args }) {
        log.info('bber-output/opf: Building [toc.ncx]')
        return new Promise((resolve) => {
            const strings = {}
            const { toc } = store
            const ncxXML = navPoint(toc)

            strings.ncx = renderLayouts(new File({
                path: './.tmp',
                layout: 'ncxTmpl',
                contents: new Buffer(ncxXML),
            }), { ncxTmpl })
            .contents
            .toString()

            resolve({ pages, strings, ...args })
        })
    }

    createGuideStringsFromTemplate({ flow, fileObjects, ...args }) {
        log.info('bber-output/opf: Building [guide]')
        return new Promise((resolve) => {
            const strings = {}
            const { spine } = store
            const guideXML = guideItems(spine)

            strings.guide = renderLayouts(new File({
                path: './.tmp',
                layout: 'opfGuide',
                contents: new Buffer(guideXML),
            }), { opfGuide })
            .contents
            .toString()

            resolve({ strings, flow, fileObjects, ...args })
        })
    }

    createSpineStringsFromTemplate({ flow, fileObjects, ...args }) {
        log.info('bber-output/opf: Building [spine]')
        return new Promise((resolve) => {
            const strings = {}
            const { spine } = store

            // TODO: find somewhere better for this. we add entries to the spine
            // programatically, but then they're also found on the system, so we
            // dedupe them here
            // const generatedFiles = remove(spine, _ => _.generated === true)
            // generatedFiles.forEach((_) => {
            //   if (!find(spine, { fileName: _.fileName })) {
            //     spine.push(_)
            //   }
            // })

            const spineXML = spineItems(spine)

            strings.spine = renderLayouts(new File({
                path: './.tmp',
                layout: 'opfSpine',
                contents: new Buffer(spineXML),
            }), { opfSpine })
            .contents
            .toString()

            resolve({ strings, flow, fileObjects, ...args })
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
        return Object.assign({}, [...args], { [property]: props }) // TODO: this is weird ...
    }

    writeTocXhtmlFile(args) {
        return new Promise((resolve) => {
            const result = this.deepMergePromiseArrayValues(args, 'strings')
            const { toc } = result.strings
            const filepath = path.join(this.dist, 'OPS', 'toc.xhtml')
            fs.writeFile(filepath, toc, (err) => {
                if (err) { throw err }
                log.info(`bber-output/opf: Wrote toc.xhtml: [${filepath}]`)
                resolve(result)
            })
        })
    }

    writeTocNcxFile(args) {
        return new Promise((resolve) => {
            const result = this.deepMergePromiseArrayValues(args, 'strings')
            const { ncx } = result.strings
            const filepath = path.join(this.dist, 'OPS', 'toc.ncx')
            fs.writeFile(filepath, ncx, (err) => {
                if (err) { throw err }
                log.info(`bber-output/opf: Wrote toc.ncx: [${filepath}]`)
                resolve(result)
            })
        })
    }

    normalizeResponseObject(args) {
        return new Promise((resolve) => {
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
