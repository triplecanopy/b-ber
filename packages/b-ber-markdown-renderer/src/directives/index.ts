// The directive grammar of TASK-161: one block rule, a structure pass that
// pairs blocks and reports diagnostics, and a tree, from which the document
// renders (TASK-176). TASK-174 and TASK-175 ported every directive to the
// rule.

import type { BlockRender, InlineRender } from '@canopycanopycanopy/b-ber-lib'
import type MarkdownIt from 'markdown-it'
import type { Family } from './registry'
import { type ResolvedMedia, renderTokens } from './render'
import {
  type AfterBlock,
  blockSpan,
  createRule,
  type InlineClaim,
  LINE_INVALID,
} from './rule'
import { type ClosedBy, END_MARK, EXIT_MARK, structure } from './structure'
import { liftTree } from './tree'
import type { DirectiveEnv, DirectiveHost } from './types'

export { formatDiagnostic, type Location, locate } from './diagnostics'
export { type DirectiveLine, readDirectiveLine } from './syntax'
export { liftTree } from './tree'
export type * from './types'

export type { AfterBlock, ClosedBy, Family, InlineClaim, ResolvedMedia }
export { blockSpan }

export interface DirectiveOptions {
  host?: DirectiveHost
  afterBlock?: AfterBlock
  // The single-line directives, in the order their plugins were registered:
  // how each grammar claims a line, and how it renders. Without them those
  // lines are text, as they are without the plugins
  inline?: readonly (InlineClaim & { render: InlineRender })[]
  // Each block family's render (b-ber-grammar-section's, -pullquote's,
  // -dialogue's, -gallery's and -spread's): the whole block, from its node and
  // its children. A family without one is a plain `<section id>`
  blocks?: Partial<Record<Family, BlockRender>>
  // What a `media` line becomes for the target being built
  // (b-ber-grammar-media's `resolve`): the line of the directive media.yml
  // names, after its fence, and its caption source. It throws for an id or
  // target media.yml lacks, as the build always has. Without it a `media`
  // line renders nothing
  media?: {
    method(type: string, id: string, env: DirectiveEnv): ResolvedMedia
  }['method']
  // The env of a render inside this one: a resolved `media` line, or a
  // caption written under one, rendered as Markdown. Without it a nested
  // render starts with an empty env, as markdown-it's does
  nested?: { method(env: DirectiveEnv): DirectiveEnv }['method']
}

// The spec's behaviour: nothing is thrown, and nothing is shared outside the
// parse
export const pureHost: DirectiveHost = {
  opened: () => {},
  missingId: () => {},
}

export function directives(
  md: MarkdownIt.MarkdownIt,
  options: DirectiveOptions = {}
): void {
  const {
    host = pureHost,
    blocks = {},
    media,
    nested = () => ({}),
    afterBlock = {},
    inline = [],
  } = options

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

  // Every render, a nested one included, renders from the tree. A block is
  // built whole at its node, so the structure pass's `directive_close` draws
  // nothing of its own, nor do the exit line and the end of the block's
  // range. They drew the closes from `state.cursor` until TASK-175, and from
  // a render call of their own until TASK-176
  md.renderer.rules[EXIT_MARK] = () => ''
  md.renderer.rules[END_MARK] = () => ''
  md.renderer.rules[LINE_INVALID] = () => ''
  md.renderer.render = (tokens, rendererOptions, env) =>
    renderTokens(md, tokens, rendererOptions, (env ?? {}) as DirectiveEnv, {
      blocks,
      inline,
      media,
      nested,
    })
}
