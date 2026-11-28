import path from 'node:path'
import {
  type BuildContext,
  type FootnotesEntry,
  type GuideItem,
  type Spine,
  Template,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import MarkdownRenderer from '@canopycanopycanopy/b-ber-markdown-renderer'
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
  fileName: string,
  data: string
) => {
  const textDir = dist(ctx).text()
  const body = MarkdownRenderer.render(fileName, data)
  const markup = Template.render(body, Xhtml.body())

  return fs
    .mkdirp(textDir)
    .then(() => writeMarkupToFile(ctx, fileName, markup))
    .catch((err) => {
      throw log.error(err)
    })
}

const createXTHMLFile = (ctx: BuildContext, fpath: string) =>
  fs
    .readFile(fpath, 'utf8')
    .then((data) => createPageLayout(ctx, path.basename(fpath, '.md'), data))
    .catch((err) => {
      throw log.error(err)
    })

// The grammar plugins still collect what they find through `State`, which
// routes to this build's context; it is read back from there once every
// document has rendered
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
            createXTHMLFile(ctx, path.join(markdownDir, curr)).then(() =>
              log.info(`render markdown [${path.basename(curr)}]`)
            )
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
