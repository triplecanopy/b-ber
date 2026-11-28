import log from '@canopycanopycanopy/b-ber-logger'
import {
  BLOCK_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import isUndefined from 'lodash/isUndefined'

// Assign a default object to the `context` argument, since we'll refer to
// some of its properties during tests. the properties themselves don't
// need to be defined, though
// `render` is generic so the caller's markdown-it render rule keeps its own
// type through `createRenderer` without this package depending on markdown-it
const renderer = <R>({
  context = {},
  render,
  markerOpen,
  markerClose,
}: {
  // The file `validateOpen` names. Only the old parser plugins call it, which
  // the build no longer registers (TASK-175)
  context?: { fileName?: string }
  render: R
  markerOpen: RegExp
  markerClose: RegExp
}) => ({
  render,
  marker: BLOCK_DIRECTIVE_MARKER,
  minMarkers: BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
  markerOpen,
  markerClose,

  validateOpen(params: string, line: number) {
    // Check to see if we've hit an opening/exit token, i.e., `::: <name>:<id>`
    const match = params.trim().match(markerOpen)
    if (!match || !match.length) return false

    // It's a directive - check to see if it's well-formed.
    const [, type, id] = match
    if (isUndefined(id)) {
      // The directive's missing an `id` attribute, so we extract the
      // fileName from `context` which we've stored in back in
      // `md/index.es6`, and passed into our `renderer`
      throw log.error(
        `Missing [id] for [${type}:start] at ${context.fileName}.md:${line}`
      )
    }

    // Ids used to be recorded in `state.cursor` here, which threw on a
    // duplicate and told the exit apart from another block's. The build's
    // directive rule does both now, per file (TASK-175), and no longer calls
    // this, which b-ber-markdown-renderer's parsers did
    return Boolean(type)
  },
})

export default renderer
