import { State as state } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import type { DirectiveHost } from './directives'

// What b-ber-grammar-renderer's `validateOpen` did for the structural blocks,
// kept until the old plugins stop reading `state.cursor` (TASK-175). The ids
// still go into the cursor because grammar-section's exit and close
// rendering, and the dialogue, gallery, spread and pullquote duplicate
// checks, read them there. The messages are the same, word for word.
export const legacyHost = (context: { fileName: string }): DirectiveHost => ({
  claimsExit: (id) => state.indexOf('cursor', { id }) > -1,

  opened(id, type, line) {
    if (state.indexOf('cursor', { id }) > -1) {
      throw log.error(
        `Duplicate [id] [${id}]. [id] must be unique at [${context.fileName}.md:${line}]`
      )
    }
    state.add('cursor', { id, type })
  },

  missingId(type, line) {
    throw log.error(
      `Missing [id] for [${type}:start] at ${context.fileName}.md:${line}`
    )
  },
})
