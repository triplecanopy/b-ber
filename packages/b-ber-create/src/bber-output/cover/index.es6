/* eslint-disable max-len */
import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import Yaml from 'bber-lib/yaml'
import { find } from 'lodash'
import childProcess from 'child_process'
import phantomjs from 'phantomjs-prebuilt'
import log from '@canopycanopycanopy/b-ber-logger'
import store from 'bber-lib/store'
import { coverSVG } from 'bber-templates'
import { page } from 'bber-templates/pages'
import imageSize from 'probe-image-size'
import renderLayouts from 'layouts'
import File from 'vinyl'
import crypto from 'crypto'
import {
    src,
    dist,
    version,
    fileId,
} from 'bber-utils'

class Cover {

    get coverEntry() {
        return this._coverEntry
    }
    set coverEntry(value) {
        this._coverEntry = value
    }
    get coverImagePath() {
        return this._coverImagePath
    }
    set coverImagePath(value) {
        this._coverImagePath = value
    }

    constructor() {
        const defaultMetadata = {
            title: '',
            creator: '',
            'date-modified': new Date(),
            identifier: '',
        }

        const fileMetadata = {}
        store.metadata.forEach((_) => {
            if (_.term && _.value) {
                fileMetadata[_.term] = _.value
            }
        })

        this.metadata = {
            ...defaultMetadata,
            ...fileMetadata,
        }


        this.coverPrefix       = '__bber_cover__'
        this.phantomjsArgs     = []
        this.coverXHTMLContent = ''
        this.coverEntry        = ''
        this.coverImagePath    = ''

        this.init = this.init.bind(this)
        this.loadInitialState = this.loadInitialState.bind(this)
    }

    // if running in sequence with other builds, necessary to flush the state
    loadInitialState() {
        return new Promise((resolve) => {
            this.phantomjsArgs     = [path.join(__dirname, 'phantomjs.js')]
            this.coverXHTMLContent = ''
            this.coverEntry        = ''
            this.coverImagePath    = ''
            resolve()
        })
    }

    removeDefaultCovers() {
        return new Promise((resolve, reject) => {
            const imageDir = path.join(src(), '_images')
            return fs.readdir(imageDir, (err0, files) => {
                if (err0) { throw err0 }

                const oldCovers = files.filter(_ => path.basename(_).match(new RegExp(this.coverPrefix)))
                if (!oldCovers.length) { resolve() }

                return oldCovers.forEach((_) => {
                    const coverPath = path.join(imageDir, _)
                    fs.remove(coverPath, (err1) => {
                        if (err1) { reject(err1) }
                        log.info('Removed outdated cover image [%s]', _)
                        resolve()
                    })
                })
            })
        })
    }

    generateDefaultCoverImage() {
        log.info('Creating cover image')
        return new Promise(resolve =>
            childProcess.execFile(phantomjs.path, this.phantomjsArgs, (err, stdout, stderr) => {
                if (err) { log.error(err) }
                if (stderr) { log.error(stderr) }
                if (stdout) { log.info(stdout) }
                log.info('Wrote cover image')
                resolve()
            })
        )
    }

    writeCoverXHTML() {
        return new Promise((resolve) => {
            const textDir = path.join(dist(), 'OPS', 'text')
            const coverFilePath = path.join(textDir, 'cover.xhtml')
            fs.mkdirp(textDir, (err0) => {
                if (err0) { throw err0 }
                fs.writeFile(coverFilePath, this.coverXHTMLContent, (err1) => {
                    if (err1) { throw err1 }
                    log.info('Wrote [cover.xhtml]')
                    return resolve()
                })
            })
        })
    }

    generateCoverXHTML() {
        return new Promise((resolve) => {
            // get the image dimensions, and pass them to the coverSVG template
            const { width, height } = imageSize.sync(fs.readFileSync(this.coverImagePath))
            const svg = coverSVG({
                width,
                height,
                href: `images/${encodeURIComponent(this.coverEntry)}`,
            })

            log.info('Creating [cover.xhtml]')

            // set the content string to be written once resolved
            this.coverXHTMLContent = renderLayouts(new File({
                path: '.tmp',
                layout: 'page',
                contents: new Buffer(svg),
            }), { page }).contents.toString()
            resolve()
        })
    }

    createCoverImage() {
        return new Promise((resolve) => {
            let metadata

            this.coverEntry = `${this.coverPrefix}${crypto.randomBytes(20).toString('hex')}.jpg`
            this.coverImagePath = path.join(src(), '_images', this.coverEntry)

            // check that metadata.yml exists
            log.info('Verifying cover entry in [metadata.yml]')
            try {
                metadata = Yaml.load(path.join(src(), 'metadata.yml'))
            } catch (err) {
                log.error(err)
            }

            // check if cover if referenced
            const coverListedInMetadata = find(metadata, { term: 'cover' })
            if (coverListedInMetadata) {
                this.coverEntry = coverListedInMetadata.value
                log.info('Verifying cover image [%s]', this.coverEntry)
                if (!coverListedInMetadata.value) { throw new Error('Error in [metadata.yml] at cover.value') }
                // there's a reference to a cover image so we create a cover.xhtml file
                // containing an SVG-wrapped `image` element with the appropriate cover
                // dimensions, and write it to the `text` dir.

                // check that the cover image file exists, throw if not
                this.coverImagePath = path.join(src(), '_images', this.coverEntry)
                try {
                    if (!fs.statSync(this.coverImagePath)) {
                        throw new Error(`Cover image listed in metadata.yml cannot be found: [${this.coverImagePath}]`)
                    }
                } catch (err) {
                    log.error(err)
                }

                return this.generateCoverXHTML().then(resolve)
            } // end if cover exists

            // if there's no cover referenced in the metadata.yml, we create one that
            // displays the book's metadata (title, generator version, etc)
            log.warn('Creating default cover image [%s]', this.coverEntry)


            store.remove('metadata', 'cover')
            store.add('metadata', { term: 'cover', value: fileId(this.coverEntry).slice(1) })

            this.metadata = { ...this.metadata, ...metadata }

            const content = `<html>
                <body>
                    <p>${this.metadata.title}</p>
                    <p><span>Creator:</span>${this.metadata.creator}</p>
                    <p><span>Date Modified:</span>${this.metadata['date-modified']}</p>
                    <p><span>Identifier:</span>${this.metadata.identifier}</p>
                    <p><span>b-ber version:</span>${version()}</p>
                </body>
            </html>`


            this.phantomjsArgs.push(content, this.coverImagePath)

            return this.removeDefaultCovers()
            .then(() => this.generateDefaultCoverImage())
            .then(() => this.generateCoverXHTML())
            .catch(err => log.error(err))
            .then(resolve)
        })
    }

    init() {
        return new Promise(resolve =>
            this.loadInitialState()
            .then(() => this.createCoverImage())
            .then(() => this.writeCoverXHTML())
            .catch(err => log.error(err))
            .then(resolve)
        )
    }
}

const cover = new Cover()
export default cover.init
