import path from 'node:path'
import {
  type BuildContext,
  type DocumentInput,
  type FootnoteNumbering,
  type FootnotesEntry,
  type GuideItem,
  type Spine,
  Template,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import MarkdownRenderer, {
  createFootnoteNumbering,
  type RenderedDocument,
} from '@canopycanopycanopy/b-ber-markdown-renderer'
import type { FigureData } from '@canopycanopycanopy/b-ber-templates/figures'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import fs from 'fs-extra'
import { dist, src } from '../context'

// A figure as the grammar directives collect it: the template's data, plus
// the page it is listed on and its position in the list
export type ListedFigure = FigureData & { page: string; pageOrder: number }

// What rendering the book's Markdown collects, besides the XHTML it writes
export interface RenderOutput {
  figures: ListedFigure[]
  footnotes: FootnotesEntry[]
  // Front matter's guide entries
  guide: GuideItem[]
  // URLs of media the book embeds from elsewhere
  remoteAssets: string[]
}

// What the renderer is told about a document and the book it is in
const documentInput = (
  ctx: BuildContext,
  spine: Spine,
  fileName: string,
  footnotes: FootnoteNumbering
): DocumentInput => {
  const entry = spine.flattened.find((item) => item.fileName === fileName)

  return {
    fileName,
    title: entry?.title || fileName,
    target: ctx.target,
    images: (name) => src(ctx).images(name),
    audio: ctx.project.audio,
    video: ctx.project.video,
    media: ctx.project.media,
    groupFootnotes: Boolean(ctx.config.group_footnotes),
    figuresBefore: ctx.settings.figures.length,
    footnotesBefore: ctx.settings.footnotes.length,
    footnotes,
  }
}

// Adds what rendering a document collected to the build's collections, which
// render returns once every document has rendered. The front matter is merged
// into the spine, where `web` reads it
const collect = (
  ctx: BuildContext,
  spine: Spine,
  fileName: string,
  rendered: RenderedDocument
) => {
  ctx.settings.figures.push(...rendered.figures)
  ctx.settings.footnotes.push(...rendered.footnotes)
  ctx.settings.guide.push(...rendered.guide)
  ctx.settings.remoteAssets.push(...rendered.remoteAssets)
  for (const meta of rendered.frontMatter) {
    const data = spine.frontMatter.get(fileName)
    if (data) spine.frontMatter.set(fileName, { ...data, ...meta })
  }
}

// Returned, so that render resolves once every page is on disk. It used to
// start the write and carry on, so the steps after render could read a page
// before it was written, and a failed write was an unhandled rejection (#770)
const writeMarkupToFile = (ctx: BuildContext, fname: string, markup: string) =>
  fs
    .writeFile(dist(ctx).text(`${fname}.xhtml`), markup)
    .then(() => log.info(`render xhtml [${path.basename(fname)}.xhtml]`))

// Convert Markdown to HTML and wrap with page template
const createPageLayout = (
  ctx: BuildContext,
  spine: Spine,
  fileName: string,
  data: string,
  footnotes: FootnoteNumbering
) => {
  const textDir = dist(ctx).text()
  const rendered = MarkdownRenderer.renderDocument(
    documentInput(ctx, spine, fileName, footnotes),
    data
  )
  collect(ctx, spine, fileName, rendered)
  const markup = Template.render(rendered.html, Xhtml.body())

  return fs
    .mkdirp(textDir)
    .then(() => writeMarkupToFile(ctx, fileName, markup))
    .catch((err) => {
      throw log.error(err)
    })
}

const createXTHMLFile = (
  ctx: BuildContext,
  spine: Spine,
  fpath: string,
  footnotes: FootnoteNumbering
) =>
  fs
    .readFile(fpath, 'utf8')
    .then((data) =>
      createPageLayout(ctx, spine, path.basename(fpath, '.md'), data, footnotes)
    )
    .catch((err) => {
      throw log.error(err)
    })

const collected = (ctx: BuildContext): RenderOutput => ({
  figures: ctx.settings.figures as ListedFigure[],
  footnotes: ctx.settings.footnotes,
  guide: ctx.settings.guide,
  remoteAssets: ctx.settings.remoteAssets,
})

// Renders every Markdown file, in the order the spine lists them, so that the
// figures they contain are numbered in reading order
async function render(
  ctx: BuildContext,
  { spine }: { spine: Spine }
): Promise<RenderOutput> {
  const markdownDir = src(ctx).markdown()
  // One per build: footnotes may be numbered across the whole book
  const footnotes = createFootnoteNumbering()
  const indexOf = (fileName: string) =>
    spine.flattened.findIndex((item) => item.fileName === fileName)

  return fs.readdir(markdownDir).then((files) => {
    const promises = files
      .filter((a) => a.charAt(0) !== '.')
      .sort((a, b) => {
        const indexA = indexOf(path.basename(a, '.md'))
        const indexB = indexOf(path.basename(b, '.md'))

        return indexA < indexB ? -1 : indexA > indexB ? 1 : 0
      })
      .reduce(
        (acc, curr) =>
          acc.then(() =>
            createXTHMLFile(
              ctx,
              spine,
              path.join(markdownDir, curr),
              footnotes
            ).then(() => log.info(`render markdown [${path.basename(curr)}]`))
          ),
        Promise.resolve()
      )

    return promises.then(
      () => collected(ctx),
      (err) => {
        throw log.error(err)
      }
    )
  })
}

export default render
