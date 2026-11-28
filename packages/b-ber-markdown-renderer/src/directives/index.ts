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
  exitFamilyOf,
  OPEN,
  structure,
} from './structure'
import { liftTree } from './tree'
import type { DirectiveEnv, DirectiveHost, DirectiveNode } from './types'

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

// A markdown-it render rule's arguments, with the token shaped as the old
// parsers made it. Written as a method so that a grammar's render may declare
// the env it reads (b-ber-lib's `DocumentEnv`): TypeScript checks a method's
// parameters bivariantly
export type LegacyRender = {
  method(
    tokens: LegacyToken[],
    index: number,
    options: unknown,
    env: DirectiveEnv
  ): string
}['method']

export type { AfterBlock, ClosedBy, Family, InlineClaim }
export { blockSpan }

export interface DirectiveOptions {
  host?: DirectiveHost
  afterBlock?: AfterBlock
  // The single-line directives, in the order their plugins were registered:
  // how each grammar claims a line, and how it renders. Without them those
  // lines are text, as they are without the plugins
  inline?: readonly (InlineClaim & { render: LegacyRender })[]
  // Today's renderer for each block family's opener (b-ber-grammar-section's,
  // -pullquote's, -dialogue's, -gallery's and -spread's `render`). It is
  // called with a token shaped as their parsers made it, so the output is
  // unchanged. A family without one opens as a plain `<section id>`
  legacy?: Partial<Record<Family, LegacyRender>>
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
  // What draws a block's close: b-ber-grammar-pullquote's `close` for a
  // pullquote or blockquote, b-ber-grammar-section's for every other block.
  // Without one a block closes with a plain `</section>`
  close?: Partial<Record<'section' | 'pullquote', BlockClose>>
}

export interface ResolvedMedia {
  params: string
  caption?: string
  // The directive's whole source, rendered as Markdown when no grammar claims
  // it, as the line was when no plugin did
  source: string
}

// A block being closed, as the close renderers take it
export interface ClosingBlock {
  name: string
  id: string
  // The opener's line after the fence
  info: string
}

export type BlockClose = {
  method(block: ClosingBlock, closedBy: ClosedBy, env: DirectiveEnv): string
}['method']

// The spec's behaviour: nothing is thrown, and nothing is shared outside the
// parse
export const pureHost: DirectiveHost = {
  opened: () => {},
  missingId: () => {},
}

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export function directives(
  md: MarkdownIt.MarkdownIt,
  options: DirectiveOptions = {}
): void {
  const {
    host = pureHost,
    legacy = {},
    close = {},
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

  const legacyOf = (token: MarkdownIt.Token): LegacyRender | undefined =>
    legacy[(token.meta as { family?: Family } | null)?.family ?? 'section']

  md.renderer.rules[OPEN] = (tokens, idx, options, env) => {
    const { type, info, map } = tokens[idx]
    const render = legacyOf(tokens[idx])
    if (render)
      return render(
        [{ type, info, nesting: 1, map }],
        0,
        options,
        env as DirectiveEnv
      )
    const { id } = (tokens[idx].meta as { directive: { id: string } }).directive
    return `<section id="${escapeAttribute(id)}">`
  }

  // Every block's close is drawn at its `directive_close`, which the structure
  // pass puts where the block closes: at its `exit`, at an outer block's
  // `exit` that crossed it, or at the end of its container. The exit line and
  // the end of the block's range draw nothing. They drew the closes from
  // `state.cursor` until TASK-175, which left a crossed block or an unclosed
  // pullquote open, and let an exit that closed nothing crash or close the
  // wrong block
  md.renderer.rules[EXIT_MARK] = () => ''
  md.renderer.rules[END_MARK] = () => ''
  md.renderer.rules[CLOSE] = (tokens, idx, _options, env) => {
    const { directive, closedBy } = tokens[idx].meta as {
      directive: DirectiveNode
      closedBy: ClosedBy
    }
    const closer = close[exitFamilyOf(directive.name)]
    if (!closer) return '</section>'
    const { name, id, info } = directive
    return closer({ name, id, info }, closedBy, env as DirectiveEnv)
  }
  md.renderer.rules[LINE_INVALID] = () => ''

  // Rendered by its grammar from the open token b-ber-parser-figure made. Its
  // close token always rendered nothing
  const inlineRender = new Map(inline.map((c) => [c.family, c.render]))
  // A `media` line renders as the directive it resolves to for this target,
  // through the grammar that claims that directive's line. Its caption is
  // media.yml's for the target, or else the one written under the line.
  //
  // A pre-pass used to write media.yml's caption into the Markdown, and then
  // a caption written under the line was left as text after it; with none in
  // media.yml, the written caption was the directive's. Both are kept
  const renderMedia = (
    meta: {
      mediaType: string
      mediaId: string
      caption?: string
      captionSource?: string
    },
    map: [number, number] | null,
    env: DirectiveEnv
  ): string => {
    if (!media) return ''
    const resolved = media(meta.mediaType, meta.mediaId, env)
    const caption = resolved.caption ?? meta.caption
    const leftover =
      resolved.caption !== undefined && meta.captionSource !== undefined
        ? md.render(meta.captionSource, nested(env))
        : ''
    const line = (map ? map[0] : 0) + 1
    const claim = inline.find((c) => c.validate(resolved.params, line, env))
    // No grammar claims the directive: it was text, and a caption written
    // under it was part of the same paragraph unless media.yml's came between
    if (!claim) {
      return resolved.caption === undefined && meta.captionSource !== undefined
        ? md.render(`${resolved.source}\n${meta.captionSource}`, nested(env))
        : md.render(resolved.source, nested(env)) + leftover
    }
    const type = `container_${claim.family}_open`
    return (
      claim.render(
        [{ type, info: resolved.params, nesting: 1, map, children: caption }],
        0,
        md.options,
        env
      ) + leftover
    )
  }

  md.renderer.rules[INLINE_TOKEN] = (tokens, idx, options, env) => {
    const { info, map, meta } = tokens[idx]
    if ((meta as { family: string }).family === 'media') {
      return renderMedia(
        meta as Parameters<typeof renderMedia>[0],
        map as [number, number] | null,
        env as DirectiveEnv
      )
    }
    const { family, caption } = meta as {
      family: InlineFamily
      caption?: string
    }
    const render = inlineRender.get(family)
    const type = `container_${family}_open`
    return render
      ? render(
          [{ type, info, nesting: 1, map, children: caption }],
          0,
          options,
          env as DirectiveEnv
        )
      : ''
  }
}
