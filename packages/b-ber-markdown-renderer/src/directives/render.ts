// Renders a document from its tree (TASK-176). Each directive is built as an
// element by its grammar, from its node and its rendered children, so a
// block's markup is opened and closed in one place. Markdown is rendered by
// markdown-it's own rules, a token at a time, as markdown-it renders it: each
// rule is called with the whole token list and the token's index, since rules
// look at the tokens around them (`renderToken`'s line breaks, the footnote
// rules).
//
// The tree holds every token once, in order, and is rendered in that order:
// a block's grammar is called at its opener, its children render, then the
// grammar builds the block. So the grammars' warnings, errors and what they
// collect (figures, footnotes) come in the order they always have.

import type {
  BlockRender,
  ClosedBy,
  DocumentEnv,
  InlineRender,
  XhtmlNode,
} from '@canopycanopycanopy/b-ber-lib'
import type MarkdownIt from 'markdown-it'
import { h, serialize } from '../xhtml'
import type { Family, InlineFamily } from './registry'
import { INLINE_TOKEN, type InlineClaim } from './rule'
import { liftTree, mediaLine } from './tree'
import {
  type DirectiveEnv,
  type DirectiveNode,
  isDirectiveNode,
  type MediaLine,
  type TokenNode,
  type TreeNode,
} from './types'

// markdown-it's options, as its renderer takes them
type RenderOptions = Parameters<MarkdownIt.MarkdownIt['renderer']['render']>[1]

export interface ResolvedMedia {
  params: string
  caption?: string
  // The directive's whole source, rendered as Markdown when no grammar claims
  // it, as the line was when no plugin did
  source: string
}

export interface TreeRenderOptions {
  // Each block family's render. A family without one is a plain
  // `<section id>`
  blocks: Partial<Record<Family, BlockRender>>
  // The single-line directives, in the order their plugins were registered
  inline: readonly (InlineClaim & { render: InlineRender })[]
  media?: {
    method(type: string, id: string, env: DirectiveEnv): ResolvedMedia
  }['method']
  nested: { method(env: DirectiveEnv): DirectiveEnv }['method']
}

// A single-line directive as it renders: from its node, or from its token
// when the line is not one by the spec (`::: junk figure:f`, TASK-161 bug 12)
interface InlineLine {
  family: InlineFamily | 'media'
  info: string
  line: number
  caption?: string
  media?: MediaLine
}

const inlineOfToken = (token: MarkdownIt.Token): InlineLine => {
  const meta = token.meta as {
    family: InlineFamily | 'media'
    caption?: string
  }
  return {
    family: meta.family,
    info: token.info,
    line: token.map ? token.map[0] : 0,
    ...(meta.caption === undefined ? {} : { caption: meta.caption }),
    ...(meta.family === 'media'
      ? { media: mediaLine(meta as Parameters<typeof mediaLine>[0]) }
      : {}),
  }
}

const inlineOfNode = (node: DirectiveNode): InlineLine => ({
  family: node.family as InlineFamily | 'media',
  info: node.info,
  line: node.line,
  ...(node.caption === undefined ? {} : { caption: node.caption }),
  ...(node.media ? { media: node.media } : {}),
})

const plainBlock: BlockRender =
  ({ node }) =>
  (children) =>
    h('section', { id: node.id }, children)

export function renderTokens(
  md: MarkdownIt.MarkdownIt,
  tokens: MarkdownIt.Token[],
  options: RenderOptions,
  renderEnv: DirectiveEnv,
  { blocks, inline, media, nested }: TreeRenderOptions
): string {
  const { renderer } = md
  // The grammars read the document the build passes in the env (b-ber-lib's
  // `DocumentEnv`); markdown-it's rules are given the env as it is
  const env = renderEnv as DirectiveEnv & DocumentEnv
  const index = new Map(tokens.map((token, i) => [token, i]))
  const renders = new Map(inline.map((c) => [c.family, c.render]))

  const token = (t: MarkdownIt.Token): XhtmlNode => {
    const i = index.get(t) as number
    if (t.type === 'inline')
      return h.raw(renderer.renderInline(t.children ?? [], options, env))
    const rule = renderer.rules[t.type]
    return h.raw(
      rule
        ? rule(tokens, i, options, env, renderer)
        : renderer.renderToken(tokens, i, options)
    )
  }

  // A `media` line renders as the directive it resolves to for this target,
  // through the grammar that claims that directive's line. Its caption is
  // media.yml's for the target, or else the one written under the line.
  //
  // A pre-pass used to write media.yml's caption into the Markdown, and then
  // a caption written under the line was left as text after it; with none in
  // media.yml, the written caption was the directive's. Both are kept
  const renderMedia = (line: InlineLine): XhtmlNode => {
    if (!media || !line.media) return h.fragment([])
    const { type, id, captionSource } = line.media
    const resolved = media(type, id, env)
    const caption = resolved.caption ?? line.caption
    const leftover =
      resolved.caption !== undefined && captionSource !== undefined
        ? md.render(captionSource, nested(env))
        : ''
    const claim = inline.find((c) =>
      c.validate(resolved.params, line.line + 1, env)
    )
    // No grammar claims the directive: it was text, and a caption written
    // under it was part of the same paragraph unless media.yml's came between
    if (!claim) {
      return h.raw(
        resolved.caption === undefined && captionSource !== undefined
          ? md.render(`${resolved.source}\n${captionSource}`, nested(env))
          : md.render(resolved.source, nested(env)) + leftover
      )
    }
    const node = {
      info: resolved.params,
      line: line.line,
      ...(caption === undefined ? {} : { caption }),
    }
    return h.fragment([claim.render({ node, env, h }), h.raw(leftover)])
  }

  const renderInline = (line: InlineLine): XhtmlNode => {
    if (line.family === 'media') return renderMedia(line)
    const render = renders.get(line.family)
    if (!render) return h.fragment([])
    const { info, caption } = line
    const node = {
      info,
      line: line.line,
      ...(caption === undefined ? {} : { caption }),
    }
    return render({ node, env, h })
  }

  const renderBlock = (node: DirectiveNode): XhtmlNode => {
    const render =
      blocks[(node.family as Family | undefined) ?? 'section'] ?? plainBlock
    const build = render({ node, env, h })
    const children = node.children.map(renderNode)
    return build(children, node.closedBy ?? ('end' satisfies ClosedBy))
  }

  const renderNode = (node: TreeNode): XhtmlNode => {
    if (isDirectiveNode(node))
      return node.inline ? renderInline(inlineOfNode(node)) : renderBlock(node)
    const { token: t, children, close } = node as TokenNode
    if (t.type === INLINE_TOKEN) return renderInline(inlineOfToken(t))
    if (!children) return token(t)
    // In order: the open token renders before what is inside it
    const open = token(t)
    const inside = children.map(renderNode)
    return h.fragment([open, ...inside, close ? token(close) : null])
  }

  const tree = liftTree(tokens)
  return serialize(h.fragment(tree.children.map(renderNode)))
}
