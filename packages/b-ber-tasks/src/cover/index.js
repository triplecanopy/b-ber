import path from 'path'
import fs from 'fs-extra'
import crypto from 'crypto'
import sizeOf from 'image-size'
import PureImage from 'pureimage'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { YamlAdaptor, Template } from '@canopycanopycanopy/b-ber-lib'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

class Cover {
    constructor() {
        const defaultMetadata = {
            title: '',
            creator: '',
            'date-modified': String(new Date()),
            identifier: '',
        }

        const fileMetadata = this.YAMLToObject(state.metadata.json())

        this.metadata = {
            ...defaultMetadata,
            ...fileMetadata,
        }

        this.metadataYAML = state.src.root('metadata.yml')
        this.coverPrefix = '__bber_cover__'
        this.coverXHTMLContent = ''
        this.coverEntry = ''
        this.coverImagePath = ''

        // cover data
        this.width = 1600
        this.height = 2400
        this.fontSize = 45
        this.lineHeight = this.fontSize * 1.35
        this.marginLeft = this.fontSize * 2
        this.marginTop = this.fontSize * 2
        this.colorBackground = '#5050c5'
        this.colorText = '#ffffff'
        this.fontName = 'Open Sans'

        // important! file name needs to be added to copy.sh
        this.fontFile = 'OpenSans-Regular.ttf'

        // increments paragraph Y position
        this.posY = 0
    }

    getPosY = () => {
        this.posY = this.posY ? this.posY + this.lineHeight : this.marginTop + this.fontSize
        return this.posY
    }

    // if running in sequence with other builds, necessary to flush the state
    loadInitialState = async () => {
        this.posY = 0
        this.coverXHTMLContent = ''
        this.coverEntry = ''
        this.coverImagePath = ''
    }

    // eslint-disable-next-line class-methods-use-this
    YAMLToObject() {
        const data = {}
        state.metadata.json().forEach(a => {
            if (a.term && a.value) data[a.term] = a.value
        })
        return data
    }

    removeDefaultCovers() {
        const imageDir = state.src.images()
        const files = fs.readdirSync(imageDir)
        const covers = files.filter(file => path.basename(file).match(new RegExp(this.coverPrefix)))

        if (!covers.length) return Promise.resolve()

        const promises = covers.map(file =>
            fs.remove(path.join(imageDir, file)).then(() => log.info('cover remove outdated cover image [%s]', file))
        )

        return Promise.all(promises)
    }

    generateDefaultCoverImage() {
        return new Promise(resolve => {
            const img = PureImage.make(this.width, this.height)
            const ctx = img.getContext('2d')
            const font = PureImage.registerFont(path.join(__dirname, this.fontFile), this.fontName)

            return font.load(() => {
                ctx.fillStyle = this.colorBackground
                ctx.fillRect(0, 0, this.width, this.height)

                ctx.font = `${this.fontSize}px '${this.fontName}'`
                ctx.fillStyle = this.colorText

                // add text
                ctx.fillText(this.metadata.title, this.marginLeft, this.getPosY())
                ctx.fillText('', this.marginLeft, this.getPosY())

                ctx.fillText('Creator:', this.marginLeft, this.getPosY())
                ctx.fillText(this.metadata.creator, this.marginLeft, this.getPosY())
                ctx.fillText('', this.marginLeft, this.getPosY())

                ctx.fillText('Date Modified:', this.marginLeft, this.getPosY())
                ctx.fillText(this.metadata['date-modified'], this.marginLeft, this.getPosY())
                ctx.fillText('', this.marginLeft, this.getPosY())

                ctx.fillText('Identifier:', this.marginLeft, this.getPosY())
                ctx.fillText(this.metadata.identifier, this.marginLeft, this.getPosY())
                ctx.fillText('', this.marginLeft, this.getPosY())

                ctx.fillText('b-ber version', this.marginLeft, this.getPosY())
                ctx.fillText(state.version, this.marginLeft, this.getPosY())

                return PureImage.encodeJPEGToStream(img, fs.createWriteStream(this.coverImagePath))
                    .then(() => {
                        log.info('cover generated image [%s]', this.coverImagePath)
                        resolve()
                    })
                    .catch(log.error)
            })
        })
    }

    writeCoverXHTML() {
        const textDir = state.dist.text()
        const coverFilePath = state.dist.text('cover.xhtml')

        return fs
            .mkdirp(textDir)
            .then(() => fs.writeFile(coverFilePath, this.coverXHTMLContent))
            .then(() => log.info('cover wrote XML [cover.xhtml]'))
    }

    generateCoverXHTML() {
        // get the image dimensions, and pass them to the coverSVG template
        const { width, height } = sizeOf(this.coverImagePath)
        const href = `images/${encodeURIComponent(this.coverEntry)}`
        const svg = Xhtml.cover({ width, height, href })

        // set the content string to be written once resolved
        this.coverXHTMLContent = Template.render(svg, Xhtml.body())
        log.info('cover build [cover.xhtml]')
    }

    addCoverToMetadata() {
        return fs.writeFile(this.metadataYAML, state.metadata.yaml())
    }

    createCoverImage() {
        this.coverEntry = `${this.coverPrefix}${crypto.randomBytes(20).toString('hex')}.jpg`
        this.coverImagePath = state.src.images(this.coverEntry)

        // load metadata.yml
        const metadata = YamlAdaptor.load(this.metadataYAML)

        // check if cover if referenced
        const coverListedInMetadata = getBookMetadata('cover', state)

        if (coverListedInMetadata) {
            // TODO: fixme, for generated covers
            // @issue: https://github.com/triplecanopy/b-ber/issues/208
            this.coverEntry = coverListedInMetadata.replace(/_jpg$/, '.jpg')
            log.info('cover verify image [%s]', this.coverEntry)

            // there's a reference to a cover image so we create a cover.xhtml file
            // containing an SVG-wrapped `image` element with the appropriate cover
            // dimensions, and write it to the `text` dir.

            // check that the cover image file exists, throw if not
            this.coverImagePath = state.src.images(this.coverEntry)

            if (!fs.existsSync(this.coverImagePath)) {
                log.error('cover image listed in metadata.yml cannot be found [%s]', this.coverImagePath)
            }

            return this.generateCoverXHTML()
        } // end if cover exists

        // if there's no cover referenced in the metadata.yml, we create one
        // that displays the book's metadata (title, generator version, etc)
        // and add it to metadata.yml
        log.info('cover generated image [%s]', this.coverEntry)

        const coverMetadata = { term: 'cover', value: this.coverEntry }

        state.metadata.add(coverMetadata)
        this.metadata = { ...coverMetadata, ...this.metadata, ...metadata }

        return this.removeDefaultCovers()
            .then(() => this.generateDefaultCoverImage())
            .then(() => this.generateCoverXHTML())
            .then(() => this.addCoverToMetadata())
            .catch(log.error)
    }

    init = () =>
        this.loadInitialState()
            .then(() => this.createCoverImage())
            .then(() => this.writeCoverXHTML())
            .catch(log.error)
}

const cover = new Cover()
export default cover.init
