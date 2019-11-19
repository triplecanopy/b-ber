import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import sortBy from 'lodash/sortBy'
import { SpineItem, GuideItem, Template } from '@canopycanopycanopy/b-ber-lib'
import figure from '@canopycanopycanopy/b-ber-templates/figures'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'

const createLOILeader = () => {
  const fileName = 'figures-titlepage.xhtml'
  const markup = Template.render(Xhtml.loi(), Xhtml.body())
  const guideItem = new GuideItem({ fileName, title: 'Figures', type: 'loi' })

  state.add('guide', guideItem)
  log.info(`loi emit default figures titlepage [${fileName}]`)
  return fs.writeFile(state.dist.text(fileName), markup, 'utf8')
}

// only called in `reader` build
const createLOIAsSingleHTMLFile = () => {
  const classes = item =>
    item.classes ? item.classes.replace(/small/g, 'inline') : ''
  const figuresPage = state.figures.reduce(
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
  const promises = state.figures.map(data => {
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
  return createLOILeader()
    .then(createLOIAsSeparateHTMLFiles)
    .catch(log.error)
}

export default loi
