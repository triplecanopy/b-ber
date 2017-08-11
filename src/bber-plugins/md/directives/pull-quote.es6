// we can't use our nice factory for this because it doesn't support
// customized closing elements (always outputs `</section>`), so we have to
// write it long-hand. see comments below

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
const markerOpen = /^(pull-quote|exit)(?::([^\s]+)(\s.*)?)?$/
const markerClose = /(exit)(?::([\s]+))?/

let _line = null
let citation = ''
const pullquoteIndices = [] // track these separately

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
    render(tokens, idx) {
      const renderInline = instance && instance.renderInline ? instance.renderInline : passThrough // `passThrough` during testing

      const filename = `_markdown/${context.filename}.md`
      const lineNr = tokens[idx].map ? tokens[idx].map[0] : null

      let result = ''

      const token = tokens[idx].info.trim()

      // we handle opening and closing render methods on element open, since
      // we need to append data (citation blocks) from the directive's opening
      // attributes to the end of the element
      if (tokens[idx].nesting === 1) {
        // either a `pull-quote` or an `exit` directive, we keep matches for
        // both in `open` and `close` vars below
        const open = token.match(markerOpen)
        const close = token.match(markerClose)

        if (open && !close) {
          // the pull-quote opens
          const [, type, id, attrs] = open

          // we could just store the id in a variable outside of `render`, but
          // good to keep consistent with the normal handling
          const index = store.contains('cursor', { id })
          if (index < 0) {
            // store.add('cursor', { id })
            pullquoteIndices.push(id)
          } else {
            log.error(`Duplicate [id] attribute [${id}]; [id]s must be unique ${context.filename}.md:${_line}`, 1)
          }

          // parse attrs as normal
          const attrsObject = attributesObject(attrs, type, { filename, lineNr })

          if ({}.hasOwnProperty.call(attrsObject, 'classes')) {
            attrsObject.classes = `pull-quote ${attrsObject.classes}`
          } else {
            attrsObject.classes = 'pull-quote'
          }

          // get citation which we'll use below
          if ({}.hasOwnProperty.call(attrsObject, 'citation')) {
            citation = attrsObject.citation
            delete attrsObject.citation
          }

          const attributeStr = ` ${attributesString(attrsObject)}`
          const comment = `\n<!-- START: section:pull-quote#${id} -->\n`
          result = `${comment}<section${attributeStr}>`
        }

        if (close) {
          // it's an exit to a pull-quote. grab the id from the list of
          // indices
          const id = pullquoteIndices[pullquoteIndices.length - 1]

          // check that the id matches our token
          if (id && token.match(new RegExp(`exit:${id}`))) {
            // it's a match for the exit directive's `id`, output the citation
            // with the HTML comment and reset the citation to prepare for the
            // next iteration
            const comment = `\n<!-- END: section:pull-quote#${id} -->\n`
            result = citation ? `<cite>&#8212;&#160;${renderInline(citation)}</cite>` : ''
            result += `</section>${comment}`
            citation = ''

            // update indices
            pullquoteIndices.pop()
          }
        }
      }
      return result
    },
  }),
}
