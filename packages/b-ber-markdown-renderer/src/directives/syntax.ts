// One directive line, read by TASK-161's grammar ("Lines and fences",
// "Grammar"):
//
//   directive-line = indent fence ws* (exit | opener) ws* EOL
//   exit           = "exit" ":" id [ws+ text]
//   opener         = name [":" id] { ws+ (attribute | word) }
//
// Reading a line never fails: what the grammar does not allow is recorded as
// an issue with its span, and `checkLine` turns issues into diagnostics.

import type { Span } from './types'

export interface Attribute {
  key: string
  value: string
  // The key through the end of the value (the closing quote, if any)
  span: Span
}

export type LineIssue =
  | { kind: 'missing-value'; key: string; span: Span }
  | { kind: 'unterminated-quote'; key: string; span: Span }
  | { kind: 'stray-word'; word: string; span: Span }
  | { kind: 'attribute-form'; key: string; span: Span }

export interface DirectiveLine {
  // The fence through the last non-blank character
  span: Span
  fence: Span
  name: string
  nameSpan: Span
  // Whether `:` follows the name
  colon: boolean
  // '' when there is none
  id: string
  idSpan: Span | null
  attributes: Attribute[]
  // After an exit's id: the text that the grammar ignores
  trailing: Span | null
  issues: LineIssue[]
}

const COLON = ':'
const MIN_FENCE = 3

const isBlank = (ch: string | undefined): boolean => ch === ' ' || ch === '\t'
const isQuote = (ch: string | undefined): boolean => ch === '"' || ch === "'"

// keychar: not whitespace, ':', '"' or "'"
const isKeyChar = (ch: string | undefined): boolean =>
  ch !== undefined && !/[\s:"']/.test(ch)

// Reads the directive line whose fence starts at `start` and whose text ends
// at `end` (the line's newline, or the end of the source). Returns null for a
// line that is not a directive line: a short fence, or nothing after it.
export function readDirectiveLine(
  src: string,
  start: number,
  end: number
): DirectiveLine | null {
  let pos = start
  while (pos < end && src[pos] === COLON) pos++
  if (pos - start < MIN_FENCE) return null
  const fence = { start, end: pos }

  let last = end
  while (last > pos && /\s/.test(src[last - 1])) last--

  // markdown-it's container rules trimmed the line, so any whitespace
  while (pos < last && /\s/.test(src[pos])) pos++
  const nameStart = pos
  while (pos < last && !/[\s:]/.test(src[pos])) pos++
  if (pos === nameStart) return null

  const line: DirectiveLine = {
    span: { start, end: last },
    fence,
    name: src.slice(nameStart, pos),
    nameSpan: { start: nameStart, end: pos },
    colon: false,
    id: '',
    idSpan: null,
    attributes: [],
    trailing: null,
    issues: [],
  }

  if (src[pos] === COLON) {
    line.colon = true
    pos++
    const idStart = pos
    while (pos < last && !/\s/.test(src[pos])) pos++
    if (pos > idStart) {
      line.id = src.slice(idStart, pos)
      line.idSpan = { start: idStart, end: pos }
    }
  }

  if (line.name === 'exit') {
    while (pos < last && isBlank(src[pos])) pos++
    if (pos < last) line.trailing = { start: pos, end: last }
    return line
  }

  readAttributes(src, pos, last, line)
  return line
}

function readAttributes(
  src: string,
  from: number,
  last: number,
  line: DirectiveLine
): void {
  let pos = from
  for (;;) {
    while (pos < last && /\s/.test(src[pos])) pos++
    if (pos >= last) return

    const keyStart = pos
    while (pos < last && isKeyChar(src[pos])) pos++
    const key = src.slice(keyStart, pos)

    if (key && src[pos] === COLON) {
      pos = readValue(src, keyStart, key, pos + 1, last, line)
      continue
    }

    // `key "value"`: the form TASK-145 dropped
    let ahead = pos
    while (ahead < last && isBlank(src[ahead])) ahead++
    if (key && ahead > pos && isQuote(src[ahead])) {
      const close = src.indexOf(src[ahead], ahead + 1)
      const end = close === -1 || close >= last ? last : close + 1
      line.issues.push({
        kind: 'attribute-form',
        key,
        span: { start: keyStart, end },
      })
      pos = end
      continue
    }

    // A lone word, or something that starts with ':' or a quote
    while (pos < last && !/\s/.test(src[pos])) pos++
    line.issues.push({
      kind: 'stray-word',
      word: src.slice(keyStart, pos),
      span: { start: keyStart, end: pos },
    })
  }
}

// Reads the value starting at `pos`, just after `key:`, and returns the
// position after it
function readValue(
  src: string,
  keyStart: number,
  key: string,
  from: number,
  last: number,
  line: DirectiveLine
): number {
  let pos = from
  if (pos >= last || /\s/.test(src[pos])) {
    line.issues.push({
      kind: 'missing-value',
      key,
      span: { start: keyStart, end: pos },
    })
    return pos
  }

  if (isQuote(src[pos])) {
    const close = src.indexOf(src[pos], pos + 1)
    if (close === -1 || close >= last) {
      // The value runs to the end of the line
      line.issues.push({
        kind: 'unterminated-quote',
        key,
        span: { start: pos, end: last },
      })
      line.attributes.push({
        key,
        value: src.slice(pos + 1, last),
        span: { start: keyStart, end: last },
      })
      return last
    }
    line.attributes.push({
      key,
      value: src.slice(pos + 1, close),
      span: { start: keyStart, end: close + 1 },
    })
    return close + 1
  }

  const valueStart = pos
  while (pos < last && !/\s/.test(src[pos])) pos++
  line.attributes.push({
    key,
    value: src.slice(valueStart, pos),
    span: { start: keyStart, end: pos },
  })
  return pos
}

// Where the fence of the directive line in `text` starts, for a line of
// Markdown text that markdown-it did not give to a directive rule: up to 3
// spaces or tabs of indentation, then the fence. -1 when it is not one
export const fenceOffset = (text: string): number => {
  const match = /^[ \t]{0,3}:{3}/.exec(text)
  return match ? match[0].length - MIN_FENCE : -1
}
