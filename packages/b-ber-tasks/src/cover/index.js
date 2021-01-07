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
    this.fontName = 'Free Universal'

    // File name needs to be added to copy.sh
    this.fontFile = 'freeuniversal-bold-webfont.ttf'

    // increments paragraph Y position
    this.posY = 0
  }

  getPosY = () => {
    this.posY = this.posY
      ? this.posY + this.lineHeight
      : this.marginTop + this.fontSize
    return this.posY
  }

  // Necessary to flush the state if running in sequence with other builds
  loadInitialState = async () => {
    this.posY = 0
    this.coverXHTMLContent = ''
    this.coverEntry = ''
    this.coverImagePath = ''
  }

  // eslint-disable-next-line class-methods-use-this
  YAMLToObject() {
    return state.metadata.json().reduce((acc, curr) => {
      if (curr.term && curr.value) {
        acc[curr.term] = curr.value
      }

      return acc
    }, {})
  }

  removeDefaultCovers() {
    const imageDir = state.src.images()
    const files = fs.readdirSync(imageDir)
    const covers = files.filter(file =>
      path.basename(file).match(new RegExp(this.coverPrefix))
    )

    if (!covers.length) return Promise.resolve()

    const promises = covers.map(file =>
      fs
        .remove(path.join(imageDir, file))
        .then(() => log.info('cover remove outdated cover image [%s]', file))
    )

    return Promise.all(promises)
  }

  wrapText(ctx, text) {
    const maxWidth = this.width - this.marginLeft * 2
    const words = text.split(' ')
    let line = ''

    for (let n = 0; n < words.length; n++) {
      const testLine = `${line}${words[n]} `
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, this.marginLeft, this.getPosY())
        line = `${words[n]} `
      } else {
        line = testLine
      }
    }

    ctx.fillText(line, this.marginLeft, this.getPosY())
  }

  generateDefaultCoverImage() {
    return new Promise(resolve => {
      const img = PureImage.make(this.width, this.height)
      const ctx = img.getContext('2d')
      const font = PureImage.registerFont(
        path.join(__dirname, this.fontFile),
        this.fontName
      )

      return font.load(() => {
        ctx.fillStyle = this.colorBackground
        ctx.fillRect(0, 0, this.width, this.height)

        ctx.font = `${this.fontSize}px '${this.fontName}'`
        ctx.fillStyle = this.colorText

        // add text
        ctx.fillText('Title', this.marginLeft, this.getPosY())
        ctx.fillText(this.metadata.title, this.marginLeft, this.getPosY())
        ctx.fillText('', this.marginLeft, this.getPosY())

        ctx.fillText('Creator', this.marginLeft, this.getPosY())
        ctx.fillText(this.metadata.creator, this.marginLeft, this.getPosY())
        ctx.fillText('', this.marginLeft, this.getPosY())

        ctx.fillText('Publisher', this.marginLeft, this.getPosY())
        ctx.fillText(this.metadata.publisher, this.marginLeft, this.getPosY())
        ctx.fillText('', this.marginLeft, this.getPosY())

        ctx.fillText('Description', this.marginLeft, this.getPosY())
        this.wrapText(ctx, this.metadata.description)
        ctx.fillText('', this.marginLeft, this.getPosY())

        ctx.fillText('b-ber version', this.marginLeft, this.getPosY())
        ctx.fillText(state.version, this.marginLeft, this.getPosY())

        return PureImage.encodeJPEGToStream(
          img,
          fs.createWriteStream(this.coverImagePath)
        )
          .then(() => {
            log.info('cover generated image [%s]', this.coverImagePath)
            resolve()
          })
          .catch(log.error)
      })
    })
  }

  writeCoverXHTML = async () => {
    // Omit cover.xhtml from the PDF build to allow users to define special
    // treatment for the cover in config.yml
    if (state.build === 'pdf') return

    const textDir = state.dist.text()
    const coverFilePath = state.dist.text('cover.xhtml')

    await fs.mkdirp(textDir)
    await fs.writeFile(coverFilePath, this.coverXHTMLContent)

    log.info('cover wrote XML [cover.xhtml]')
  }

  generateCoverXHTML() {
    // Get the image dimensions and pass them to the coverSVG template
    const { width, height } = sizeOf(this.coverImagePath)
    const href = `images/${encodeURIComponent(this.coverEntry)}`
    const svg = Xhtml.cover({ width, height, href })

    // Set the content string to be written once resolved
    this.coverXHTMLContent = Template.render(svg, Xhtml.body())
    log.info('cover build [cover.xhtml]')
  }

  addCoverToMetadata() {
    return fs.writeFile(this.metadataYAML, state.metadata.yaml())
  }

  createCoverImage() {
    this.coverEntry = `${this.coverPrefix}${crypto
      .randomBytes(20)
      .toString('hex')}.jpg`
    this.coverImagePath = state.src.images(this.coverEntry)

    // Load metadata.yml
    const metadata = YamlAdaptor.load(this.metadataYAML)

    // Check if cover if referenced
    const coverListedInMetadata = getBookMetadata('cover', state)

    if (coverListedInMetadata) {
      // TODO: fixme, for generated covers
      // @issue: https://github.com/triplecanopy/b-ber/issues/208
      this.coverEntry = coverListedInMetadata.replace(/_jpg$/, '.jpg')
      log.info('cover verify image [%s]', this.coverEntry)

      // There's a reference to a cover image, so create a cover.xhtml file
      // containing an SVG-wrapped `image` element with the appropriate cover
      // dimensions and write it to the `text` dir.

      // check that the cover image file exists, throw if not
      this.coverImagePath = state.src.images(this.coverEntry)

      if (!fs.existsSync(this.coverImagePath)) {
        log.error('Cover image listed in metadata.yml cannot be found')
      }

      return this.generateCoverXHTML()
    }

    // If there's no cover referenced in the metadata.yml, create one
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
