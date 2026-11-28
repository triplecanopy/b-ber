import {
  attributesList,
  attributesObject,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import type { InlineRender } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import figure from '@canopycanopycanopy/b-ber-parser-figure'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import fs from 'fs-extra'

const MARKER_RE = /^logo/
const DIRECTIVE_RE = /(logo)(?::([^\s]+)(\s?.*)?)?$/

// A logo: its image in a figure
const render: InlineRender = ({ node, env, h }) => {
  const match = node.info.trim().match(DIRECTIVE_RE)
  if (!match) return h.fragment([])

  const fileName = `_markdown/${env.document.fileName}.md`
  const lineNumber = node.line
  const [, type, id, attrs] = match
  const attrsObj = attributesObject(attrs, type, { fileName, lineNumber })

  if (!attrsObj.source)
    throw log.error(
      '[source] attribute is required by [logo] directive, aborting'
    )

  const inputImagePath = env.document.images(attrsObj.source)
  const outputImagePath = `../images/${attrsObj.source}`

  if (!fs.existsSync(inputImagePath))
    log.warn(`Image [${attrsObj.source}] does not exist`)

  delete attrsObj.source // since we need the path relative to `images`
  // Defect, see #727: `type` is passed where attributesList expects a
  // reference object, so `has(type, key)` is false for every key and every
  // attribute is dropped. The cast keeps the call as it is until then
  const attributes = attributesList(
    attrsObj,
    type as unknown as Record<string, unknown>
  )

  // The markup's own line breaks and indentation, as it was written
  const line = '\n                    '
  return h('figure', { id: htmlId(id), class: 'logo' }, [
    line,
    h('img', [
      ['style', 'width:120px;'],
      ['src', outputImagePath],
      ...attributes,
    ]),
    line,
  ])
}

export default {
  plugin: figure,
  name: 'logo',
  renderer: () => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    validate(params: string) {
      return params.trim().match(MARKER_RE)
    },
    render,
  }),
}
