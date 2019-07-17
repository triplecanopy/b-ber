import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import { BLOCK_DIRECTIVE_MARKER, BLOCK_DIRECTIVE_MARKER_MIN_LENGTH } from '@canopycanopycanopy/b-ber-shapes/directives'

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
                // fileName from `context` which we've stored in back in
                // `md/index.es6`, and passed into our `renderer`
                log.error(
                    `Missing [id] attribute for [${exports.default.name}:start] directive ${context.fileName}.md:${line}`,
                )

                // let the parser know that this wasn't a match
                return false
            }

            // we add the `id` to the global state so that we can verify that the
            // container is being properly closed in our `validateClose` method
            const index = state.indexOf('cursor', { id })

            const isOpening = type && type !== 'exit'
            const isClosing = type && type === 'exit'
            const inStore = index > -1

            log.debug(`id: ${id}; isOpening: ${isOpening}; isClosing: ${isClosing}; type: ${type}, inStore: ${inStore}`)

            const location = `${context.fileName}.md:${line}`
            if (isOpening && inStore) {
                // it's a duplicate `id`, throw
                log.error(`Duplicate [id] attribute [${id}]. [id] must be unique at [${location}]`)
            } else if (isClosing && !inStore) {
                // trying to close an un-opened directive, but it might belong to a
                // different directive type. regardless, we return the match
                return false
            } else if (isOpening && !inStore) {
                // it's a brand new directive
                state.add('cursor', { id, type })
                return true
            } else if (isClosing && inStore) {
                // it's the end of a directive, handle close in section.js
                return true
            }
        }

        // let the parser know that a match was found. can be either an opening
        // directive, or an `exit` directive
        return match
    },
})

export default renderer
