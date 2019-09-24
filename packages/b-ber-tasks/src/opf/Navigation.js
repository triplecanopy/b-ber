/* eslint-disable class-methods-use-this */

// Scans directory contents and reads YAML files to create the `spine` and
// `guide` elements in the `content.opf`. Writes essential navigation documents
// (`toc.ncx`, `toc.xhtml`) to the output directory

import path from 'path'
import fs from 'fs-extra'
import { promisify } from 'util'
import File from 'vinyl'
import { glob as _glob } from 'glob'
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

const glob = promisify(_glob)

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
    async getAllXhtmlFiles() {
        const files = await glob(state.dist.ops('**', '*.xhtml'))
        const fileObjects = pathInfoFromFiles(files, state.distDir)

        // only get html files
        const xhtmlFileObjects = fileObjects.filter(a => ManifestItemProperties.isHTML(a))

        // prepare for diffing
        const filesFromSystem = uniq(xhtmlFileObjects.map(a => path.basename(a.name, a.extension)))

        return { filesFromSystem, fileObjects }
    }

    deepRemove(collection, fileName) {
        const found = remove(collection, { fileName })
        if (found.length) return collection

        // check against prop names
        collection.forEach(item => (item.nodes && item.nodes.length ? this.deepRemove(item.nodes, fileName) : item))

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
        const tocFile = fs.existsSync(state.src.root(`${state.build}.yml`))
            ? state.src.root(`${state.build}.yml`)
            : state.src.root('toc.yml')

        // Check if there are discrepencies between the files on the system and
        // files declared in the `state.build`.yml file
        if (missingFiles.length) {
            // there are extra entries in the YAML (i.e., missing XHTML pages)
            missingEntries.forEach(entry =>
                log.warn(`Removing redundant entry [${entry}] in [${path.basename(tocFile)}]`)
            )

            missingFiles.forEach(fileName => {
                remove(flattened, { fileName })
                state.update('spine.flattened', flattened)

                const _flowIndex = flow.indexOf(fileName)
                flow.splice(_flowIndex, 1)

                const _toc = this.deepRemove(state.toc, fileName)
                state.update('toc', _toc)
            })

            const nestedYamlToc = nestedContentToYAML(state.toc)
            const content = isArray(nestedYamlToc) && nestedYamlToc.length === 0 ? '' : YamlAdaptor.dump(nestedYamlToc)

            log.info(`opf emit ${path.basename(tocFile)}`)
            fs.writeFileSync(tocFile, content).catch(log.error)
        }

        if (missingEntries.length) {
            // there are missing entries in the YAML (i.e., extra XHTML pages),
            // but we don't know where to interleave them, so we just append
            // them to the top-level list of files

            missingEntries.forEach(name => log.info(`Adding missing entry [${name}] to [${path.basename(tocFile)}]`))

            // add the missing entry to the spine
            const missingEntriesWithAttributes = missingEntries.reduce((acc, name) => {
                if (state.contains('loi', { name })) return acc

                state.add('spine.declared', name)
                return acc.concat(name)
            }, [])

            const content =
                isArray(missingEntriesWithAttributes) && missingEntriesWithAttributes.length === 0
                    ? ''
                    : `\n${YamlAdaptor.dump(missingEntriesWithAttributes)}`

            fs.appendFileSync(tocFile, content)
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

    async createTocStringsFromTemplate() {
        log.info('opf build [toc.xhtml]')

        const { toc } = state
        const data = new File({ contents: Buffer.from(Template.render(Toc.items(toc), Toc.body())) })
        const file = [{ name: 'toc.xhtml', data }]
        const [{ contents }] = await getFileObjects(file)

        return contents
    }

    createNcxStringsFromTemplate() {
        log.info('opf build [toc.ncx]')

        const { toc } = state
        const ncxXML = Ncx.navPoints(toc)

        return Template.render(ncxXML, Ncx.document())
    }

    createGuideStringsFromTemplate() {
        log.info('opf build [guide]')

        const guideXML = Guide.items(state.guide)

        return Template.render(guideXML, Guide.body())
    }

    createSpineStringsFromTemplate() {
        log.info('opf build [spine]')

        const { flattened } = state.spine

        // We add entries to the spine programatically, but then they're
        // also found on the system, so we dedupe them here
        // TODO: but also, this is super confusing ...
        const generatedFiles = remove(flattened, file => file.generated === true)

        generatedFiles.forEach(file => {
            if (!find(flattened, { fileName: file.fileName })) {
                flattened.push(file)
            }
        })

        const spineXML = Spine.items(flattened)

        return Template.render(spineXML, Spine.body())
    }

    writeTocXhtmlFile(toc) {
        const filepath = state.dist.ops('toc.xhtml')

        log.info(`opf emit toc.xhtml [${filepath}]`)

        return fs.writeFile(filepath, toc)
    }

    writeTocNcxFile(ncx) {
        const filepath = state.dist.ops('toc.ncx')

        log.info(`opf emit toc.ncx [${filepath}]`)

        return fs.writeFile(filepath, ncx)
    }

    async writeFiles([toc, ncx, guide, spine]) {
        await Promise.all([this.writeTocXhtmlFile(toc), this.writeTocNcxFile(ncx)])
        return { spine, guide }
    }

    // Initialize promise chain to build ebook navigation structure
    init() {
        return this.createEmptyNavDocuments()
            .then(resp => this.getAllXhtmlFiles(resp))
            .then(resp => this.compareXhtmlWithYaml(resp))
            .then(resp =>
                Promise.all([
                    this.createTocStringsFromTemplate(resp),
                    this.createNcxStringsFromTemplate(resp),
                    this.createGuideStringsFromTemplate(resp),
                    this.createSpineStringsFromTemplate(resp),
                ])
            )
            .then(resp => this.writeFiles(resp))
            .catch(log.error)
    }
}

export default Navigation
