import store from 'bber-lib/store'
import { log } from 'bber-plugins'
import {
  BLOCK_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
} from 'bber-shapes/directives'

const renderer = render => ({ context = { filename: '' } }, markerOpen, markerClose) => ({
  render,
  markerOpen,
  markerClose,
  marker: BLOCK_DIRECTIVE_MARKER,
  minMarkers: BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
  validateOpen(params, line) {
    const match = params.trim().match(markerOpen) || false
    if (match && match.length) {
      const id = match[2]
      if (typeof id === 'undefined') { // `match[1]` is section id
        log.error(`
          Missing [id] attribute for [${exports.default.name}:start] directive
          ${context.filename}.md:${line}`)
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
      if (typeof match[2] === 'undefined') {
        const directive = exports.default.name
        const fileName = context.filename
        const location = `${fileName}.md:${line}`
        log.error(`Missing [id] attribute for [${directive}:exit] directive at [${location}]`)
        return false
      }

      const index = store.contains('cursor', id)
      if (index > -1) { store.remove('cursor', id) }
    }

    return match
  },
})

export default renderer
