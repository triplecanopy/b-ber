/* eslint-disable max-len */
import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import Yaml from 'bber-lib/yaml'
import { find } from 'lodash'
import childProcess from 'child_process'
import phantomjs from 'phantomjs-prebuilt'
import { log } from 'bber-plugins'
import store from 'bber-lib/store'
import { coverSVG } from 'bber-templates'
import { page } from 'bber-templates/pages'
import imageSize from 'probe-image-size'
import renderLayouts from 'layouts'
import File from 'vinyl'
import {
    src,
    dist,
    version,
    guid,
    hrtimeformat,
    fileId,
} from 'bber-utils'

let seq
let diff

class Cover {
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

        this.coverPrefix = '__bber_cover__'
        this.phantomjsArgs = [path.join(__dirname, 'phantomjs.js')]
        this.coverXHTMLContent = ''

        this.init = this.init.bind(this)
    }

    removeDefaultCovers() {
        return new Promise((resolve, reject) => {
            const imageDir = path.join(src(), '_images')
            return fs.readdir(imageDir, (err0, files) => {
                if (err0) { throw err0 }

                const oldCovers = files.filter(_ => path.basename(_).match(new RegExp(this.coverPrefix)))
                if (!oldCovers.length) { resolve() }

                return oldCovers.forEach(_ =>
                    fs.remove(path.join(imageDir, _), (err1) => {
                        if (err1) { reject(err1) }
                        log.info(`bber-output/cover: Removed outdated cover image [${_}]`)
                        resolve()
                    })
                )
            })
        })
    }

    generateDefaultCoverImage() {
        log.info('bber-output/cover: Creating cover image')
        return new Promise(resolve =>
            childProcess.execFile(phantomjs.path, this.phantomjsArgs, (err, stdout, stderr) => {
                if (err) { console.error(err) }
                if (stderr) { console.error(stderr) }
                if (stdout) { console.log(stdout) }
                diff = process.hrtime(seq)
                log.info(`bber-output/cover: Wrote cover image in [${hrtimeformat(diff)}]`)
                resolve()
            })
        )
    }

    writeCoverXHTML() {
        return new Promise((resolve) => {
            const textDir = path.join(dist(), '/OPS/text')
            const coverFilePath = path.join(textDir, 'cover.xhtml')
            fs.mkdirp(textDir, (err0) => {
                if (err0) { throw err0 }
                fs.writeFile(coverFilePath, this.coverXHTMLContent, (err1) => {
                    if (err1) { throw err1 }
                    log.info('bber-output/cover: Wrote [cover.xhtml]')
                    return resolve()
                })
            })
        })
    }

    generateCoverXHTML({ coverEntry, coverImagePath }) {
        return new Promise((resolve) => {
            // get the image dimensions, and pass them to the coverSVG template
            const { width, height } = imageSize.sync(fs.readFileSync(coverImagePath))
            const svg = coverSVG({
                width,
                height,
                href: `images/${encodeURIComponent(coverEntry)}`,
            })

            log.info('bber-output/cover: Creating [cover.xhtml]')

            // set the content string to be written once resolved
            this.coverXHTMLContent = renderLayouts(new File({
                path: './.tmp',
                layout: 'page',
                contents: new Buffer(svg),
            }), { page }).contents.toString()
            resolve()
        })
    }

    createCoverImage() {
        return new Promise((resolve) => {
            seq = process.hrtime()
            let metadata
            let coverEntry = `${this.coverPrefix}${guid()}.jpg`
            let coverImagePath = path.join(src(), '_images', coverEntry)

            // check that metadata.yml exists
            log.info('bber-output/cover: Verifying cover entry in [metadata.yml]')
            try {
                metadata = Yaml.load(path.join(src(), 'metadata.yml'))
            } catch (err) {
                log.error(err, 1)
            }

            // check if cover if referenced
            const coverListedInMetadata = find(metadata, { term: 'cover' })
            if (coverListedInMetadata) {
                coverEntry = coverListedInMetadata.value
                log.info(`bber-output/cover: Verifying cover image [${coverEntry}]`)
                if (!coverListedInMetadata.value) { throw new Error('Error in [metadata.yml] at cover.value') }
                // there's a reference to a cover image so we create a cover.xhtml file
                // containing an SVG-wrapped `image` element with the appropriate cover
                // dimensions, and write it to the `text` dir.

                // check that the cover image file exists, throw if not
                coverImagePath = path.join(src(), '_images', coverEntry)
                try {
                    if (!fs.statSync(coverImagePath)) {
                        throw new Error(`Cover image listed in metadata.yml cannot be found: [${coverImagePath}]`)
                    }
                } catch (err) {
                    log.error(err, 1)
                }

                return this.generateCoverXHTML({ coverEntry, coverImagePath }).then(resolve)
            } // end if cover exists

            // if there's no cover referenced in the metadata.yml, we create one that
            // displays the book's metadata (title, generator version, etc)
            log.warn(`bber-output/cover: Creating default cover image [${coverEntry}]`)
            store.bber.metadata.push({ term: 'cover', value: fileId(coverEntry).slice(1) })

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

            this.phantomjsArgs.push(content, coverImagePath)

            return this.removeDefaultCovers()
            .then(() => this.generateDefaultCoverImage())
            .then(() => this.generateCoverXHTML({ coverEntry, coverImagePath }))
            .catch(err => log.error(err))
            .then(resolve)
        })
    }

    init() {
        return new Promise(resolve =>
            this.createCoverImage()
            .then(() => this.writeCoverXHTML())
            .catch(err => log.error(err))
            .then(resolve)
        )
    }
}

const cover = new Cover()
export default cover.init
