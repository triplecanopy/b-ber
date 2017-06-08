
import section from 'bber-plugins/md/plugins/section'
import store from 'bber-lib/store'
import { log } from 'bber-plugins'
import { attributesObject, attributesString, htmlId } from 'bber-plugins/md/directives/helpers'
import {
  BLOCK_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
} from 'bber-shapes/directives'

const containerOpenRegExp = /^(pull-quote)(?::([^\s]+)(\s.*)?)?$/
const containerCloseRegExp = /(exit)(?::([\s]+))?/

// TODO: citation should be bound to the specific element, i.e., pushed into store
// with the key (id)
let citation = ''

export default {
  plugin: section,
  name: 'pullQuote',
  renderer: ({ instance, context }) => ({
    marker: BLOCK_DIRECTIVE_MARKER,
    minMarkers: BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,

    markerOpen: containerOpenRegExp,
    markerClose: containerCloseRegExp,

    validateOpen(params) {
      const match = params.trim().match(containerOpenRegExp) || []
      if (!match.length) { return false } // no match, keep parsing

      const id = match[2]
      if (typeof id === 'undefined') { // there's a match, but missing the required `id` attr
        log.error(`Missing [id] attribute for [${exports.default.name}] directive`)
        return false
      }

      const index = store.contains('cursor', id)
      if (index < 0) { store.add('cursor', id) }

      return match
    },

    validateClose(params) {
      const id = store.cursor[store.cursor.length - 1]
      const match = params.trim().match(new RegExp(`(exit)(?::(${id}))?`)) || []
      if (!match.length) { return false }

      if (typeof match[2] === 'undefined') {
        log.error(`Missing [id] attribute for [${exports.default.name}] directive`)
        return false
      }

      const index = store.contains('cursor', id)
      if (index > -1) { store.remove('cursor', id) }

      return match
    },


    render(tokens, idx) {
      const { escapeHtml } = instance.utils
      const filename = `_markdown/${context.filename}.md`
      const lineNr = tokens[idx].map ? tokens[idx].map[0] : null

      let result = ''
      let id
      let startComment
      let endComment
      let attributeStr

      if (tokens[idx].nesting === 1) {
        const open = tokens[idx].info.trim().match(containerOpenRegExp)
        const close = tokens[idx].info.trim().match(containerCloseRegExp)

        if (open) {
          const attrsObject = attributesObject(open[3], open[1], { filename, lineNr })

          if ({}.hasOwnProperty.call(attrsObject, 'classes')) {
            attrsObject.classes = `pull-quote ${attrsObject.classes}`
          } else {
            attrsObject.classes = 'pull-quote'
          }

          if ({}.hasOwnProperty.call(attrsObject, 'citation')) {
            citation = attrsObject.citation
            delete attrsObject.citation
          }

          attributeStr = ` ${attributesString(attrsObject)}`
          id = open[2]
          startComment = `\n<!-- START: section:${open[1]}#${htmlId(id)} -->\n`
          result = `${startComment}<section${attributeStr}>`
        } else if (close) {
          id = close[2]
          endComment = `\n<!-- END: section:${close[1]}#${htmlId(id)} -->\n`
          result = citation ? `<cite>&#8212;&#160;${escapeHtml(citation)}</cite>` : ''
          result += `</section>${endComment}`
        }
      } else {
        // noop
      }

      return result
    },
  }),
}
