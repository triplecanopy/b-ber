import crypto from 'node:crypto'
import path from 'node:path'
import {
  type BuildContext,
  Template,
  YamlAdaptor,
} from '@canopycanopycanopy/b-ber-lib'
import { getImageDimensions } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import fs from 'fs-extra'
import PureImage from 'pureimage'
import { bookMetadata, dist, libVersion, src } from '../context'

// The part of pureimage's 2D context that `wrapText` uses. Written out rather
// than imported because pureimage's types are an ambient stub, which tsdown's
// declaration build does not see
interface TextContext {
  measureText(text: string): { width: number }
  fillText(text: string, x: number, y: number): void
}

const COVER_PREFIX = '__bber_cover__'

// The generated cover's design
const WIDTH = 1600
const HEIGHT = 2400
const FONT_SIZE = 45
const LINE_HEIGHT = FONT_SIZE * 1.35
const MARGIN_LEFT = FONT_SIZE * 2
const MARGIN_TOP = FONT_SIZE * 2
const COLOR_BACKGROUND = '#5050c5'
const COLOR_TEXT = '#ffffff'
const FONT_NAME = 'Free Universal'

// File name needs to be added to copy.sh
const FONT_FILE = 'freeuniversal-bold-webfont.ttf'

// One run of the task. It used to be the fields of an instance created when
// the module was imported, reset at the start of each run, which a build
// running alongside would have shared
interface CoverRun {
  ctx: BuildContext
  // The metadata the generated cover draws
  metadata: Record<string, string>
  metadataYAML: string
  coverXHTMLContent: string
  coverEntry: string
  coverImagePath: string
  // The next paragraph's Y position
  posY: number
}

// metadata.yml's terms and values. They were read when the module was
// imported, so `--src` drew the cover from `config.yml`'s source directory
const metadataObject = (ctx: BuildContext) =>
  ctx.project.metadata.json().reduce<Record<string, string>>((acc, curr) => {
    if (curr.term && curr.value) {
      acc[curr.term] = curr.value
    }

    return acc
  }, {})

const createRun = (ctx: BuildContext): CoverRun => ({
  ctx,
  metadata: {
    title: '',
    creator: '',
    'date-modified': String(new Date()),
    identifier: '',
    ...metadataObject(ctx),
  },
  // Where metadata.yml is, for the build that is running
  metadataYAML: src(ctx).root('metadata.yml'),
  coverXHTMLContent: '',
  coverEntry: '',
  coverImagePath: '',
  posY: 0,
})

const getPosY = (run: CoverRun) => {
  run.posY = run.posY ? run.posY + LINE_HEIGHT : MARGIN_TOP + FONT_SIZE
  return run.posY
}

const removeDefaultCovers = ({ ctx }: CoverRun) => {
  const imageDir = src(ctx).images()
  const files = fs.readdirSync(imageDir)
  const covers = files.filter((file) =>
    path.basename(file).match(new RegExp(COVER_PREFIX))
  )

  if (!covers.length) return Promise.resolve()

  const promises = covers.map((file) =>
    fs
      .remove(path.join(imageDir, file))
      .then(() => log.info('cover remove outdated cover image [%s]', file))
  )

  return Promise.all(promises)
}

const wrapText = (run: CoverRun, ctx: TextContext, text: string) => {
  const maxWidth = WIDTH - MARGIN_LEFT * 2
  const words = text.split(' ')
  let line = ''

  for (let n = 0; n < words.length; n++) {
    const testLine = `${line}${words[n]} `
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, MARGIN_LEFT, getPosY(run))
      line = `${words[n]} `
    } else {
      line = testLine
    }
  }

  ctx.fillText(line, MARGIN_LEFT, getPosY(run))
}

const generateDefaultCoverImage = (run: CoverRun) =>
  new Promise<void>((resolve) => {
    const img = PureImage.make(WIDTH, HEIGHT)
    const ctx = img.getContext('2d')
    const font = PureImage.registerFont(
      path.join(__dirname, FONT_FILE),
      FONT_NAME
    )
    const { metadata } = run

    return font.load(() => {
      ctx.fillStyle = COLOR_BACKGROUND
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      ctx.font = `${FONT_SIZE}px '${FONT_NAME}'`
      ctx.fillStyle = COLOR_TEXT

      // add text
      ctx.fillText('Title', MARGIN_LEFT, getPosY(run))
      ctx.fillText(metadata.title, MARGIN_LEFT, getPosY(run))
      ctx.fillText('', MARGIN_LEFT, getPosY(run))

      ctx.fillText('Creator', MARGIN_LEFT, getPosY(run))
      ctx.fillText(metadata.creator, MARGIN_LEFT, getPosY(run))
      ctx.fillText('', MARGIN_LEFT, getPosY(run))

      ctx.fillText('Publisher', MARGIN_LEFT, getPosY(run))
      ctx.fillText(metadata.publisher, MARGIN_LEFT, getPosY(run))
      ctx.fillText('', MARGIN_LEFT, getPosY(run))

      ctx.fillText('Description', MARGIN_LEFT, getPosY(run))
      wrapText(run, ctx, metadata.description)
      ctx.fillText('', MARGIN_LEFT, getPosY(run))

      ctx.fillText('b-ber version', MARGIN_LEFT, getPosY(run))
      ctx.fillText(libVersion(), MARGIN_LEFT, getPosY(run))

      return PureImage.encodeJPEGToStream(
        img,
        fs.createWriteStream(run.coverImagePath)
      )
        .then(() => {
          log.info('cover generated image [%s]', run.coverImagePath)
          resolve()
        })
        .catch((err) => {
          throw log.error(err)
        })
    })
  })

const writeCoverXHTML = async ({ ctx, coverXHTMLContent }: CoverRun) => {
  // Omit cover.xhtml where the target has no cover page (pdf), so that
  // users can define special treatment for the cover in config.yml
  if (!ctx.target.features.coverPage) return

  const textDir = dist(ctx).text()
  const coverFilePath = dist(ctx).text('cover.xhtml')

  await fs.mkdirp(textDir)
  await fs.writeFile(coverFilePath, coverXHTMLContent)

  log.info('cover wrote XML [cover.xhtml]')
}

const generateCoverXHTML = (run: CoverRun) => {
  // Get the image dimensions and pass them to the coverSVG template
  const { width, height } = getImageDimensions(run.coverImagePath)
  const href = `images/${encodeURIComponent(run.coverEntry)}`
  const svg = Xhtml.cover({ width, height, href })

  // Set the content string to be written once resolved
  run.coverXHTMLContent = Template.render(svg, Xhtml.body())
  log.info('cover build [cover.xhtml]')
}

const addCoverToMetadata = ({ ctx, metadataYAML }: CoverRun) =>
  fs.writeFile(metadataYAML, ctx.project.metadata.yaml())

const createCoverImage = (run: CoverRun) => {
  const { ctx } = run
  run.coverEntry = `${COVER_PREFIX}${crypto.randomBytes(20).toString('hex')}.jpg`
  run.coverImagePath = src(ctx).images(run.coverEntry)

  // Load metadata.yml
  const metadata = YamlAdaptor.load(run.metadataYAML) as Record<string, string>

  // Check if cover if referenced
  const coverListedInMetadata = bookMetadata(ctx, 'cover')

  if (coverListedInMetadata) {
    // TODO: fixme, for generated covers
    // @issue: https://github.com/triplecanopy/b-ber/issues/208
    run.coverEntry = coverListedInMetadata.replace(/_jpg$/, '.jpg')
    log.info('cover verify image [%s]', run.coverEntry)

    // There's a reference to a cover image, so create a cover.xhtml file
    // containing an SVG-wrapped `image` element with the appropriate cover
    // dimensions and write it to the `text` dir.

    // check that the cover image file exists, throw if not
    run.coverImagePath = src(ctx).images(run.coverEntry)

    if (!fs.existsSync(run.coverImagePath)) {
      throw log.error('Cover image listed in metadata.yml cannot be found')
    }

    return generateCoverXHTML(run)
  }

  // If there's no cover referenced in the metadata.yml, create one
  // that displays the book's metadata (title, generator version, etc)
  // and add it to metadata.yml
  log.info('cover generated image [%s]', run.coverEntry)

  const coverMetadata = { term: 'cover', value: run.coverEntry }

  ctx.project.metadata.add(coverMetadata)
  run.metadata = { ...coverMetadata, ...run.metadata, ...metadata }

  return removeDefaultCovers(run)
    .then(() => generateDefaultCoverImage(run))
    .then(() => generateCoverXHTML(run))
    .then(() => addCoverToMetadata(run))
    .catch((err) => {
      throw log.error(err)
    })
}

// Writes `cover.xhtml` for the cover metadata.yml lists, or generates a cover
// image from the book's metadata and lists it there
const cover = (ctx: BuildContext) => {
  let run: CoverRun

  return Promise.resolve()
    .then(() => {
      run = createRun(ctx)
    })
    .then(() => createCoverImage(run))
    .then(() => writeCoverXHTML(run))
    .catch((err) => {
      throw log.error(err)
    })
}

export default cover
