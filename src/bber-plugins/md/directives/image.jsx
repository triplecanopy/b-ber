
import path from 'path'
import fs from 'fs-extra'
import store from 'bber-lib/store'
import imgsize from 'image-size'
import { log } from 'bber-plugins'
import mdInline from 'bber-plugins/md/plugins/inline-block'
import { getImageOrientation, src, htmlComment } from 'bber-utils'
import { attributesObject, htmlId } from 'bber-plugins/md/directives/helpers'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH
} from 'bber-shapes/directives'

const imageOpenRegExp = /(image)(?::([^\s]+)(\s?.*)?)?$/
let seq = 0

export default {
  plugin: mdInline,
  name: 'image',
  renderer: (instance, context) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    markerOpen: imageOpenRegExp,

    validate(params, line) {
      const match = params.trim().match(imageOpenRegExp) || false
      if (typeof match[2] === 'undefined' || typeof match[3] === 'undefined') { // image requires `id` and `source`
        log.error(`
          Missing [id] attribute for [image] directive
          ${context._get('filename')}.md:${line}`)
        return false
      }
      return match
    },

    render(tokens, idx) {
      seq += 1 // TODO: keep track of count somewhere else?

      let result

      const lineNr = tokens[idx].map ? tokens[idx].map[0] : null
      const filename = `_markdown/${context._get('filename')}.md`
      const match = tokens[idx].info.trim().match(imageOpenRegExp)
      const id = match[2]
      const comment = htmlComment(`START: image:${match[1]}#${htmlId(id)}; ${filename}:${lineNr}`)
      const attrsObject = attributesObject(match[3], match[1])
      const asset = path.join(src(), '_images', attrsObject.source)
      const children = tokens[idx].children
      const caption = children ? instance.renderInline(tokens[idx].children) : ''

      try {
        if (!fs.existsSync(asset)) {
          throw new Error(`
          Image not found:
          [${asset}]`)
        }
      } catch (err) {
        log.error(err.message)
        result = htmlComment(`Image not found: ${asset}`)
        return result
      }

      const page = `loi-${seq + 1000}.xhtml`
      const { ...dimensions } = imgsize(asset)
      const { height, width } = dimensions
      const classNames = [getImageOrientation(width, height), 'figure-sm'].join(' ')
      const ref = context._get('filename')

      if ({}.hasOwnProperty.call(attrsObject, 'classes')) {
        attrsObject.classes += ` ${classNames}`
      } else {
        attrsObject.classes = classNames
      }

      store.add('images', { id, seq, ...attrsObject, ...dimensions, page, ref, caption })

      result = `${comment}<div class="${attrsObject.classes}">
        <figure id="ref${htmlId(id)}">
          <a href="${page}#${htmlId(id)}">
            <img data-caption="${caption}"
              src="../images/${encodeURIComponent(attrsObject.source)}"
              alt="${attrsObject.alt}"
            />
          </a>
        </figure>
      </div>`

      return result
    }
  })
}
