import {
  attributesObject,
  attributesString,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import {
  type FigureToken,
  type RendererContext,
  State as state,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import figure from '@canopycanopycanopy/b-ber-parser-figure'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import fs from 'fs-extra'

const MARKER_RE = /^logo/
const DIRECTIVE_RE = /(logo)(?::([^\s]+)(\s?.*)?)?$/

export default {
  plugin: figure,
  name: 'logo',
  renderer: ({ context }: { context: Partial<RendererContext> }) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    validate(params: string) {
      return params.trim().match(MARKER_RE)
    },
    render(tokens: FigureToken[], index: number) {
      const match = tokens[index].info.trim().match(DIRECTIVE_RE)
      if (!match) return ''

      const fileName = `_markdown/${context.fileName}.md`
      const lineNumber = tokens[index].map ? tokens[index].map[0] : null
      const [, type, id, attrs] = match
      const attrsObj = attributesObject(attrs, type, { fileName, lineNumber })

      if (!attrsObj.source)
        log.error(
          '[source] attribute is required by [logo] directive, aborting'
        )

      const inputImagePath = state.src.images(attrsObj.source)
      const outputImagePath = `../images/${attrsObj.source}`

      if (!fs.existsSync(inputImagePath))
        log.warn(`Image [${attrsObj.source}] does not exist`)

      delete attrsObj.source // since we need the path relative to `images`
      // Defect, see #727: `type` is passed where attributesString expects a
      // reference object, so `has(type, key)` is false for every key and every
      // attribute is dropped. The cast keeps the call as it is until then
      const attrString = attributesString(
        attrsObj,
        type as unknown as Record<string, unknown>
      )

      return `<figure id="${htmlId(id)}" class="logo">
                    <img style="width:120px;" src="${outputImagePath}" ${attrString}/>
                    </figure>`
    },
  }),
}
