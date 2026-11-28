import { commentLines } from '@canopycanopycanopy/b-ber-grammar-attributes'
import {
  type DocumentEnv,
  nextFigure,
  utils,
  type XhtmlBuilder,
  type XhtmlNode,
} from '@canopycanopycanopy/b-ber-lib'
import figureTemplate from '@canopycanopycanopy/b-ber-templates/figures'
import mimeTypes from 'mime-types'

const { getImageOrientation } = utils

// What `prepare` in ./index builds for each figure
export type FigureArgs = {
  env: DocumentEnv
  width: number
  height: number
  // The start comment's text
  comment: string
  id: string
  attrsObject: Record<string, string>
  caption: string
  mediaType: string
}

// A figure where the text is: its thumbnail, linking to its page in the list
// of illustrations, which it is collected for
export function createFigure(
  {
    env,
    width,
    height,
    comment,
    id,
    attrsObject,
    caption,
    mediaType,
  }: FigureArgs,
  h: XhtmlBuilder
): XhtmlNode {
  const classNames = `figure__small figure__small--${getImageOrientation(
    width,
    height
  )}`
  const ref = env.document.fileName
  const mime = mimeTypes.lookup(attrsObject.source)
  const pageOrder = nextFigure(env)
  const { classes, ...rest } = attrsObject
  const classes_ = classes ? classes.concat(` ${classNames}`) : classNames

  const page = `figure${id}.xhtml`
  const href =
    env.document.target.features.figuresOn === 'titlepage'
      ? 'figures-titlepage.xhtml'
      : page

  env.result.figures.push({
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

  // The markup's own line breaks and indentation, as it was written
  const line = '\n        '
  return h.fragment([
    line,
    commentLines(h, comment),
    line,
    h('div', { class: classes_ }, [
      line,
      h('figure', { id: `ref${id}` }, [
        line,
        h('a', { href: `${href}#${id}` }, [
          line,
          h('img', {
            src: `../images/${encodeURIComponent(attrsObject.source)}`,
            alt: String(attrsObject.alt),
          }),
          line,
        ]),
        line,
      ]),
      line,
    ]),
  ])
}

// A figure in the text, from the target's figure template, which
// b-ber-templates writes as a string
export function createFigureInline(
  {
    env,
    attrsObject,
    id,
    width,
    height,
    caption,
  }: Pick<
    FigureArgs,
    'env' | 'attrsObject' | 'id' | 'width' | 'height' | 'caption'
  >,
  h: XhtmlBuilder
): XhtmlNode {
  const { classes, ...rest } = attrsObject
  const mime = mimeTypes.lookup(attrsObject.source)
  const inline = true

  return h.raw(
    figureTemplate(
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
      env.document.target
    )
  )
}
