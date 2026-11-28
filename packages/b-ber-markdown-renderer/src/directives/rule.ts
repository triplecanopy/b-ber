// The directive block rule. It claims the lines that b-ber-parser-section
// claimed for b-ber-grammar-section and b-ber-grammar-pullquote: a structural
// opener (`::: chapter:a`), a `pullquote` or `blockquote` opener, or an
// `exit` (registry.ts's families). Each token records which family claimed
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
import { CLAIM_RE, EXIT, type Family, PULLQUOTE_CLAIM_RE } from './registry'
import type { DirectiveEnv, DirectiveHost } from './types'

export const LINE_OPEN = 'directive_line_open'
export const LINE_CLOSE = 'directive_line_close'
// A claimed line that opens nothing: an opener or exit without an id
export const LINE_INVALID = 'directive_line'

const COLON = 0x3a
const MIN_FENCE = 3

// Which family claims `params`, as the old plugins decided in turn
const claim = (
  params: string,
  host: DirectiveHost,
  env: DirectiveEnv
): { family: Family; name: string; id: string | undefined } | null => {
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
  return null
}

export const createRule =
  (host: DirectiveHost) =>
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
    if (!claimed) return false

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
    if (name !== EXIT && family === 'section')
      host.opened(id, name, lineNumber, env)

    const oldParent = state.parentType
    const oldLineMax = state.lineMax
    // markdown-it's own container rule sets these; nothing in markdown-it
    // reads 'container', but plugins may
    state.parentType = 'container' as typeof state.parentType
    state.lineMax = endLine

    const open = state.push(LINE_OPEN, 'section', 1)
    open.meta = { family }
    open.markup = markup
    open.info = params
    open.block = true
    open.map = [startLine, endLine]

    state.md.block.tokenize(state, startLine + 1, endLine)

    const close = state.push(LINE_CLOSE, 'section', -1)
    close.meta = { family }
    close.info = params
    close.block = true

    state.parentType = oldParent
    state.lineMax = oldLineMax
    state.line = endLine
    return true
  }
