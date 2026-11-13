/* eslint-disable camelcase */
/* eslint-disable no-param-reassign,no-plusplus */

import {
  type BlockState,
  State as bberState,
  type CoreRule,
  type CoreState,
  type InlineRule,
  type InlineState,
  type MarkdownItHost,
  type MarkdownToken,
} from '@canopycanopycanopy/b-ber-lib'
import isUndefined from 'lodash/isUndefined'
import Counter from './counter'

/*
Modified version of markdown-it-footnote@3.0.1
https://github.com//markdown-it/markdown-it-footnote
MIT license
*/

const counter = new Counter()

// One note in `env.footnotes.list`: an inline note (`^[…]`) carries its parsed
// tokens, a reference (`[^label]`) its label and how often it is cited
interface FootnoteListItem {
  tokens?: MarkdownToken[]
  label?: string
  count?: number
}

// What these rules keep in markdown-it's `env` while rendering one file, plus
// what b-ber passes in
type FootnoteEnv = {
  footnotes?: {
    // Prefixed with `:` to avoid Object.prototype's members; -1 until cited
    refs?: Record<string, number>
    list?: FootnoteListItem[]
  }
  docId?: string
  reference?: string
}

// The `meta` the rules below store on footnote tokens
interface FootnoteToken extends MarkdownToken {
  meta: { id: number; subId?: number; label?: string }
}

// The renderer rules that one rule calls on another through `slf`
interface FootnoteRenderer {
  rules: { footnote_caption: typeof renderFootnoteCaption }
}

function renderFootnoteAnchorName(
  tokens: FootnoteToken[],
  idx: number,
  _options: unknown,
  env: FootnoteEnv,
  _slf: unknown
): string {
  const n = Number(tokens[idx].meta.id + 1).toString()
  return typeof env.docId === 'string' ? `-${env.docId}-${n}` : ''
}

function renderFootnoteCaption(
  tokens: FootnoteToken[],
  idx: number,
  _options: unknown,
  _env: unknown,
  _slf: unknown
): number | string {
  let n
  if (!bberState.config.group_footnotes) {
    n = counter.listItemCounter(
      bberState.config.group_footnotes,
      bberState.footnotes.length
    )
  } else {
    n = Number(tokens[idx].meta.id + 1)
  }

  const { subId } = tokens[idx].meta
  return subId !== undefined && subId > 0 ? `${n}:${subId}` : n
}

function renderFootnoteRef(
  tokens: FootnoteToken[],
  idx: number,
  options: unknown,
  env: FootnoteEnv,
  slf: FootnoteRenderer
): string {
  const caption = slf.rules.footnote_caption(tokens, idx, options, env, slf)
  const ref = counter.getRef()

  return `<a epub:type="noteref" class="footnote-ref" href="notes.xhtml#fn${ref}" id="fnref${ref}">${caption}</a>`
}

function renderFootnoteBlockOpen(/* tokens, idx, options */): string {
  const start = counter.listCounter(
    bberState.config.group_footnotes,
    bberState.footnotes.length
  )
  return `<ol class="footnotes" start="${start}">`
}

function renderFootnoteBlockClose(): string {
  return '</ol>'
}

function renderFootnoteOpen(
  tokens: FootnoteToken[],
  idx: number,
  _options: unknown,
  env: FootnoteEnv,
  _self: unknown
): string {
  const ref = counter.setRef(tokens[idx].meta.label)
  const child = tokens[idx + 2]

  // push the backlink into the parent paragraph
  if (child) {
    if (!Array.isArray(child.children)) {
      child.children = []
    }

    child.children.push(
      {
        type: 'inline',
        attrs: [
          ['hidden', 'hidden'],
          ['class', 'hidden-backlink'],
        ],
        tag: 'span',
        nesting: 1,
        block: false,
      },
      {
        type: 'inline',
        tag: 'a',
        attrs: [['href', `${env.reference}#fnref${ref}`]],
        nesting: 1,
      },
      {
        type: 'text',
        block: false,
        content: '↵',
      },
      {
        type: 'inline',
        tag: 'a',
        nesting: -1,
      },
      {
        type: 'inline',
        tag: 'span',
        nesting: -1,
      }
    )
  }

  return `<li class="footnote" epub:type="footnote" id="fn${ref}">`
}

function renderFootnoteClose(): string {
  return '</li>'
}

function renderFootnoteAnchor(/*tokens, idx, options,env, slf */): string {
  /* ↩ with escape code to prevent display as Apple Emoji on iOS */
  // return ' <a href="#fnref' + id + '">↩︎</a>';
  return ''
}

// The parts of a MarkdownIt instance this plugin uses, beyond the ones the
// container parsers share. Rule state arguments are markdown-it's StateBlock,
// StateInline and StateCore, which the rules below read dynamically
interface FootnotesHost extends MarkdownItHost {
  helpers: {
    parseLinkLabel(
      state: unknown,
      start: number,
      disableNested?: boolean
    ): number
  }
  utils: { isSpace(code: number): boolean }
  inline: {
    ruler: {
      after(afterName: string, ruleName: string, rule: InlineRule): void
    }
  }
  core: {
    ruler: {
      after(afterName: string, ruleName: string, rule: CoreRule): void
    }
  }
}

// `callback` receives the footnote tokens, which b-ber-grammar-footnotes
// renders into the notes page
export default function footnotePlugin(
  md: FootnotesHost,
  callback: (tokens: MarkdownToken[]) => void
): void {
  const { parseLinkLabel } = md.helpers
  const { isSpace } = md.utils

  md.renderer.rules.footnote_ref = renderFootnoteRef
  md.renderer.rules.footnote_block_open = renderFootnoteBlockOpen
  md.renderer.rules.footnote_block_close = renderFootnoteBlockClose
  md.renderer.rules.footnote_open = renderFootnoteOpen
  md.renderer.rules.footnote_close = renderFootnoteClose
  md.renderer.rules.footnote_anchor = renderFootnoteAnchor

  // helpers (only used in other rules, no tokens are attached to those)
  md.renderer.rules.footnote_caption = renderFootnoteCaption
  md.renderer.rules.footnoteAnchorName = renderFootnoteAnchorName

  // Process footnote block definition
  function footnoteDef(
    state: BlockState<FootnoteEnv>,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]

    let pos
    let token
    let offset
    let ch

    // line should be at least 5 chars - "[^x]:"
    if (start + 4 > max) return false

    if (state.src.charCodeAt(start) !== 0x5b /* [ */) return false
    if (state.src.charCodeAt(start + 1) !== 0x5e /* ^ */) return false

    for (pos = start + 2; pos < max; pos++) {
      if (state.src.charCodeAt(pos) === 0x20) return false
      if (state.src.charCodeAt(pos) === 0x5d /* ] */) {
        break
      }
    }

    if (pos === start + 2) return false // no empty footnote labels
    if (pos + 1 >= max || state.src.charCodeAt(++pos) !== 0x3a /* : */) {
      return false
    }
    if (silent) return true
    pos++

    // Footnote is found, start parsing footnote body here

    if (!state.env.footnotes) state.env.footnotes = {}
    if (!state.env.footnotes.refs) state.env.footnotes.refs = {}
    const label = state.src.slice(start + 2, pos - 2)

    state.env.footnotes.refs[`:${label}`] = -1

    token = new state.Token('footnote_reference_open', '', 1)
    token.meta = { label }
    token.level = state.level++
    state.tokens.push(token)

    const oldBMark = state.bMarks[startLine]
    const oldTShift = state.tShift[startLine]
    const oldSCount = state.sCount[startLine]
    const oldParentType = state.parentType
    const posAfterColon = pos

    // eslint-disable-next-line no-multi-assign
    const initial = (offset =
      state.sCount[startLine] +
      pos -
      (state.bMarks[startLine] + state.tShift[startLine]))

    while (pos < max) {
      ch = state.src.charCodeAt(pos)

      if (isSpace(ch)) {
        if (ch === 0x09) {
          offset += 4 - (offset % 4)
        } else {
          offset++
        }
      } else {
        break
      }

      pos++
    }

    state.tShift[startLine] = pos - posAfterColon
    state.sCount[startLine] = offset - initial

    state.bMarks[startLine] = posAfterColon
    state.blkIndent += 4
    state.parentType = 'footnote'

    if (state.sCount[startLine] < state.blkIndent) {
      state.sCount[startLine] += state.blkIndent
    }

    state.md.block.tokenize(state, startLine, endLine, true)

    state.parentType = oldParentType
    state.blkIndent -= 4
    state.tShift[startLine] = oldTShift
    state.sCount[startLine] = oldSCount
    state.bMarks[startLine] = oldBMark

    token = new state.Token('footnote_reference_close', '', -1)
    token.level = --state.level
    state.tokens.push(token)

    return true
  }

  // Process inline footnotes (^[...])
  function footnoteInline(
    state: InlineState<FootnoteEnv>,
    silent: boolean
  ): boolean {
    const max = state.posMax
    const start = state.pos

    let footnoteId
    let token
    let tokens: MarkdownToken[]

    if (start + 2 >= max) return false
    if (state.src.charCodeAt(start) !== 0x5e /* ^ */) return false
    if (state.src.charCodeAt(start + 1) !== 0x5b /* [ */) return false

    const labelStart = start + 2
    const labelEnd = parseLinkLabel(state, start + 1)

    // Failed to find ']', so it's not a valid note
    if (labelEnd < 0) return false

    // Found the end of the link, and know for a fact it's a valid link; so
    // all that's left to do is to call tokenizer.
    if (!silent) {
      if (!state.env.footnotes) state.env.footnotes = {}
      if (!state.env.footnotes.list) state.env.footnotes.list = []
      footnoteId = state.env.footnotes.list.length

      state.md.inline.parse(
        state.src.slice(labelStart, labelEnd),
        state.md,
        state.env,
        (tokens = [])
      )

      token = state.push('footnote_ref', '', 0)
      token.meta = { id: footnoteId }

      state.env.footnotes.list[footnoteId] = { tokens }
    }

    state.pos = labelEnd + 1
    state.posMax = max
    return true
  }

  // Process footnote references ([^...])
  function footnoteRef(
    state: InlineState<FootnoteEnv>,
    silent: boolean
  ): boolean {
    const max = state.posMax
    const start = state.pos

    let pos
    let footnoteId
    let footnoteSubId
    let token

    // should be at least 4 chars - "[^x]"
    if (start + 3 > max) return false

    if (!state.env.footnotes || !state.env.footnotes.refs) return false
    if (state.src.charCodeAt(start) !== 0x5b /* [ */) return false
    if (state.src.charCodeAt(start + 1) !== 0x5e /* ^ */) return false

    for (pos = start + 2; pos < max; pos++) {
      if (state.src.charCodeAt(pos) === 0x20) return false
      if (state.src.charCodeAt(pos) === 0x0a) return false
      if (state.src.charCodeAt(pos) === 0x5d /* ] */) break
    }

    if (pos === start + 2) return false // no empty footnote labels
    if (pos >= max) return false
    pos++

    const label = state.src.slice(start + 2, pos - 1)
    if (isUndefined(state.env.footnotes.refs[`:${label}`])) return false

    if (!silent) {
      if (!state.env.footnotes.list) state.env.footnotes.list = []

      if (state.env.footnotes.refs[`:${label}`] < 0) {
        footnoteId = state.env.footnotes.list.length
        state.env.footnotes.list[footnoteId] = {
          label,
          count: 0,
        }
        state.env.footnotes.refs[`:${label}`] = footnoteId
      } else {
        footnoteId = state.env.footnotes.refs[`:${label}`]
      }

      // A reference, which was given a count when first cited
      const cited = state.env.footnotes.list[footnoteId] as { count: number }
      footnoteSubId = cited.count
      cited.count++

      token = state.push('footnote_ref', '', 0)
      token.meta = { id: footnoteId, subId: footnoteSubId, label }
    }

    state.pos = pos
    state.posMax = max
    return true
  }

  // Glue footnote tokens to end of token stream
  function footnoteTail(state: CoreState<FootnoteEnv>): void {
    const refTokens: Record<string, MarkdownToken[]> = {}

    let i
    let l
    let j
    let t
    let lastParagraph
    let token
    let tokens
    let current: MarkdownToken[]
    let currentLabel: string | undefined
    let insideRef = false
    let footnoteTokens: MarkdownToken[] = []

    if (!state.env.footnotes) return

    state.tokens = state.tokens.filter((tok) => {
      if (tok.type === 'footnote_reference_open') {
        insideRef = true
        current = []
        currentLabel = (tok as FootnoteToken).meta.label
        return false
      }
      if (tok.type === 'footnote_reference_close') {
        insideRef = false
        // prepend ':' to avoid conflict with Object.prototype members
        refTokens[`:${currentLabel}`] = current
        return false
      }
      if (insideRef) current.push(tok)
      return !insideRef
    })

    if (!state.env.footnotes.list) return
    const { list } = state.env.footnotes

    token = new state.Token('footnote_block_open', '', 1)
    state.tokens.push(token)

    for (i = 0, l = list.length; i < l; i++) {
      const item = list[i]
      token = new state.Token('footnote_open', '', 1)
      token.meta = { id: i, label: item.label }
      state.tokens.push(token)

      if (item.tokens) {
        tokens = []

        token = new state.Token('paragraph_open', 'p', 1)
        token.block = true
        tokens.push(token)

        token = new state.Token('inline', '', 0)
        token.children = item.tokens
        token.content = ''
        tokens.push(token)

        token = new state.Token('paragraph_close', 'p', -1)
        token.block = true
        tokens.push(token)
      } else if (item.label) {
        tokens = refTokens[`:${item.label}`]
      }

      // Every item is either an inline note or a reference, so one branch
      // above has set `tokens`
      state.tokens = state.tokens.concat(tokens as MarkdownToken[])
      if (state.tokens[state.tokens.length - 1].type === 'paragraph_close') {
        lastParagraph = state.tokens.pop()
      } else {
        lastParagraph = null
      }

      t = item.count && item.count > 0 ? item.count : 1
      for (j = 0; j < t; j++) {
        token = new state.Token('footnote_anchor', '', 0)
        token.meta = { id: i, subId: j, label: item.label }
        state.tokens.push(token)
      }

      if (lastParagraph) {
        state.tokens.push(lastParagraph)
      }

      token = new state.Token('footnote_close', '', -1)
      state.tokens.push(token)
    }

    token = new state.Token('footnote_block_close', '', -1)
    state.tokens.push(token)

    // create return value for callback
    insideRef = false
    footnoteTokens = [...state.tokens].filter((a) => {
      if (a.type === 'footnote_block_open') {
        insideRef = true
        return true
      }
      if (a.type === 'footnote_block_close') {
        insideRef = false
        return true
      }

      return insideRef
    })

    // remove footnotes from `state.tokens`
    insideRef = false
    state.tokens = state.tokens.filter((_) => {
      if (_.type === 'footnote_block_open') {
        insideRef = true
        return false
      }
      if (_.type === 'footnote_block_close') {
        insideRef = false
        return false
      }

      return !insideRef
    })

    // return to MarkdownRenderer class
    callback(footnoteTokens)
  }

  md.block.ruler.before('reference', 'footnote_def', footnoteDef, {
    alt: ['paragraph', 'reference'],
  })
  md.inline.ruler.after('image', 'footnote_inline', footnoteInline)
  md.inline.ruler.after('footnote_inline', 'footnote_ref', footnoteRef)
  md.core.ruler.after('inline', 'footnote_tail', footnoteTail)
}
