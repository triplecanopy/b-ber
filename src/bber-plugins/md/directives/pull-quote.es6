// we can't use our nice factory for this because it doesn't support
// customized closing elements (always outputs `</section>`), so we have to
// write it long-hand

import plugin from 'bber-plugins/md/plugins/section'
import store from 'bber-lib/store'
import { attributesObject, attributesString } from 'bber-plugins/md/directives/helpers'
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

let _line = null
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
      _line = line
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
    validateClose(params, line) {
      _line = line
      const match = params.trim().match(markerClose) || false
      return match
    },
    render(tokens, idx) {
      const escapeHtml = instance && instance.escapeHtml ? instance.escapeHtml : passThrough
      const filename = `_markdown/${context.filename}.md`
      const lineNr = tokens[idx].map ? tokens[idx].map[0] : null

      let result = ''

      if (tokens[idx].nesting === 1) {
        const token = tokens[idx].info.trim()
        const open = token.match(markerOpen)
        const close = token.match(markerClose)

        if (open) {
          const [, type, id, attrs] = open

          // we could just store the id in a variable outside of `render`, but
          // good to keep consistent with the normal handling
          const index = store.contains('cursor', { id })
          if (index < 0) {
            store.add('cursor', { id })
          } else {
            log.error(`
              Duplicate [id] attribute [${id}]; [id]s must be unique
              ${context.filename}.md:${_line}`)
            return false
          }

          store.add('cursor', { id })

          const attrsObject = attributesObject(attrs, type, { filename, lineNr })

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
          const comment = `\n<!-- START: section:pull-quote#${id} -->\n`
          result = `${comment}<section${attributeStr}>`
        }

        if (close) {
          if (!store.cursor.length) { return result }

          const { id } = store.cursor[store.cursor.length - 1]

          if (id && token.match(new RegExp(`exit:${id}`))) {
            const comment = `\n<!-- END: section:pull-quote#${id} -->\n`
            result = citation ? `<cite>&#8212;&#160;${escapeHtml(citation)}</cite>` : ''
            result += `</section>${comment}`
            citation = ''

            const index = store.contains('cursor', { id })
            if (index > -1) { store.remove('cursor', { id }) }
          }
        }
      }

      return result
    },
  }),
}
