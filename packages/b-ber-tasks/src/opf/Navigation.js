/* eslint-disable class-methods-use-this */

// Scans directory contents and reads YAML files to create the `spine` and
// `guide` elements in the `content.opf`. Writes essential navigation documents
// (`toc.ncx`, `toc.xhtml`) to the output directory

import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import glob from 'glob'
// import rrdir from 'recursive-readdir'
import find from 'lodash/find'
import difference from 'lodash/difference'
import uniq from 'lodash/uniq'
import remove from 'lodash/remove'
import isArray from 'lodash/isArray'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import Toc from '@canopycanopycanopy/b-ber-templates/Toc'
import Ncx from '@canopycanopycanopy/b-ber-templates/Ncx'
import Guide from '@canopycanopycanopy/b-ber-templates/Opf/Guide'
import Spine from '@canopycanopycanopy/b-ber-templates/Opf/Spine'
import { YamlAdaptor, Template, ManifestItemProperties } from '@canopycanopycanopy/b-ber-lib'
import { flattenSpineFromYAML, nestedContentToYAML, pathInfoFromFiles } from './helpers'
import { getFileObjects } from '../inject'

class Navigation {
    constructor() {
        this.navDocs = ['toc.ncx', 'toc.xhtml']
    }

    // Remove the `toc.xhtml` and `toc.ncx` from the output directory
    createEmptyNavDocuments() {
        log.info(`opf build navigation documents [${this.navDocs.join(', ')}]`)
        const promises = this.navDocs.map(doc => fs.writeFile(state.dist.ops(doc), ''))
        return Promise.all(promises)
    }

    // Retrieve a list of all XHTML files in the output directory
    getAllXhtmlFiles() {
        return new Promise(resolve =>
            glob(state.dist.ops('**', '*.xhtml'), (err, files) => {
                if (err) throw err
                // TODO: better testing here, make sure we're not including symlinks, for example
                // @issue: https://github.com/triplecanopy/b-ber/issues/228
                const fileObjects = pathInfoFromFiles(files, state.distDir)

                // only get html files
                const xhtmlFileObjects = fileObjects.filter(a => ManifestItemProperties.isHTML(a))

                // prepare for diffing
                const filesFromSystem = uniq(xhtmlFileObjects.map(a => path.basename(a.name, a.extension)))

                resolve({ filesFromSystem, fileObjects })
            }),
        )
    }

    deepRemove(collection, fileName) {
        const found = remove(collection, { fileName })
        if (found.length) return collection

        collection.forEach(item => {
            // check against prop names
            if (item.nodes && item.nodes.length) {
                return this.deepRemove(item.nodes, fileName)
            }
            return item
        })

        return collection
    }

    // Resolve discrepancies between files that exist in the output directory
    // and those that are listed in the YAML manifest
    compareXhtmlWithYaml({ filesFromSystem, fileObjects }) {
        // eslint-disable-line consistent-return
        const { declared, flattened } = state.spine // spine items pulled in from type.yml file and the flattened entries
        const flow = uniq(flattened.map(a => (a.generated ? null : a.fileName)).filter(Boolean)) // one-dimensional flow of the book used for the spine, omitting figures pages
        const pages = flattenSpineFromYAML(declared)
        const missingFiles = difference(flow, filesFromSystem) // extra files on system
        const missingEntries = difference(filesFromSystem, pages) // extra entries in YAML

        if (missingFiles.length || missingEntries.length) {
            // there are discrepencies between the files on the system and files
            // declared in the `state.build`.yml file
            if (missingFiles.length) {
                // there are extra entries in the YAML (i.e., missing XHTML pages)
                missingEntries.forEach(entry => log.warn(`Removing redundant entry [${entry}] in [${state.build}.yml]`))

                missingFiles.forEach(fileName => {
                    remove(flattened, { fileName })
                    state.update('spine.flattened', flattened)

                    const _flowIndex = flow.indexOf(fileName)
                    flow.splice(_flowIndex, 1)

                    const _toc = this.deepRemove(state.toc, fileName)
                    state.update('toc', _toc)
                })

                const yamlpath = state.src.root(`${state.build}.yml`)
                const nestedYamlToc = nestedContentToYAML(state.toc)

                const content =
                    isArray(nestedYamlToc) && nestedYamlToc.length === 0 ? '' : YamlAdaptor.dump(nestedYamlToc)

                log.info(`opf emit ${state.build}.yml`)
                fs.writeFile(yamlpath, content).catch(log.error)
            }

            if (missingEntries.length) {
                // there are missing entries in the YAML (i.e., extra XHTML pages),
                // but we don't know where to interleave them, so we just append
                // them to the top-level list of files

                missingEntries.forEach(name => {
                    if (state.contains('loi', { name })) {
                        // don't warn for figures pages
                        log.warn(`Adding missing entry [${name}] to [${state.build}.yml]`)
                    }
                })

                // add the missing entry to the spine
                const missingEntriesWithAttributes = missingEntries
                    .map(fileName => {
                        if (state.contains('loi', { name: fileName })) {
                            return null
                        }

                        // TODO: state should handle dot-notation for add/remove
                        // @issue: https://github.com/triplecanopy/b-ber/issues/229
                        state.spine.declared.push(fileName)

                        return fileName
                    })
                    .filter(Boolean)

                const yamlpath = state.src.root(`${state.build}.yml`)
                const content =
                    isArray(missingEntriesWithAttributes) && missingEntriesWithAttributes.length === 0
                        ? ''
                        : `\n${YamlAdaptor.dump(missingEntriesWithAttributes)}`

                fs.appendFile(yamlpath, content).catch(log.error)
            }
        }

        const filesFromYaml = { entries: pages, flow }
        return {
            pages,
            flow,
            fileObjects,
            filesFromSystem,
            filesFromYaml,
        }
    }

    async createTocStringsFromTemplate({ pages, ...args }) {
        log.info('opf build [toc.xhtml]')

        const strings = {}
        const { toc } = state
        const files = [
            {
                name: 'toc.xhtml',
                data: new File({ contents: Buffer.from(Template.render(Toc.items(toc), Toc.body())) }),
            },
        ]

        const [data] = await getFileObjects(files)
        strings.toc = data.contents

        return { pages, strings, ...args }
    }

    createNcxStringsFromTemplate({ pages, ...args }) {
        log.info('opf build [toc.ncx]')

        const strings = {}
        const { toc } = state
        const ncxXML = Ncx.navPoints(toc)

        strings.ncx = Template.render(ncxXML, Ncx.document())

        return { pages, strings, ...args }
    }

    createGuideStringsFromTemplate({ flow, fileObjects, ...args }) {
        log.info('opf build [guide]')

        const strings = {}
        const guideXML = Guide.items(state.guide)

        strings.guide = Template.render(guideXML, Guide.body())

        return { strings, flow, fileObjects, ...args }
    }

    createSpineStringsFromTemplate({ flow, fileObjects, ...args }) {
        log.info('opf build [spine]')

        const strings = {}
        // const { spine } = state
        const { flattened } = state.spine

        // We add entries to the spine programatically, but then they're
        // also found on the system, so we dedupe them here
        // TODO: but also, this is super confusing ...
        const generatedFiles = remove(flattened, a => a.generated === true)
        generatedFiles.forEach(a => {
            if (!find(flattened, { fileName: a.fileName })) {
                flattened.push(a)
            }
        })

        const spineXML = Spine.items(flattened)

        strings.spine = Template.render(spineXML, Spine.body())

        return { strings, flow, fileObjects, ...args }
    }

    // Returns a new object from an array of return values from `Promise.all`.
    // Deep merges a single property passed in as `property`. Uses
    // `Object.assign`
    deepMergePromiseArrayValues(args, property) {
        const props = Object.assign({}, ...args.map(a => a[property]))
        return Object.assign({}, [...args], { [property]: props })
    }

    writeTocXhtmlFile(args) {
        const result = this.deepMergePromiseArrayValues(args, 'strings')
        const { toc } = result.strings
        const filepath = state.dist.ops('toc.xhtml')

        log.info(`opf emit toc.xhtml [${filepath}]`)
        return fs.writeFile(filepath, toc).then(() => result)
    }

    writeTocNcxFile(args) {
        const result = this.deepMergePromiseArrayValues(args, 'strings')
        const { ncx } = result.strings
        const filepath = state.dist.ops('toc.ncx')

        log.info(`opf emit toc.ncx [${filepath}]`)
        return fs.writeFile(filepath, ncx).then(() => result)
    }

    normalizeResponseObject(args) {
        return this.deepMergePromiseArrayValues(args, 'strings')
    }

    // Initialize promise chain to build ebook navigation structure
    init() {
        return (
            this.createEmptyNavDocuments()
                .then(resp => this.getAllXhtmlFiles(resp))
                .then(resp => this.compareXhtmlWithYaml(resp))
                .then(resp =>
                    Promise.all([
                        this.createTocStringsFromTemplate(resp),
                        this.createNcxStringsFromTemplate(resp),
                        this.createGuideStringsFromTemplate(resp),
                        this.createSpineStringsFromTemplate(resp),
                    ]),
                )

                .then(resp =>
                    Promise.all([
                        // the two following methods both merge the results from `Promise.all`
                        // and return identical new objects containing all navigation
                        // information to the next method in the chain
                        this.writeTocXhtmlFile(resp),
                        this.writeTocNcxFile(resp),
                    ]),
                )
                // merge the values from the arrays returned above and pass the response
                // along to write the `content.opf`
                .then(resp => this.normalizeResponseObject(resp))
                .catch(log.error)
        )
    }
}

export default Navigation
