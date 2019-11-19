import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import figure from '@canopycanopycanopy/b-ber-parser-figure'
import {
  attributesString,
  attributesObject,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'

const MARKER_RE = /^logo/
const DIRECTIVE_RE = /(logo)(?::([^\s]+)(\s?.*)?)?$/

export default {
  plugin: figure,
  name: 'logo',
  renderer: ({ context }) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    validate(params) {
      return params.trim().match(MARKER_RE)
    },
    render(tokens, index) {
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
      const attrString = attributesString(attrsObj, type)

      return `<figure id="${htmlId(id)}" class="logo">
                    <img style="width:120px;" src="${outputImagePath}" ${attrString}/>
                    </figure>`
    },
  }),
}
