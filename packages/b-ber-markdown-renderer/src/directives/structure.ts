// The structure pass: a core rule that runs straight after the block parse.
//
// It reads every directive line in the document, from three places:
// - the tokens of the lines the directive rule and the old plugins claimed;
// - the lines old figure-family plugins swallowed as a caption (TASK-161 bug
//   11: a `:::` line is never a caption);
// - the lines markdown-it left as paragraph text.
//
// It then matches every `exit` against the open blocks of its Markdown
// container (the document, a list item, a blockquote) by TASK-161's "Blocks,
// nesting and `exit`", reports what it finds to `env.diagnostics`, and
// rewrites the directive rule's tokens into real pairs:
//
//   directive_line_open (opener) -> directive_open    (+1)
//   directive_line_open (exit)   -> directive_exit    (0, render-only)
//   directive_line_close         -> directive_end     (0, render-only)
//   inserted                        directive_close   (-1)
//
// `directive_exit` and `directive_end` stay where today's parser put its
// tokens, so today's renderer can emit exactly what it emits now. The tokens
// of directives not yet ported (the figure family) are left as they are.

import type MarkdownIt from 'markdown-it'
import { checkLine, type LineSource, label } from './diagnostics'
import {
  EXIT,
  familyOf,
  INLINE,
  isBlockName,
  OWNED,
  STRUCTURAL,
} from './registry'
import { LINE_CLOSE, LINE_INVALID, LINE_OPEN } from './rule'
import { type DirectiveLine, fenceOffset, readDirectiveLine } from './syntax'
import type { Diagnostic, DirectiveEnv, DirectiveNode } from './types'

export const OPEN = 'directive_open'
export const CLOSE = 'directive_close'
export const EXIT_MARK = 'directive_exit'
export const END_MARK = 'directive_end'

// Old plugins whose open and close tokens are adjacent (b-ber-parser-figure)
const FIGURE_CONTAINER_RE = /^container_(figure|audio-video|vimeo|iframe|logo)_/

const isRuleToken = (t: MarkdownIt.Token): boolean =>
  t.type === LINE_OPEN || t.type === LINE_CLOSE
// Every block's tokens are the rule's now. They hold the rest of the
// enclosing range, so they are transparent to the nesting
const isRangeContainer = isRuleToken
const isTransparent = (t: MarkdownIt.Token): boolean =>
  isRangeContainer(t) || FIGURE_CONTAINER_RE.test(t.type)

interface OpenBlock {
  line: DirectiveLine
  // Set for a block the rule owns, whose tokens this pass rewrites
  node: DirectiveNode | null
}

interface Scope {
  // The Markdown container's open token; null for the document
  token: MarkdownIt.Token | null
  blocks: OpenBlock[]
}

const kindOf = (token: MarkdownIt.Token | null): string => {
  if (!token) return 'the file'
  const line = token.map ? ` at line ${token.map[0] + 1}` : ''
  const type = token.type.replace(/_open$/, '')
  const names: Record<string, string> = {
    list_item: 'list item',
    blockquote: 'blockquote',
    footnote_reference: 'footnote',
  }
  return `the ${names[type] ?? type}${line}`
}

const lineStarts = (src: string): number[] => {
  const starts = [0]
  for (let i = src.indexOf('\n'); i !== -1; i = src.indexOf('\n', i + 1))
    starts.push(i + 1)
  return starts
}

export function structure(state: MarkdownIt.StateCore): void {
  const { src, tokens } = state
  const env = (state.env ?? {}) as DirectiveEnv
  const file = env.file ?? ''
  const starts = lineStarts(src)
  const lineEnd = (line: number): number =>
    line + 1 < starts.length ? starts[line + 1] - 1 : src.length

  const found: Diagnostic[] = []
  const report = (d: Diagnostic) => found.push(d)

  // Diagnostics already reported for a span, so a line read twice (from a
  // token and from the text, say) is reported once
  const reported = new Set<number>()
  const read = (
    fenceStart: number,
    line: number,
    source: LineSource
  ): DirectiveLine | null => {
    const directive = readDirectiveLine(src, fenceStart, lineEnd(line))
    if (!directive || reported.has(fenceStart)) return directive
    reported.add(fenceStart)
    for (const d of checkLine(src, directive, file, source)) report(d)
    return directive
  }

  // The first opener of each block id, and each single-line directive's id
  const blockIds = new Map<string, DirectiveLine>()
  const inlineIds = new Map<string, DirectiveLine>()

  const scopes: Scope[] = [{ token: null, blocks: [] }]
  const current = () => scopes[scopes.length - 1]

  // Tokens to insert before an index of `tokens`
  const inserts = new Map<number, MarkdownIt.Token[]>()
  const insert = (at: number, token: MarkdownIt.Token) => {
    const list = inserts.get(at) ?? []
    list.push(token)
    inserts.set(at, list)
  }
  const closeToken = (node: DirectiveNode, level: number) => {
    const token = new state.Token(CLOSE, 'section', -1)
    token.block = true
    token.level = level
    token.meta = { family: familyOf(node.name), directive: node }
    return token
  }

  const openBlock = (
    line: DirectiveLine,
    token: MarkdownIt.Token | null
  ): void => {
    const first = blockIds.get(line.id)
    if (first && STRUCTURAL.has(line.name) && line.idSpan) {
      report({
        code: 'duplicate-id',
        severity: 'error',
        message: `The id \`${line.id}\` is already used`,
        file,
        span: line.idSpan,
        notes: [
          {
            message: `\`${label(first)}\` uses it first`,
            span: first.idSpan ?? first.span,
          },
        ],
      })
    }
    if (!first) blockIds.set(line.id, line)

    let node: DirectiveNode | null = null
    if (token && OWNED.has(line.name)) {
      const attrs: Record<string, string> = {}
      for (const a of line.attributes) attrs[a.key] = a.value
      node = {
        type: 'directive',
        name: line.name,
        id: line.id,
        inline: false,
        attrs,
        position: line.span,
        children: [],
        info: token.info,
        line: token.map ? token.map[0] : 0,
      }
      token.type = OPEN
      token.meta = { ...token.meta, directive: node }
    }
    current().blocks.push({ line, node })
  }

  const exitBlock = (line: DirectiveLine, at: number, level: number): void => {
    if (!line.id) return
    const scope = current()
    const k = scope.blocks.map((b) => b.line.id).lastIndexOf(line.id)

    if (k === -1) {
      report({
        code: 'unmatched-exit',
        severity: 'warning',
        message: `\`${label(line)}\` matches no open block`,
        file,
        span: line.span,
        notes: [unmatchedNote(line.id)],
      })
      return
    }

    const inner = scope.blocks.splice(k + 1)
    const named = scope.blocks.pop() as OpenBlock
    if (inner.length) {
      const names = inner.map((b) => `\`${label(b.line)}\``)
      const list =
        names.length === 1
          ? names[0]
          : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
      report({
        code: 'crossed-exit',
        severity: 'warning',
        message: `\`${label(line)}\` also closes ${list}, which ${
          inner.length === 1 ? 'is' : 'are'
        } still open inside \`${label(named.line)}\``,
        file,
        span: line.span,
        notes: inner.map((b) => ({
          message: `\`${label(b.line)}\` opens here; add \`::: exit:${b.line.id}\``,
          span: b.line.span,
        })),
      })
    }
    for (const b of [...inner.reverse(), named])
      if (b.node) insert(at, closeToken(b.node, level))
  }

  const unmatchedNote = (id: string) => {
    const inline = inlineIds.get(id)
    if (inline) {
      return {
        message: `\`${label(inline)}\` is a single-line directive and has no exit`,
        span: inline.span,
      }
    }
    for (let i = scopes.length - 1; i >= 0; i--) {
      const { blocks } = scopes[i]
      if (blocks.length) {
        const open = blocks[blocks.length - 1].line
        return { message: `\`${label(open)}\` is open here`, span: open.span }
      }
    }
    return { message: 'No block is open' }
  }

  // A directive line, wherever it came from. `token` is the open token of a
  // line the directive rule claimed, whose type this pass rewrites
  const visit = (
    line: DirectiveLine,
    at: number,
    level: number,
    token: MarkdownIt.Token | null
  ): void => {
    if (line.name === EXIT) {
      exitBlock(line, at, level)
      if (token) token.type = EXIT_MARK
      return
    }
    if (!line.id) return
    if (isBlockName(line.name)) {
      openBlock(line, token)
      return
    }
    if (INLINE.has(line.name) && !inlineIds.has(line.id))
      inlineIds.set(line.id, line)
  }

  // Where a scope's content ends: today's containers stack their close
  // tokens at the end of the range, after it. The rule's own have already
  // been rewritten to `directive_end` by the time the scope ends
  const contentEnd = (closeAt: number): number => {
    let i = closeAt
    while (
      i > 0 &&
      (tokens[i - 1].type === END_MARK ||
        (tokens[i - 1].nesting === -1 && isRangeContainer(tokens[i - 1])))
    )
      i--
    return i
  }

  const endScope = (scope: Scope, closeAt: number, level: number): void => {
    const at = contentEnd(closeAt)
    for (const b of scope.blocks) {
      report({
        code: 'unclosed-block',
        severity: 'warning',
        message: `\`${label(b.line)}\` is never closed; it ends at the end of ${kindOf(scope.token)}`,
        file,
        span: b.line.span,
        notes: [{ message: `Add \`::: exit:${b.line.id}\`` }],
      })
    }
    for (const b of [...scope.blocks].reverse())
      if (b.node) insert(at, closeToken(b.node, level))
  }

  // Lines markdown-it left as text, in a paragraph or a setext heading
  const visitText = (inline: MarkdownIt.Token): void => {
    if (!inline.map) return
    const [first] = inline.map
    inline.content.split('\n').forEach((text, k) => {
      const offset = fenceOffset(text)
      if (offset === -1) return
      const line = first + k
      const raw = src.slice(starts[line], lineEnd(line)).trimEnd()
      const rest = text.slice(offset).trimEnd()
      read(starts[line] + raw.length - rest.length, line, 'text')
    })
  }

  // Lines an old figure-family plugin took as its caption
  const visitCaption = (token: MarkdownIt.Token, at: number): void => {
    if (typeof token.children !== 'string' || !token.map) return
    for (let line = token.map[0] + 1; line <= token.map[1]; line++) {
      const text = src.slice(starts[line], lineEnd(line))
      const offset = fenceOffset(text)
      if (offset === -1) continue
      const directive = read(starts[line] + offset, line, 'directive')
      if (directive) visit(directive, at + 2, token.level, null)
    }
  }

  // Open tokens, to pair each close token with
  const stack: { token: MarkdownIt.Token; scope: boolean }[] = []

  tokens.forEach((token, i) => {
    if (token.nesting === 1) {
      const transparent = isTransparent(token)
      stack.push({ token, scope: !transparent })
      if (!transparent) {
        scopes.push({ token, blocks: [] })
        return
      }
      if (!token.map) return
      const line = token.map[0]
      const fenceStart = lineEnd(line) - token.info.length - token.markup.length
      const directive = read(fenceStart, line, 'directive')
      if (directive)
        visit(directive, i, token.level, isRuleToken(token) ? token : null)
      if (FIGURE_CONTAINER_RE.test(token.type)) visitCaption(token, i)
      return
    }

    if (token.nesting === -1) {
      const open = stack.pop()
      if (open?.scope) endScope(scopes.pop() as Scope, i, token.level + 1)
      if (token.type === LINE_CLOSE) {
        token.type = END_MARK
        token.nesting = 0
      }
      return
    }

    if (token.type === LINE_INVALID && token.map) {
      const line = token.map[0]
      read(
        lineEnd(line) - token.info.length - token.markup.length,
        line,
        'directive'
      )
      return
    }

    if (token.type === 'inline' && i > 0) {
      const parent = tokens[i - 1]
      if (
        parent.type === 'paragraph_open' ||
        (parent.type === 'heading_open' && /^[-=]/.test(parent.markup))
      )
        visitText(token)
    }
  })

  endScope(scopes[0], tokens.length, 0)

  // The rule's exit tokens are no longer containers
  for (const token of tokens) {
    if (token.type === EXIT_MARK) token.nesting = 0
  }

  if (inserts.size) {
    const out: MarkdownIt.Token[] = []
    tokens.forEach((token, i) => {
      out.push(...(inserts.get(i) ?? []), token)
    })
    out.push(...(inserts.get(tokens.length) ?? []))
    state.tokens = out
  }

  // Source order, so that one run reads like the file
  found.sort((a, b) => a.span.start - b.span.start)
  env.diagnostics ??= []
  env.diagnostics.push(...found)
}
