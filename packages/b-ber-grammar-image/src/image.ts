import { State as state, utils } from '@canopycanopycanopy/b-ber-lib'
import figureTemplate from '@canopycanopycanopy/b-ber-templates/figures'
import mimeTypes from 'mime-types'

const { getImageOrientation } = utils

// What `prepare` in ./index builds for each figure
export type FigureArgs = {
  context: { fileName?: string }
  width: number
  height: number
  comment: string
  id: string
  attrsObject: Record<string, string>
  caption: string
  mediaType: string
}

export function createFigure({
  context,
  width,
  height,
  comment,
  id,
  attrsObject,
  caption,
  mediaType,
}: FigureArgs) {
  const classNames = `figure__small figure__small--${getImageOrientation(
    width,
    height
  )}`
  const ref = context.fileName
  const mime = mimeTypes.lookup(attrsObject.source)
  const pageOrder = state.figures.length
  const { classes, ...rest } = attrsObject
  const classes_ = classes ? classes.concat(` ${classNames}`) : classNames

  const page = `figure${id}.xhtml`
  const href = state.build === 'reader' ? 'figures-titlepage.xhtml' : page

  state.add('figures', {
    ...rest,
    classes: classes_,
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

  const result = `
        ${comment}
        <div class="${classes_}">
        <figure id="ref${id}">
        <a href="${href}#${id}">
        <img src="../images/${encodeURIComponent(attrsObject.source)}" alt="${
          attrsObject.alt
        }"/>
        </a>
        </figure>
        </div>`

  return result
}

export function createFigureInline({
  attrsObject,
  id,
  width,
  height,
  caption,
}: Pick<FigureArgs, 'attrsObject' | 'id' | 'width' | 'height' | 'caption'>) {
  const { classes, ...rest } = attrsObject
  const mime = mimeTypes.lookup(attrsObject.source)
  const inline = true

  return figureTemplate(
    {
      ...rest,
      // Already in `rest`; named so the template's required fields are
      // checked. `prepare` rejects a figure without a source, and
      // b-ber-grammar-attributes defaults `alt` to the source.
      source: attrsObject.source,
      alt: attrsObject.alt,
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
