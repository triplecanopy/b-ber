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
    // we've hit an `exit` token, so we test that its `id` matches the `id`
    // supplied during `validateOpen`. this isn't strictly necessary since
    // b-ber doesn't support interleaving elements (HTML doesn't either for
    // `block` elements), however, it enforces a strict document structure
    // since the alternative is to omit `id`s altogether from closing tokens.

    // TODO: if `renderFactory` is going to be used by multiple directive
    // types (MISC, BLOCK, INLINE, etc) then it needs to track the directive
    // type as well as the index in `cursor` (i.e,.
    // cursor.push({ 'pull-quote': ['theId'] }). this will prevent closing
    // on un-related `exit` directives.
    //
    // although, is this possible?

    // console.log('-- cursor')
    // console.log(store.cursor)

    if (!store.cursor.length) { return false }
    const { id } = store.cursor[store.cursor.length - 1]
    // const index = store.contains('cursor', {id})
    // if (index < 0) { return false }

    const match = params.trim().match(new RegExp(`(exit)(?::(${id}))?`)) || false
    if (match && match.length) {
      // we've hit a match, so we test the `id` against what we have in the
      // global store
      if (typeof match[2] === 'undefined') {
        // no `id`, throw an error and tell the parser that there was no match
        const directive = exports.default.name
        const location = `${context.filename}.md:${line}`
        log.error(`Missing [id] attribute for [${directive}:exit] directive at [${location}]`)
        return false
      }

      // we checked during `validateOpen` that the `id` was unique, so it's OK
      // to just pop it off the stack and continue parsing
      const index = store.contains('cursor', { id })
      if (index > -1) { store.remove('cursor', { id }) }
    }

    // report back to the parser
    return match
  },
})

export default renderer
