/* eslint-disable camelcase */
/* eslint-disable no-param-reassign,no-plusplus */

import isUndefined from 'lodash.isundefined'
import bberState from '@canopycanopycanopy/b-ber-lib/State'

/*
Modified version of markdown-it-footnote@3.0.1
https://github.com//markdown-it/markdown-it-footnote
MIT license
*/

function renderFootnoteAnchorName(tokens, idx, options, env /*, slf*/) {
  const n = Number(tokens[idx].meta.id + 1).toString()
  return typeof env.docId === 'string' ? `-${env.docId}-${n}` : ''
}

function renderFootnoteCaption(tokens, idx /*,options, env, slf*/) {
  const n = Number(tokens[idx].meta.id + 1).toString()
  return tokens[idx].meta.subId > 0 ? `${n}:${tokens[idx].meta.subId}` : n
}

function renderFootnoteRef(tokens, idx, options, env, slf) {
  const caption = slf.rules.footnote_caption(tokens, idx, options, env, slf)
  const ref = tokens[idx].meta.label
  return `<a epub:type="noteref" class="footnote-ref" href="notes.xhtml#fn${ref}" id="fnref${ref}">${caption}</a>`
}

// Keep track of footnotes that have been rendered to start new ordered lists at
// proper count
let counter = 1
function renderFootnoteBlockOpen(/* tokens, idx, options */) {
  return `<ol class="footnotes" start=${counter}>`
}

function renderFootnoteBlockClose() {
  return '</ol>'
}

function renderFootnoteOpen(tokens, idx, options, env /*,slf */) {
  const ref = tokens[idx].meta.label
  const childIndex = idx + 2

  // Increment counter for ordered lists
  if (!bberState.config.group_footnotes) counter += 1

  // push the backlink into the parent paragraph
  if (tokens[childIndex]) {
    if (!Array.isArray(tokens[childIndex].children)) {
      tokens[childIndex].children = []
    }
    tokens[childIndex].children.push(
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
        content: '\u21B5',
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

function renderFootnoteClose() {
  return '</li>'
}

function renderFootnoteAnchor(/*tokens, idx, options,env, slf */) {
  /* ↩ with escape code to prevent display as Apple Emoji on iOS */
  // return ' <a href="#fnref' + id + '">\u21a9\uFE0E</a>';
  return ''
}

module.exports = function footnotePlugin(md, callback) {
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
  function footnoteDef(state, startLine, endLine, silent) {
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
    if (pos + 1 >= max || state.src.charCodeAt(++pos) !== 0x3a /* : */)
      return false
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
  function footnoteInline(state, silent) {
    const max = state.posMax
    const start = state.pos

    let footnoteId
    let token
    let tokens

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
  function footnoteRef(state, silent) {
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

      footnoteSubId = state.env.footnotes.list[footnoteId].count
      state.env.footnotes.list[footnoteId].count++

      token = state.push('footnote_ref', '', 0)
      token.meta = { id: footnoteId, subId: footnoteSubId, label }
    }

    state.pos = pos
    state.posMax = max
    return true
  }

  // Glue footnote tokens to end of token stream
  function footnoteTail(state) {
    const refTokens = {}

    let i
    let l
    let j
    let t
    let lastParagraph
    let token
    let tokens
    let current
    let currentLabel
    let insideRef = false
    let footnoteTokens = []

    if (!state.env.footnotes) return

    state.tokens = state.tokens.filter(tok => {
      if (tok.type === 'footnote_reference_open') {
        insideRef = true
        current = []
        currentLabel = tok.meta.label
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
      token = new state.Token('footnote_open', '', 1)
      token.meta = { id: i, label: list[i].label }
      state.tokens.push(token)

      if (list[i].tokens) {
        tokens = []

        token = new state.Token('paragraph_open', 'p', 1)
        token.block = true
        tokens.push(token)

        token = new state.Token('inline', '', 0)
        token.children = list[i].tokens
        token.content = ''
        tokens.push(token)

        token = new state.Token('paragraph_close', 'p', -1)
        token.block = true
        tokens.push(token)
      } else if (list[i].label) {
        tokens = refTokens[`:${list[i].label}`]
      }

      state.tokens = state.tokens.concat(tokens)
      if (state.tokens[state.tokens.length - 1].type === 'paragraph_close') {
        lastParagraph = state.tokens.pop()
      } else {
        lastParagraph = null
      }

      t = list[i].count > 0 ? list[i].count : 1
      for (j = 0; j < t; j++) {
        token = new state.Token('footnote_anchor', '', 0)
        token.meta = { id: i, subId: j, label: list[i].label }
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
    footnoteTokens = [...state.tokens].filter(a => {
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
    state.tokens = state.tokens.filter(_ => {
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
