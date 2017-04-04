
import path from 'path'
import fs from 'fs-extra'
import store from 'bber-lib/store'
import imgsize from 'image-size'
import { log } from 'bber-plugins'
import figure from 'bber-plugins/md/plugins/figure'
import figTmpl from 'bber-templates/figures'
import { getImageOrientation, src, htmlComment, build } from 'bber-utils'
import { attributesObject, htmlId } from 'bber-plugins/md/directives/helpers'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH
} from 'bber-shapes/directives'

const imageOpenRegExp = /((?:inline-)?image)(?::([^\s]+)(\s?.*)?)?$/
let seq = 0

export default {
  plugin: figure,
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
      const match = tokens[idx].info.trim().match(imageOpenRegExp)
      const type = match[1]
      const id = match[2]
      const lineNr = tokens[idx].map ? tokens[idx].map[0] : null
      const filename = `_markdown/${context._get('filename')}.md`
      const children = tokens[idx].children
      const caption = children ? instance.renderInline(tokens[idx].children) : ''
      const comment = htmlComment(`START: ${type}:${match[1]}#${htmlId(id)}; ${filename}:${lineNr}`)
      const attrsObject = attributesObject(match[3], match[1])
      const asset = path.join(src(), '_images', attrsObject.source)
      const { ...dimensions } = imgsize(asset)
      const { width, height } = dimensions

      let result, page, classNames, ref, imageData

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

      switch (type) {
        case 'image':
          seq += 1 // TODO: keep track of count somewhere else?

          page = `loi-${seq + 1000}.xhtml`
          classNames = [getImageOrientation(width, height), 'figure-sm'].join(' ')
          ref = context._get('filename')

          if ({}.hasOwnProperty.call(attrsObject, 'classes')) {
            attrsObject.classes += ` ${classNames}`
          } else {
            attrsObject.classes = classNames
          }

          store.add('images', { id: htmlId(id), seq, ...attrsObject, ...dimensions, page, ref, caption })

          result = `${comment}<div class="${attrsObject.classes}">
            <figure id="ref${htmlId(id)}">
              <a href="${page}#${htmlId(id)}">
                <img src="../images/${encodeURIComponent(attrsObject.source)}" alt="${attrsObject.alt}"
                />
              </a>
            </figure>
          </div>`
          break
        case 'inline-image':
          imageData = Object.assign({}, attrsObject, { id: htmlId(id), width, height, caption, inline: true })
          result = figTmpl(imageData, build())
          break
        default:
          break
      }

      return result
    }
  })
}
