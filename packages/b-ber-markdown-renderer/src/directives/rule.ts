// The directive block rule. It claims the lines that b-ber-parser-section
// claimed for b-ber-grammar-section, -pullquote, -dialogue, -gallery and
// -spread: a structural opener (`::: chapter:a`), a `pullquote`,
// `blockquote`, `dialogue`, `gallery` or `spread` opener, or an `exit`
// (registry.ts's families). Each token records which family claimed
// it, which decides how it renders.
//
// It deliberately reproduces that parser's token *shape*: each claimed line
// opens a container holding the rest of the enclosing range, which closes at
// the range's end. The parse decides tight-list paragraphs and markdown-it's
// `maxNesting` cut-off from token levels, so any other shape would change
// output. The structure pass (structure.ts) then rewrites these tokens into
// real open/close pairs. See TASK-174's Findings.
//
// Silent mode only answers whether the line is a directive line; nothing is
// recorded. That is what fixes the false `Duplicate [id]` after a paragraph.

import type MarkdownIt from 'markdown-it'
import {
  type BlockFamily,
  CLAIM_RE,
  DIALOGUE_CLAIM_RE,
  EXIT,
  type Family,
  GALLERY_CLAIM_RE,
  type InlineFamily,
  PULLQUOTE_CLAIM_RE,
  SPREAD_CLAIM_RE,
} from './registry'
import { markSpeakers } from './speakers'
import type { DirectiveEnv, DirectiveHost } from './types'

export const LINE_OPEN = 'directive_line_open'
export const LINE_CLOSE = 'directive_line_close'
// A claimed line that opens nothing: an opener or exit without an id
export const LINE_INVALID = 'directive_line'
// A single-line directive, with its caption if it has one
export const INLINE_TOKEN = 'directive_inline'

// How a single-line directive's grammar claims its lines: b-ber-parser-figure
// asked the grammar's `validate`, which may throw. `line` is 1-based, and is
// the line markdown-it's block state is at, as that parser passed it
export interface InlineClaim {
  family: InlineFamily
  validate(params: string, line: number): unknown
}

const COLON = 0x3a
const MIN_FENCE = 3

// Which family claims `params`, as the old plugins decided in turn
const claim = (
  params: string,
  host: DirectiveHost,
  env: DirectiveEnv
): { family: BlockFamily; name: string; id: string | undefined } | null => {
  const section = params.trim().match(CLAIM_RE)
  if (section) {
    const [, name, id] = section
    if (name !== EXIT || id === undefined || host.claimsExit(id, env))
      return { family: 'section', name, id }
  }
  const pullquote = params.trim().match(PULLQUOTE_CLAIM_RE)
  if (pullquote) {
    const [, name, id] = pullquote
    return { family: 'pullquote', name, id }
  }
  for (const [family, re] of [
    ['dialogue', DIALOGUE_CLAIM_RE],
    ['gallery', GALLERY_CLAIM_RE],
    ['spread', SPREAD_CLAIM_RE],
  ] as const) {
    const match = params.trim().match(re)
    if (match) {
      const [, name, id] = match
      return { family, name, id }
    }
  }
  return null
}

// The tag each block family's old parser gave its tokens
const TAG: Record<BlockFamily, string> = {
  section: 'section',
  pullquote: 'section',
  dialogue: 'div',
  gallery: 'div',
  spread: 'div',
}

// Work a family's old parser did once a block's tokens were complete, which
// needs more than the parse has (b-ber-parser-gallery's items read State)
export type AfterBlock = Partial<
  Record<Family, (state: MarkdownIt.StateBlock) => void>
>

// What a family test reads of a token, so that it takes b-ber-lib's token
// type as well as markdown-it's
export interface TokenLike {
  type: string
  meta?: unknown
}

export const isFamily =
  (type: string, family: Family) =>
  (token: TokenLike): boolean =>
    token.type === type &&
    (token.meta as { family?: Family } | null)?.family === family

const CAPTION_MARKER_LENGTH = 2

// b-ber-parser-figure's caption scan. A caption is the lines from the next
// line starting `::` to the line after it starting `::`, both at the
// container's column 0; a line starting with one `:` is skipped over, and any
// other line ends the search. A `:::` line is never part of a caption: the
// old scan took it as one, so consecutive single-line directives swallowed
// each other (TASK-161 bug 11). Returns the caption's source and the line
// after the closing `::`
function scanCaption(
  state: MarkdownIt.StateBlock,
  startLine: number,
  endLine: number
): { caption: string | undefined; mapEnd: number; next: number } {
  const { src } = state
  let nextLine = startLine
  let captionStart: number | undefined
  let captionEnd: number | undefined
  let captionEndMark: number | undefined

  for (;;) {
    nextLine += 1
    if (nextLine >= endLine) break
    // The line's first character, ignoring the container's indentation
    // (bMarks, not bMarks + tShift)
    if (src[state.bMarks[nextLine]].charCodeAt(0) !== COLON) break

    const at = state.bMarks[nextLine]
    if (src.charCodeAt(at + 2) === COLON) break
    if (src.charCodeAt(at) === COLON && src.charCodeAt(at + 1) === COLON) {
      if (captionStart === undefined) {
        captionStart = at + CAPTION_MARKER_LENGTH
      } else {
        captionEnd = at
        captionEndMark = at
        break
      }
    }
  }

  if (captionStart && captionEnd) {
    return {
      caption: src.slice(captionStart, captionEnd),
      mapEnd: nextLine,
      next: state.bMarks.indexOf(captionEndMark as number) + 1,
    }
  }
  return { caption: undefined, mapEnd: startLine + 1, next: startLine + 1 }
}

export const createRule =
  (
    host: DirectiveHost,
    afterBlock: AfterBlock = {},
    inline: readonly InlineClaim[] = []
  ) =>
  (
    state: MarkdownIt.StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const { src } = state

    if (src.charCodeAt(start) !== COLON) return false

    let pos = start + 1
    while (pos < max && src.charCodeAt(pos) === COLON) pos++
    if (pos - start < MIN_FENCE) return false

    const markup = src.slice(start, pos)
    const params = src.slice(pos, max)
    const env = state.env as DirectiveEnv
    const claimed = claim(params, host, env)
    if (!claimed) {
      const single = inline.find((c) => c.validate(params, state.line + 1))
      if (!single) return false
      if (silent) return true

      const { caption, mapEnd, next } = scanCaption(state, startLine, endLine)
      const token = state.push(INLINE_TOKEN, 'div', 0)
      token.meta = { family: single.family, caption }
      token.markup = markup
      token.info = params
      token.block = true
      token.map = [startLine, mapEnd]
      state.line = next
      return true
    }

    const { family, name, id } = claimed
    const lineNumber = startLine + 1

    if (id === undefined) {
      // Today this throws, even from silent mode. Answering yes here lets the
      // non-silent call that follows report it at the same line
      if (silent) return true
      host.missingId(name, lineNumber, env)
      const token = state.push(LINE_INVALID, '', 0)
      token.meta = { family }
      token.markup = markup
      token.info = params
      token.block = true
      token.map = [startLine, startLine + 1]
      state.line = startLine + 1
      return true
    }

    if (silent) return true
    // b-ber-grammar-pullquote never recorded its ids; it checked them against
    // the cursor when they rendered
    if (name !== EXIT && family !== 'pullquote')
      host.opened(id, name, lineNumber, env)

    const oldParent = state.parentType
    const oldLineMax = state.lineMax
    // markdown-it's own container rule sets these; nothing in markdown-it
    // reads 'container', but plugins may
    state.parentType = 'container' as typeof state.parentType
    state.lineMax = endLine

    const open = state.push(LINE_OPEN, TAG[family], 1)
    open.meta = { family }
    open.markup = markup
    open.info = params
    open.block = true
    open.map = [startLine, endLine]

    state.md.block.tokenize(state, startLine + 1, endLine)

    const close = state.push(LINE_CLOSE, TAG[family], -1)
    close.meta = { family }
    close.info = params
    close.block = true

    state.parentType = oldParent
    state.lineMax = oldLineMax
    state.line = endLine

    if (family === 'dialogue') {
      markSpeakers(
        state.tokens,
        isFamily(LINE_OPEN, 'dialogue'),
        isFamily(LINE_CLOSE, 'dialogue')
      )
    }
    afterBlock[family]?.(state)
    return true
  }
