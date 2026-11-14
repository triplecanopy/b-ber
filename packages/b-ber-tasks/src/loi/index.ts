/* eslint-disable camelcase */

import { GuideItem, SpineItem, Template } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import figure, {
  type FigureData,
} from '@canopycanopycanopy/b-ber-templates/figures'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import fs from 'fs-extra'
import sortBy from 'lodash/sortBy'

// A figure as the grammar directives add it to `state.figures`: the template's
// data, plus the page it is listed on and its position in the list
type ListedFigure = FigureData & { page: string; pageOrder: number }

const createLOILeader = () => {
  const baseName = 'figures-titlepage'
  const fileName = `${baseName}.xhtml`

  // Create LOI page markup
  const markup = Template.render(Xhtml.loi(), Xhtml.body())

  // Add guide item to content.opf
  const guideItem = new GuideItem({ fileName, title: 'Figures', type: 'loi' })
  state.add('guide', guideItem)

  // Check if the figures titlepage has been declared
  const index = state.indexOf(
    'spine.flattened',
    (item: { fileName: string }) => item.fileName === baseName
  )

  // If not, add it to state.spine so that it can be referenced
  // in the content.opf
  if (index < 0) {
    const item = {
      fileName: baseName,
      in_toc: true,
      ref: null,
      pageOrder: -1,
      generated: true,
    }

    state.add('spine.entries', baseName)
    // Defect, see #757: no `buildType`, so this item's `absolutePath` reads
    // `project-undefined`. The cast keeps it as it is until then
    state.add(
      'spine.nested',
      new SpineItem(item as ConstructorParameters<typeof SpineItem>[0])
    )
    state.add('spine.flattened', item)
  }

  log.info(`loi emit default figures titlepage [${fileName}]`)

  return fs.writeFile(state.dist.text(fileName), markup, 'utf8')
}

// only called in `reader` build
const createLOIAsSingleHTMLFile = () => {
  const classes = (item: ListedFigure) =>
    item.classes ? item.classes.replace(/small/g, 'inline') : ''
  const figuresPage = (state.figures as ListedFigure[]).reduce<string>(
    (acc, curr) =>
      acc.concat(figure({ ...curr, classes: classes(curr) }, state.build)),
    Xhtml.loi()
  )

  const fileName = 'figures-titlepage.xhtml'
  const markup = Template.render(figuresPage, Xhtml.body())
  const guideItem = new GuideItem({ fileName, title: 'Figures', type: 'loi' })

  state.add('guide', guideItem)
  log.info(`loi emit figures titlepage [${fileName}]`)
  return fs.writeFile(state.dist.text(fileName), markup, 'utf8')
}

const createLOIAsSeparateHTMLFiles = () => {
  const promises = (state.figures as ListedFigure[]).map((data) => {
    // Create image string based on dimensions of image
    // returns square | landscape | portrait | portraitLong
    const figures = figure(data, state.build)
    const markup = Template.render(figures, Xhtml.body())
    const { page: fileName, ref, pageOrder } = data
    const in_toc = false //eslint-disable-line camelcase
    const buildType = state.build
    const spineItem = new SpineItem({
      fileName,
      in_toc,
      ref,
      pageOrder,
      buildType,
    })

    state.add('loi', spineItem)
    log.info(`loi linking [${data.source}] to [${data.page}]`)

    return fs.writeFile(state.dist.text(data.page), markup, 'utf8')
  })

  return Promise.all(promises).then(() =>
    state.update('loi', sortBy(state.loi, 'pageOrder'))
  )
}

const loi = () => {
  if (!state.figures.length) return Promise.resolve()

  // For certain builds it may be preferable to have all figures on a
  // single page (e.g., during the web or reader builds). We could set
  // a flag for this, but current functionality is to always default
  // to split the figures into separate files *unless* we're building
  // for the reader.

  // This branch concatentates all the figures, as well as the loi-leader
  // (the 'Figures' header text) into a single document
  if (state.build === 'reader') {
    return createLOIAsSingleHTMLFile().catch(log.error)
  }

  // create separate files
  return createLOILeader().then(createLOIAsSeparateHTMLFiles).catch(log.error)
}

export default loi
