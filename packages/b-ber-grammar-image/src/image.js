import mimeTypes from 'mime-types'
import state from '@canopycanopycanopy/b-ber-lib/State'
import figureTemplate from '@canopycanopycanopy/b-ber-templates/figures'
import { getImageOrientation } from '@canopycanopycanopy/b-ber-lib/utils'

export function createFigure({
  context,
  width,
  height,
  comment,
  id,
  attrsObject,
  caption,
  mediaType,
}) {
  const classNames = `figure__small figure__small--${getImageOrientation(
    width,
    height
  )}`
  const ref = context.fileName
  const mime = mimeTypes.lookup(attrsObject.source)
  const pageOrder = state.figures.length

  const { classes: userClassNames, ...rest } = attrsObject
  const classes = userClassNames
    ? `${userClassNames} ${classNames}`
    : classNames

  const page = `figure${id}.xhtml`
  const href = state.build === 'reader' ? 'figures-titlepage.xhtml' : page

  state.add('figures', {
    ...rest,
    classes,
    id,
    width,
    height,
    page,
    ref,
    caption,
    mediaType,
    pageOrder,
    mime,
  })

  // prettier-ignore
  return `
    ${comment}
    <div class="${classes}">
      <figure id="ref${id}">
        <a href="${href}#${id}">
          <img src="../images/${encodeURIComponent(attrsObject.source)}" alt="${attrsObject.alt}"/>
        </a>
      </figure>
    </div>
  `
}

export function createFigureInline({
  attrsObject,
  id,
  width,
  height,
  caption,
}) {
  const { classes, ...rest } = attrsObject
  const mime = mimeTypes.lookup(attrsObject.source)
  const inline = true

  return figureTemplate(
    {
      ...rest,
      classes: classes || '',
      id,
      width,
      height,
      caption,
      inline,
      mime,
    },
    state.build
  )
}

export function createFigureGallery({ attrsObject, id, caption }) {
  // prettier-ignore
  return `
    <figure id="${id}" class="figure__gallery ${attrsObject.classes || ''}">
      <div class="figure__gallery__image">
        <img src="../images/${encodeURIComponent(attrsObject.source)}" alt="${attrsObject.alt}"/>
      </div>
      <figcaption>${caption}</figcaption>
    </figure>
  `
}
