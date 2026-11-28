// The directive grammar of TASK-161: one block rule, a structure pass that
// pairs blocks and reports diagnostics, and a tree. TASK-174 ported the
// structural blocks (`b-ber-grammar-section`); TASK-175 ports the others, one
// family at a time. The rest keep their own plugins until then.

import type MarkdownIt from 'markdown-it'
import type { Family, InlineFamily } from './registry'
import {
  type AfterBlock,
  blockSpan,
  createRule,
  INLINE_TOKEN,
  type InlineClaim,
  LINE_INVALID,
} from './rule'
import {
  CLOSE,
  type ClosedBy,
  END_MARK,
  EXIT_MARK,
  OPEN,
  structure,
} from './structure'
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
  // A single-line directive's caption source, as b-ber-parser-figure stored
  // it on its open token
  children?: string
}

export type LegacyRender = (tokens: LegacyToken[], index: number) => string

export type { AfterBlock, Family, InlineClaim }
export { blockSpan }

export interface DirectiveOptions {
  host?: DirectiveHost
  afterBlock?: AfterBlock
  // The single-line directives, in the order their plugins were registered:
  // how each grammar claims a line, and how it renders. Without them those
  // lines are text, as they are without the plugins
  inline?: readonly (InlineClaim & { render: LegacyRender })[]
  // Today's renderer for each family (b-ber-grammar-section's,
  // b-ber-grammar-pullquote's and b-ber-grammar-dialogue's `render`). It is called with tokens shaped as
  // b-ber-parser-section made them, at the places that parser put them, so
  // the output is unchanged. A family without one renders as plain
  // `<section id>` pairs.
  legacy?: Partial<Record<Family, LegacyRender>>
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
  const { host = pureHost, legacy = {}, afterBlock = {}, inline = [] } = options

  md.block.ruler.before(
    'fence',
    'directive',
    createRule(host, afterBlock, inline),
    {
      alt: ['paragraph', 'reference', 'blockquote'],
    }
  )
  md.core.ruler.after('block', 'directive_structure', structure)
  md.core.ruler.push('directive_tree', (state) => {
    const env = state.env as DirectiveEnv | undefined
    if (env) env.tree = liftTree(state.tokens)
  })

  const legacyOf = (token: MarkdownIt.Token): LegacyRender | undefined =>
    legacy[(token.meta as { family?: Family } | null)?.family ?? 'section']

  const legacyRule =
    (nesting: number) =>
    (tokens: MarkdownIt.Token[], idx: number): string => {
      if ((tokens[idx].meta as { ignored?: boolean } | null)?.ignored) return ''
      const { type, info, map } = tokens[idx]
      const render = legacyOf(tokens[idx])
      return render ? render([{ type, info, nesting, map }], 0) : ''
    }

  // An exit was an opener to today's parser, and its range's end a closer
  md.renderer.rules[OPEN] = (tokens, idx) => {
    if (legacyOf(tokens[idx])) return legacyRule(1)(tokens, idx)
    const { id } = (tokens[idx].meta as { directive: { id: string } }).directive
    return `<section id="${escapeAttribute(id)}">`
  }
  md.renderer.rules[EXIT_MARK] = legacyRule(1)
  md.renderer.rules[END_MARK] = legacyRule(-1)
  // Today's renderers draw a block's close at its `exit` and at the end of its
  // range. Two blocks got neither, and their output was left unbalanced: one
  // an outer block's `exit` crossed, and a pullquote or blockquote left open.
  // Their close is drawn here, as their own `exit` would draw it (TASK-161).
  // A pullquote's exit is b-ber-grammar-pullquote's to draw; every other
  // block's is b-ber-grammar-section's
  md.renderer.rules[CLOSE] = (tokens, idx) => {
    const token = tokens[idx]
    if (!legacyOf(token)) return '</section>'
    const { family, directive, closedBy } = token.meta as {
      family: Family
      directive: { id: string }
      closedBy: ClosedBy
    }
    const unbalanced =
      closedBy === 'crossed-exit' ||
      (closedBy === 'end' && family === 'pullquote')
    if (!unbalanced) return ''
    const exitFamily: Family = family === 'pullquote' ? 'pullquote' : 'section'
    const render = legacy[exitFamily]
    const info = ` exit:${directive.id}`
    return render
      ? render([{ type: EXIT_MARK, info, nesting: 1, map: token.map }], 0)
      : ''
  }
  md.renderer.rules[LINE_INVALID] = () => ''

  // Rendered by its grammar from the open token b-ber-parser-figure made. Its
  // close token always rendered nothing
  const inlineRender = new Map(inline.map((c) => [c.family, c.render]))
  md.renderer.rules[INLINE_TOKEN] = (tokens, idx) => {
    const { info, map, meta } = tokens[idx]
    const { family, caption } = meta as {
      family: InlineFamily
      caption?: string
    }
    const render = inlineRender.get(family)
    const type = `container_${family}_open`
    return render
      ? render([{ type, info, nesting: 1, map, children: caption }], 0)
      : ''
  }
}
