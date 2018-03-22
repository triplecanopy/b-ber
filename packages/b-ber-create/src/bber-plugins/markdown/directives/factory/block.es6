import store from 'bber-lib/store'
import log from '@canopycanopycanopy/b-ber-logger'
import {
    BLOCK_DIRECTIVE_MARKER,
    BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes/directives'

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
        // check to see if we've hit an opening/exit token, i.e., `::: <name>:<id>`
        const match = params.trim().match(markerOpen) || false

        if (match && match.length) {
            // it's a directive! now check to see if it's well-formed.
            const [, type, id] = match
            if (typeof id === 'undefined') {
                // the directive's missing an `id` attribute, so we extract the
                // filename from `context` which we've stored in back in
                // `md/index.es6`, and passed into our `renderer`
                log.error(`Missing [id] attribute for [${exports.default.name}:start] directive ${context.filename}.md:${line}`)

                // let the parser know that this wasn't a match
                return false
            }

            // we add the `id` to the global store so that we can verify that the
            // container is being properly closed in our `validateClose` method
            const index = store.contains('cursor', { id })

            const isOpening = type && type !== 'exit'
            const isClosing = type && type === 'exit'
            const inStore = index > -1

            const location = `${context.filename}.md:${line}`

            if (isOpening && inStore) {
                // it's a duplicate `id`, throw
                log.error(`Duplicate [id] attribute [${id}]; [id]s must be unique at [${location}]`)
            } else if (isClosing && !inStore) {
                // trying to close an un-opened directive, but it might belong to a
                // different directive type. regardless, we return the match
                return false
            } else if (isOpening && !inStore) {
                // it's a brand new directive
                store.add('cursor', { id, type })
                return true
            } else if (isClosing && inStore) {
                // it's the end of a directive
                // store.remove('cursor', { id }) // removed in `close` in section.es
                return true
            }
        }

        // let the parser know that a match was found. can be either an opening
        // directive, or an `exit` directive
        return match
    },
})

export default renderer
