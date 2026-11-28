import {
  attributesObject,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import {
  type DocumentEnv,
  type InlineDirective,
  type InlineRender,
  type RendererInstance,
  utils,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import figure from '@canopycanopycanopy/b-ber-parser-figure'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import fs from 'fs-extra'
import isUndefined from 'lodash/isUndefined'
import { createFigure, createFigureInline } from './image'

const MARKER_OPEN_RE = /(figure(?:-inline)?)(?::([^\s]+)(\s?.*)?)?$/

function prepare({
  node,
  match,
  instance,
  env,
  fileName,
  lineNumber,
}: {
  node: InlineDirective
  match: RegExpMatchArray
  instance: RendererInstance
  env: DocumentEnv
  fileName: string
  lineNumber: number | null
}) {
  const [, type, id, attrs] = match
  const figureId = htmlId(id)
  const caption = node.caption ? instance.renderInline(node.caption, env) : ''
  const comment = `START: figure:${type}#${figureId}; ${fileName}:${lineNumber}`
  const attrsObject = attributesObject(attrs, type, { fileName, lineNumber })
  const asset = env.document.images(attrsObject.source)
  const mediaType =
    (type.indexOf('-') && type.substring(0, type.indexOf('-'))) || type

  // Make sure image exists
  if (!fs.existsSync(asset)) throw log.error(`Image not found [${asset}]`)

  // Get the image dimensions
  const { width, height } = utils.getImageDimensions(asset)

  return {
    width,
    height,
    caption,
    comment,
    env,
    attrsObject,
    asset,
    mediaType,
    id: figureId,
  }
}

const validate = (params: string, line: number, env: DocumentEnv) => {
  const match = params.trim().match(MARKER_OPEN_RE)
  if (!match) return false

  const [, , id, source] = match
  if (isUndefined(id) || isUndefined(source)) {
    // Images require `id` and `source`
    throw log.error(
      `Missing [id] or [source] attribute for [figure] directive${env.document.fileName}.md:${line}`
    )
  }

  return true
}

const render =
  ({ instance }: { instance: RendererInstance }): InlineRender =>
  ({ node, env, h }) => {
    const fileName = `_markdown/${env.document.fileName}.md`
    const lineNumber = node.line
    // `validate` has already matched this marker against MARKER_OPEN_RE
    const match = node.info.trim().match(MARKER_OPEN_RE) as RegExpMatchArray
    const type = match[1]
    const args = prepare({
      node,
      match,
      instance,
      env,
      fileName,
      lineNumber,
    })

    return type === 'figure'
      ? createFigure(args, h)
      : type === 'figure-inline'
        ? createFigureInline(args, h)
        : h.fragment([])
  }

export default {
  plugin: figure,
  name: 'figure',
  renderer: ({ instance }: { instance: RendererInstance }) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    markerOpen: MARKER_OPEN_RE,
    validate,
    render: render({ instance }),
  }),
}
