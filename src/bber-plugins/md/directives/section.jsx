import section from 'bber-plugins/md/plugins/section'
import store from 'bber-lib/store'
import { log } from 'bber-plugins'
import { attributes, htmlId } from 'bber-plugins/md/directives/helpers'
import { htmlComment } from 'bber-utils'
import {
  BLOCK_DIRECTIVES,
  BLOCK_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH
} from 'bber-shapes/directives'

const containers = BLOCK_DIRECTIVES.join('|')
const containerOpenRegExp = new RegExp(`(${containers})(?::([^\\s]+)(\\s.*)?)?$`)
  // specific close tag generated dynamically in validation below
const containerCloseRegExp = /(exit)(?::([^\s]+))?/

export default {
  plugin: section,
  name: 'section',
  renderer: (instance, context) => ({ // eslint-disable-line no-unused-vars
    marker: BLOCK_DIRECTIVE_MARKER,
    minMarkers: BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
    markerOpen: containerOpenRegExp,

    validateOpen(params, line) {
      // following construct is a bit confusing, but the parser needs a
      // `false` (not `null`) to continue testing for other directives
      const match = params.trim().match(containerOpenRegExp) || false
      if (match && match.length) {
        const id = match[2]
        if (typeof id === 'undefined') { // `match[1]` is section id
          log.error(`
            Missing [id] attribute for [${exports.default.name}:start] directive
            ${context._get('filename')}.md:${line}`)
          return false
        }

        const index = store.contains('cursor', id)
        if (index < 0) { store.add('cursor', id) }
      }

      return match
    },

    validateClose(params, line) {
      const id = store.cursor[store.cursor.length - 1]
      const match = params.trim().match(new RegExp(`(exit)(?::(${id}))?`)) || false
      if (match && match.length) {
        if (typeof match[2] === 'undefined') { // `match[1]` is section id
          const directive = exports.default.name
          const fileName = context._get('filename')
          const location = `${fileName}.md:${line}`
          log.error(`Missing [id] attribute for [${directive}:exit] directive at [${location}]`)
          return false
        }

        const index = store.contains('cursor', id)
        if (index > -1) { store.remove('cursor', id) }
      }

      return match
    },

    render(tokens, idx) {
      let result = ''
      let attrs = ''
      let id
      let startComment
      let endComment

      const lineNr = tokens[idx].map ? tokens[idx].map[0] : null
      const filename = `_markdown/${context._get('filename')}.md`

      if (tokens[idx].nesting === 1) { // built-in open, used for both `section` and `exit`
        const open = tokens[idx].info.trim().match(containerOpenRegExp)
        const close = tokens[idx].info.trim().match(containerCloseRegExp)

        if (open) { // is section directive
          id = open[2] // validated above
          startComment = htmlComment(`START: section:${open[1]}#${htmlId(id)}; ${filename}:${lineNr}`)
          if (open[3]) { // has attributes
            attrs = attributes(open[3], open[1])
            result = `${startComment}<section id="${htmlId(open[2])}"${attrs}>`
          } else { // only id
            result = `${startComment}<section id="${open[2]}">`
          }
        } else if (close) {
          id = close[2] // validated above
          endComment = `<!-- END: section:${close[1]}#${htmlId(id)} -->`
          result = `</section>${endComment}`
        }
      }

      return result
    }
  })
}
