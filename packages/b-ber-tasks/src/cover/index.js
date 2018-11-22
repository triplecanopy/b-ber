/* eslint-disable max-len */

import path from 'path'
import fs from 'fs-extra'
import crypto from 'crypto'
import childProcess from 'child_process'
import imageSize from 'probe-image-size'
import phantomjs from 'phantomjs-prebuilt'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { YamlAdaptor, Template } from '@canopycanopycanopy/b-ber-lib'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import {
    /*fileId */ getBookMetadata,
} from '@canopycanopycanopy/b-ber-lib/utils'

class Cover {
    constructor() {
        const defaultMetadata = {
            title: '',
            creator: '',
            'date-modified': new Date(),
            identifier: '',
        }

        const fileMetadata = this.YAMLToObject(state.metadata)

        this.metadata = {
            ...defaultMetadata,
            ...fileMetadata,
        }

        this.metadataYAML = path.join(state.src, 'metadata.yml')

        this.coverPrefix = '__bber_cover__'
        this.phantomjsArgs = []
        this.coverXHTMLContent = ''
        this.coverEntry = ''
        this.coverImagePath = ''

        this.init = this.init.bind(this)
        this.loadInitialState = this.loadInitialState.bind(this)
    }

    // if running in sequence with other builds, necessary to flush the state
    loadInitialState() {
        this.phantomjsArgs = [path.join(__dirname, 'phantomjs.js')]
        this.coverXHTMLContent = ''
        this.coverEntry = ''
        this.coverImagePath = ''

        return Promise.resolve()
    }

    // eslint-disable-next-line class-methods-use-this
    YAMLToObject() {
        const data = {}
        state.metadata.forEach(a => {
            if (a.term && a.value) data[a.term] = a.value
        })
        return data
    }

    removeDefaultCovers() {
        const imageDir = path.join(state.src, '_images')

        return fs.readdir(imageDir).then(files => {
            const _covers = files.filter(a =>
                path.basename(a).match(new RegExp(this.coverPrefix)),
            )

            if (!_covers.length) return Promise.resolve()

            const promises = _covers.map(a =>
                fs
                    .remove(path.join(imageDir, a))
                    .then(() =>
                        log.info('remove outdated cover image [%s]', a),
                    ),
            )

            return Promise.all(promises)
        })
    }

    generateDefaultCoverImage() {
        return new Promise(resolve =>
            childProcess.execFile(
                phantomjs.path,
                this.phantomjsArgs,
                (err, stdout, stderr) => {
                    if (err) log.error(err)
                    if (stderr) log.error(stderr)
                    if (stdout) log.info(stdout)

                    log.info('cover emit cover image')
                    resolve()
                },
            ),
        )
    }

    writeCoverXHTML() {
        const textDir = path.join(state.dist, 'OPS', 'text')
        const coverFilePath = path.join(textDir, 'cover.xhtml')

        return fs
            .mkdirp(textDir)
            .then(() => fs.writeFile(coverFilePath, this.coverXHTMLContent))
            .then(() => log.info('cover emit [cover.xhtml]'))
    }

    generateCoverXHTML() {
        return new Promise(resolve => {
            // get the image dimensions, and pass them to the coverSVG template
            const { width, height } = imageSize.sync(
                fs.readFileSync(this.coverImagePath),
            )
            const href = `images/${encodeURIComponent(this.coverEntry)}`
            const svg = Xhtml.cover({ width, height, href })

            // set the content string to be written once resolved
            this.coverXHTMLContent = Template.render(
                'page',
                svg,
                Xhtml.document(),
            )

            log.info('cover build [cover.xhtml]')

            resolve()
        })
    }

    addCoverToMetadata() {
        return fs.writeFile(this.metadataYAML, YamlAdaptor.dump(state.metadata))
    }

    createCoverImage() {
        return new Promise(resolve => {
            let metadata

            this.coverEntry = `${this.coverPrefix}${crypto
                .randomBytes(20)
                .toString('hex')}.jpg`
            this.coverImagePath = path.join(
                state.src,
                '_images',
                this.coverEntry,
            )

            // check that metadata.yml exists
            log.info('cover verify entry in [metadata.yml]')
            try {
                metadata = YamlAdaptor.load(this.metadataYAML)
            } catch (err) {
                log.error(err)
            }

            // check if cover if referenced
            const coverListedInMetadata = getBookMetadata('cover', state)

            if (coverListedInMetadata) {
                this.coverEntry = coverListedInMetadata.replace(/_jpg$/, '.jpg') // TODO: fixme, for generated covers
                log.info('cover verify image [%s]', this.coverEntry)

                // there's a reference to a cover image so we create a cover.xhtml file
                // containing an SVG-wrapped `image` element with the appropriate cover
                // dimensions, and write it to the `text` dir.

                // check that the cover image file exists, throw if not
                this.coverImagePath = path.join(
                    state.src,
                    '_images',
                    this.coverEntry,
                )

                try {
                    if (!fs.statSync(this.coverImagePath)) {
                        throw new Error(
                            `Cover image listed in metadata.yml cannot be found: [${
                                this.coverImagePath
                            }]`,
                        )
                    }
                } catch (err) {
                    log.error(err)
                }

                return this.generateCoverXHTML().then(resolve)
            } // end if cover exists

            // if there's no cover referenced in the metadata.yml, we create one
            // that displays the book's metadata (title, generator version, etc)
            // and add it to metadata.yml
            log.warn('cover emit [%s]', this.coverEntry)

            const coverMetadata = {
                term: 'cover',
                value: this.coverEntry,
                // value: fileId(this.coverEntry).slice(1),
            }

            state.add('metadata', coverMetadata)

            this.metadata = { ...coverMetadata, ...this.metadata, ...metadata }

            const content = `
<html>
<body>
<p>${this.metadata.title}</p>
<p><span>Creator:</span>${this.metadata.creator}</p>
<p><span>Date Modified:</span>${this.metadata['date-modified']}</p>
<p><span>Identifier:</span>${this.metadata.identifier}</p>
<p><span>b-ber version:</span>${state.version}</p>
</body>
</html>
`

            this.phantomjsArgs.push(content, this.coverImagePath)

            return this.removeDefaultCovers()
                .then(() => this.generateDefaultCoverImage())
                .then(() => this.generateCoverXHTML())
                .then(() => this.addCoverToMetadata())
                .catch(log.error)
                .then(resolve)
        })
    }

    init() {
        return this.loadInitialState()
            .then(() => this.createCoverImage())
            .then(() => this.writeCoverXHTML())
            .catch(log.error)
    }
}

const cover = new Cover()
export default cover.init
