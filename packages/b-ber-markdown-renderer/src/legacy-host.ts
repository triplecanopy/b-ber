import log from '@canopycanopycanopy/b-ber-logger'
import type { DirectiveEnv, DirectiveHost } from './directives'

// The two errors the build throws on a directive, word for word as
// b-ber-grammar-renderer's `validateOpen` threw them. The parse reports both
// as diagnostics too; the build still stops on them.
//
// A block id must be unique within its file. The ids were kept in
// `state.cursor` until TASK-175, which held an unclosed block's id for the
// rest of the build, so a later file could fail on it, and did not check
// pullquote and blockquote ids against the others. They are kept per parse
export const legacyHost = (context: { fileName: string }): DirectiveHost => {
  const ids = new WeakMap<DirectiveEnv, Set<string>>()

  return {
    opened(id, _type, line, env) {
      let seen = ids.get(env)
      if (!seen) {
        seen = new Set()
        ids.set(env, seen)
      }
      if (seen.has(id)) {
        throw log.error(
          `Duplicate [id] [${id}]. [id] must be unique at [${context.fileName}.md:${line}]`
        )
      }
      seen.add(id)
    },

    missingId(type, line) {
      throw log.error(
        `Missing [id] for [${type}:start] at ${context.fileName}.md:${line}`
      )
    },
  }
}
