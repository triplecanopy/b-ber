// The directive grammar of TASK-161: one block rule, a structure pass that
// pairs blocks and reports diagnostics, and a tree. TASK-174 ports the
// structural blocks (`b-ber-grammar-section`); the other directives keep their
// own plugins until TASK-175.

import type MarkdownIt from 'markdown-it'
import { createRule, LINE_INVALID } from './rule'
import { CLOSE, END_MARK, EXIT_MARK, OPEN, structure } from './structure'
import { liftTree } from './tree'
import type { DirectiveEnv, DirectiveHost } from './types'

export { formatDiagnostic, type Location, locate } from './diagnostics'
export { type DirectiveLine, readDirectiveLine } from './syntax'
export { liftTree } from './tree'
export type * from './types'

// A token as today's renderers read it
export interface LegacyToken {
  type: string
  info: string
  nesting: number
  map: [number, number] | null
}

export interface DirectiveOptions {
  host?: DirectiveHost
  // Today's renderer for the structural blocks (b-ber-grammar-section's
  // `render`). It is called with tokens shaped as b-ber-parser-section made
  // them, at the places that parser put them, so the output is unchanged.
  // Without it the blocks render as plain `<section id>` pairs.
  legacyRender?: (tokens: LegacyToken[], index: number) => string
}

// The spec's behaviour: every `exit` line is the rule's, and nothing is
// shared outside the parse
export const pureHost: DirectiveHost = {
  claimsExit: () => true,
  opened: () => {},
  missingId: () => {},
}

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export function directives(
  md: MarkdownIt.MarkdownIt,
  options: DirectiveOptions = {}
): void {
  const { host = pureHost, legacyRender } = options

  md.block.ruler.before('fence', 'directive', createRule(host), {
    alt: ['paragraph', 'reference', 'blockquote'],
  })
  md.core.ruler.after('block', 'directive_structure', structure)
  md.core.ruler.push('directive_tree', (state) => {
    const env = state.env as DirectiveEnv | undefined
    if (env) env.tree = liftTree(state.tokens)
  })

  const legacy =
    (nesting: number) =>
    (tokens: MarkdownIt.Token[], idx: number): string => {
      const { type, info, map } = tokens[idx]
      return legacyRender ? legacyRender([{ type, info, nesting, map }], 0) : ''
    }

  // An exit was an opener to today's parser, and its range's end a closer
  md.renderer.rules[OPEN] = legacyRender
    ? legacy(1)
    : (tokens, idx) => {
        const { id } = (tokens[idx].meta as { directive: { id: string } })
          .directive
        return `<section id="${escapeAttribute(id)}">`
      }
  md.renderer.rules[EXIT_MARK] = legacy(1)
  md.renderer.rules[END_MARK] = legacy(-1)
  md.renderer.rules[CLOSE] = legacyRender ? () => '' : () => '</section>'
  md.renderer.rules[LINE_INVALID] = () => ''
}
