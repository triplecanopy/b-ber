import plugin from 'bber-plugins/md/plugins/section'
import { attributesObject, attributesString, htmlId } from 'bber-plugins/md/directives/helpers'
import { log } from 'bber-plugins'
import { passThrough } from 'bber-utils' // for testing
import {
  BLOCK_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
} from 'bber-shapes/directives'

const marker = BLOCK_DIRECTIVE_MARKER
const minMarkers = BLOCK_DIRECTIVE_MARKER_MIN_LENGTH
const markerOpen = /^(pull-quote)(?::([^\s]+)(\s.*)?)?$/
const markerClose = /(exit)(?::([\s]+))?/

let citation = ''

export default {
  plugin,
  name: 'pullQuote',
  renderer: ({ instance, context }) => ({
    marker,
    minMarkers,
    markerOpen,
    markerClose,
    validateOpen(params, line) {
      const match = params.trim().match(markerOpen) || false
      if (match && match.length) {
        const [, , id] = match
        if (typeof id === 'undefined') {
          log.error(`
            Missing [id] attribute for [${exports.default.name}:start] directive
            ${context.filename}.md:${line}`)
          return false
        }
      }
      return match
    },
    validateClose(params/*, line */) {
      const match = params.trim().match(markerClose) || false
      return match
    },
    render(tokens, idx) {
      const escapeHtml = instance && instance.escapeHtml ? instance.escapeHtml : passThrough
      const filename = `_markdown/${context.filename}.md`
      const lineNr = tokens[idx].map ? tokens[idx].map[0] : null

      let result = ''

      if (tokens[idx].nesting === 1) {
        const open = tokens[idx].info.trim().match(markerOpen)
        const close = tokens[idx].info.trim().match(markerClose)

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

          const attributeStr = ` ${attributesString(attrsObject)}`
          const id = open[2]
          const comment = `\n<!-- START: section:${open[1]}#${htmlId(id)} -->\n`
          result = `${comment}<section${attributeStr}>`
        }

        if (close) {
          const id = close[2]
          const comment = `\n<!-- END:asdfasdf section:${close[1]}#${htmlId(id)} -->\n`
          result = citation ? `<cite>&#8212;&#160;${escapeHtml(citation)}</cite>` : ''
          result += `</section>${comment}`
          citation = ''
        }
      }

      return result
    },
  }),
}
