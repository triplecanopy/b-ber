/* eslint-disable camelcase */

import {
  type BuildContext,
  GuideItem,
  type Spine,
  SpineItem,
  Template,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import figure from '@canopycanopycanopy/b-ber-templates/figures'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import fs from 'fs-extra'
import sortBy from 'lodash/sortBy'
import { dist, distDir } from '../context'
import type { ListedFigure } from '../render'

// The pages loi writes for the figures render collected
export interface LoiOutput {
  // One page per figure, in figure order. Empty where the target lists every
  // figure on its titlepage
  pages: SpineItem[]
  // The figures titlepage's entry
  guide: GuideItem[]
}

// Adds the figures titlepage to the spine, if the navigation leaves it out
const createLOILeader = (ctx: BuildContext, spine: Spine) => {
  const baseName = 'figures-titlepage'
  const fileName = `${baseName}.xhtml`

  // Create LOI page markup
  const markup = Template.render(Xhtml.loi(), Xhtml.body())

  // Add guide item to content.opf
  const guideItem = new GuideItem({ fileName, title: 'Figures', type: 'loi' })

  // Check if the figures titlepage has been declared
  const index = spine.flattened.findIndex((item) => item.fileName === baseName)

  // If not, add it to the spine so that it can be referenced in the
  // content.opf, as the same item a TOC that lists it would give. The flat
  // list used to get a plain object with no `linear` or `absolutePath`: the
  // OPF marked the page non-linear, the web build left it out of the reading
  // order, and the xml build failed on it (#757)
  if (index < 0) {
    const item = new SpineItem({
      fileName: baseName,
      in_toc: true,
      ref: null,
      pageOrder: -1,
      generated: true,
      dist: distDir(ctx),
    })
    // The flat list holds items without their children, as Spine makes it
    const { nodes, ...flattened } = item

    // New lists rather than pushes, as `state.add` made them: the build's
    // `toc` is the nested list as it was before, and stays without the page
    spine.entries = [...spine.entries, baseName]
    spine.nested = [...spine.nested, item]
    spine.flattened = [...spine.flattened, flattened]
  }

  log.info(`loi emit default figures titlepage [${fileName}]`)

  return fs
    .writeFile(dist(ctx).text(fileName), markup, 'utf8')
    .then(() => guideItem)
}

// Only for a target whose figures live on one titlepage
const createLOIAsSingleHTMLFile = (
  ctx: BuildContext,
  figures: ListedFigure[]
): Promise<LoiOutput> => {
  const classes = (item: ListedFigure) =>
    item.classes ? item.classes.replace(/small/g, 'inline') : ''
  const figuresPage = figures.reduce<string>(
    (acc, curr) =>
      acc.concat(figure({ ...curr, classes: classes(curr) }, ctx.target)),
    Xhtml.loi()
  )

  const fileName = 'figures-titlepage.xhtml'
  const markup = Template.render(figuresPage, Xhtml.body())
  const guideItem = new GuideItem({ fileName, title: 'Figures', type: 'loi' })

  log.info(`loi emit figures titlepage [${fileName}]`)
  return fs
    .writeFile(dist(ctx).text(fileName), markup, 'utf8')
    .then(() => ({ pages: [], guide: [guideItem] }))
}

const createLOIAsSeparateHTMLFiles = (
  ctx: BuildContext,
  figures: ListedFigure[]
): Promise<SpineItem[]> => {
  const pages: SpineItem[] = []
  const promises = figures.map((data) => {
    // Create image string based on dimensions of image
    // returns square | landscape | portrait | portraitLong
    const markup = Template.render(figure(data, ctx.target), Xhtml.body())
    const { page: fileName, ref, pageOrder } = data
    const in_toc = false //eslint-disable-line camelcase
    const spineItem = new SpineItem({
      fileName,
      in_toc,
      ref,
      pageOrder,
      dist: distDir(ctx),
    })

    pages.push(spineItem)
    log.info(`loi linking [${data.source}] to [${data.page}]`)

    return fs.writeFile(dist(ctx).text(data.page), markup, 'utf8')
  })

  return Promise.all(promises).then(() => sortBy(pages, 'pageOrder'))
}

// Writes a page for each figure, or one page for all of them, and adds the
// figures titlepage to the spine where the navigation leaves it out
const loi = (
  ctx: BuildContext,
  { figures, spine }: { figures: ListedFigure[]; spine: Spine }
): Promise<LoiOutput> => {
  if (!figures.length) return Promise.resolve({ pages: [], guide: [] })

  // A target whose figures live on one titlepage gets every figure, and the
  // loi-leader (the 'Figures' header text), in a single document. The others
  // get one page per figure
  if (ctx.target.features.figuresOn === 'titlepage') {
    return createLOIAsSingleHTMLFile(ctx, figures).catch((err) => {
      throw log.error(err)
    })
  }

  // create separate files
  return createLOILeader(ctx, spine)
    .then((guideItem) =>
      createLOIAsSeparateHTMLFiles(ctx, figures).then((pages) => ({
        pages,
        guide: [guideItem],
      }))
    )
    .catch((err) => {
      throw log.error(err)
    })
}

export default loi
