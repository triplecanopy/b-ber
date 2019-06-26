/* eslint-disable class-methods-use-this */

// Scans directory contents and reads YAML files to create the `manifest` and
// `metadata` elements in the `content.opf`

import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import has from 'lodash/has'
import log from '@canopycanopycanopy/b-ber-logger'
import Metadata from '@canopycanopycanopy/b-ber-templates/Opf/Metadata'
import Manifest from '@canopycanopycanopy/b-ber-templates/Opf/Manifest'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { pathInfoFromFiles } from './helpers'

class ManifestAndMetadata {
    constructor() {
        this.bookmeta = null
        this.createManifestAndMetadataXML = ManifestAndMetadata.createManifestAndMetadataXML
    }

    loadMetadata() {
        return new Promise(resolve => {
            this.bookmeta = state.metadata.json()
            resolve()
        })
    }

    // Retrieve lists of files to include in the `content.opf`
    createManifestObjectFromAssets() {
        return new Promise(resolve =>
            rrdir(state.dist.ops(), (err, filearr) => {
                if (err) throw err
                // TODO: better testing here, make sure we're not including symlinks, for example
                // @issue: https://github.com/triplecanopy/b-ber/issues/228
                const files = [...state.remoteAssets, ...filearr.filter(a => path.basename(a).charAt(0) !== '.')]
                const fileObjects = pathInfoFromFiles(files, state.distDir) // `pathInfoFromFiles` is creating objects from file names
                resolve(fileObjects)
            }),
        )
    }

    createManifestAndMetadataFromTemplates(files) {
        return new Promise(resolve => {
            const strings = { manifest: [], bookmeta: [] }
            const specifiedFonts =
                has(state.config, 'ibooks_specified_fonts') && state.config.ibooks_specified_fonts === true

            strings.bookmeta = this.bookmeta.map(a => Metadata.meta(a)).filter(Boolean)

            // Add exceptions here as needed
            strings.bookmeta = [
                ...strings.bookmeta,
                `<meta property="ibooks:specified-fonts">${specifiedFonts}</meta>`,
                `<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>`, // eslint-disable-line max-len
                `<meta name="generator" content="b-ber@${state.version}" />`,
            ]

            files.forEach((file, idx) => {
                strings.manifest.push(Manifest.item(file))
                if (idx === files.length - 1) resolve(strings)
            })
        })
    }

    static createManifestAndMetadataXML(resp) {
        log.info('opf build [manifest]')
        log.info('opf build [metadata]')
        return new Promise(resolve => {
            const _metadata = renderLayouts(
                new File({
                    path: '.tmp',
                    layout: 'body',
                    contents: Buffer.from(resp.bookmeta.join('')),
                }),
                { body: Metadata.body() },
            ).contents.toString()

            const manifest = renderLayouts(
                new File({
                    path: '.tmp',
                    layout: 'body',
                    contents: Buffer.from(resp.manifest.filter(Boolean).join('')),
                }),
                { body: Manifest.body() },
            ).contents.toString()

            resolve({ metadata: _metadata, manifest })
        })
    }

    init() {
        return new Promise(resolve =>
            // get the book metadata from state or yaml file
            this.loadMetadata()

                // get lists of files to include in the `content.opf`
                .then(() => this.createManifestObjectFromAssets())

                // create strings of XML entries for the `content.opf`
                .then(resp => this.createManifestAndMetadataFromTemplates(resp))

                // create the manifest and metadata from templating strings.manifest and
                // strings.metadata
                .then(resp => this.createManifestAndMetadataXML(resp))

                // handle err
                .catch(log.error)

                // next
                .then(resolve),
        )
    }
}

export default ManifestAndMetadata
