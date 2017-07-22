import store from 'bber-lib/store'
import { log } from 'bber-plugins'
import {
  BLOCK_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
} from 'bber-shapes/directives'

const marker = BLOCK_DIRECTIVE_MARKER
const minMarkers = BLOCK_DIRECTIVE_MARKER_MIN_LENGTH

// we assign a default object to the `context` argument, since we'll refer to
// some of its properties during tests. the properties themselves don't
// need to be defined, though
const renderer = ({ context = {}, render, markerOpen, markerClose }) => ({
  render,
  marker,
  minMarkers,
  markerOpen,
  markerClose,

  validateOpen(params, line) {
    // check to see if we've hit an opening token, i.e., `::: <name>:<id>`
    const match = params.trim().match(markerOpen) || false

    if (match && match.length) {
      // it's a directive! now check to see if it's well-formed. we know that
      // `match[2]` will be the directive's `id`

      const [, , id] = match
      if (typeof id === 'undefined') {
        // the directive's missing an `id` attribute, so we extract the
        // filename from `context` which we've stored in back in
        // `md/index.es6`, and passed into our `renderer`
        log.error(`
          Missing [id] attribute for [${exports.default.name}:start] directive
          ${context.filename}.md:${line}`)

        // let the parser know that this wasn't a match
        return false
      }

      // we add the `id` to the global store so that we can verify that the
      // container is being properly closed in our `validateClose` method
      const index = store.contains('cursor', { id })
      if (index < 0) {
        store.add('cursor', { id })
      } else {
        log.error(`
          Duplicate [id] attribute [${id}]; [id]s must be unique
          ${context.filename}.md:${line}`)
        return false
      }
    }

    // let the parser know that a match was found
    return match
  },

  validateClose(params, line) {
    // test if we've hit an `exit` directive

    // test that there are entries in the `store.cursor`
    if (!store.cursor.length) {
      // see if we can get an `id` attribute from params and stop parsing
      const location = `${context.filename}.md:${line}`
      const id = String(params).split(BLOCK_DIRECTIVE_MARKER)[1]
      log.error(`Directive [exit:${id}] encountered without a matching opening directive at [${location}]`, 1)
    }

    // check that the exit directive has a matching `id` in `store.cursor`
    const { id } = store.cursor[store.cursor.length - 1]
    const index = store.contains('cursor', { id })

    if (index < 0) {
      const location = `${context.filename}.md:${line}`
      log.error(`Directive [exit:${id}] encountered without a matching opening directive at [${location}]`, 1)
    }

    // test that if our token matches our `exit` schema, and matches the last
    // `id` in the global store. this is safe since b-ber doesn't support
    // interleaving block elements
    const match = params.trim().match(new RegExp(`(exit)(?::(${id}))?`)) || false
    if (match && match.length) {
      if (typeof match[2] === 'undefined') {
        // it's a match, but for a different directive. continue parsing
        return false
      }
    }

    // report back to the parser
    return match
  },
})

export default renderer
