import {
  BLOCK_ATTRIBUTES,
  DEPRECATED_NAMES,
  DRAFT_NAMES,
  EXIT,
  isKnownName,
  STRUCTURAL,
  suggestName,
} from './registry'
import type { DirectiveLine } from './syntax'
import type { Diagnostic, DiagnosticNote, Span } from './types'

export interface Location {
  // 1-based
  line: number
  // 1-based, in UTF-16 code units, as tsc and ESLint count them
  column: number
}

// Line and column of `offset` in the normalized source
export function locate(src: string, offset: number): Location {
  let line = 1
  let lineStart = 0
  for (let i = src.indexOf('\n'); i !== -1 && i < offset; ) {
    line++
    lineStart = i + 1
    i = src.indexOf('\n', lineStart)
  }
  return { line, column: offset - lineStart + 1 }
}

const excerpt = (src: string, span: Span): string[] => {
  const { line, column } = locate(src, span.start)
  const lineStart = span.start - column + 1
  const newline = src.indexOf('\n', lineStart)
  const text = src.slice(lineStart, newline === -1 ? src.length : newline)
  const gutter = String(line)
  const width = Math.max(
    1,
    Math.min(span.end, lineStart + text.length) - span.start
  )
  return [
    `  ${gutter} | ${text}`,
    `  ${' '.repeat(gutter.length)} | ${' '.repeat(column - 1)}${'^'.repeat(width)}`,
  ]
}

// TASK-161's reporter: `file:line:col - severity code: message`, the source
// line with the span underlined, then each note the same way
export function formatDiagnostic(src: string, diagnostic: Diagnostic): string {
  const { line, column } = locate(src, diagnostic.span.start)
  const out = [
    `${diagnostic.file}:${line}:${column} - ${diagnostic.severity} ${diagnostic.code}: ${diagnostic.message}`,
    ...excerpt(src, diagnostic.span),
  ]
  for (const note of diagnostic.notes ?? []) {
    if (note.span && (note.file ?? diagnostic.file) === diagnostic.file) {
      const at = locate(src, note.span.start)
      out.push(
        `  note: ${diagnostic.file}:${at.line}:${at.column}: ${note.message}`
      )
      out.push(...excerpt(src, note.span))
    } else {
      out.push(`  note: ${note.message}`)
    }
  }
  return out.join('\n')
}

const code = (s: string): string => `\`${s}\``

// `chapter:a`, as messages name a directive
export const label = (line: DirectiveLine): string =>
  line.id ? `${line.name}:${line.id}` : line.name

const ID_RE = /^[A-Za-z0-9_-]+$/

// How the line reached the parse, which decides what an unknown name means
export type LineSource = 'text' | 'directive'

// The diagnostics one line raises on its own, before nesting is considered:
// for its name, its id and its attributes. Only `exit`, the structural
// blocks and unknown names are checked here; the directives still parsed by
// their own plugins are checked when they are ported (TASK-175).
export function checkLine(
  src: string,
  line: DirectiveLine,
  file: string,
  source: LineSource
): Diagnostic[] {
  const out: Diagnostic[] = []
  const add = (
    diagnosticCode: Diagnostic['code'],
    severity: Diagnostic['severity'],
    span: Span,
    message: string,
    notes?: DiagnosticNote[]
  ) =>
    out.push({
      code: diagnosticCode,
      severity,
      message,
      file,
      span,
      ...(notes ? { notes } : {}),
    })

  const { name } = line

  if (!isKnownName(name)) {
    const suggestion = suggestName(name)
    add(
      'unknown-name',
      'warning',
      line.nameSpan,
      `Unknown directive ${code(name)}.${suggestion ? ` Did you mean ${code(suggestion)}?` : ''}`,
      source === 'text'
        ? [{ message: 'The line is rendered as text' }]
        : undefined
    )
    return out
  }

  if (name === EXIT) {
    if (!line.id) {
      add(
        'exit-missing-id',
        'error',
        line.nameSpan,
        `${code(EXIT)} needs the id of the block it closes`
      )
    }
    if (line.trailing) {
      add(
        'exit-trailing-text',
        'warning',
        line.trailing,
        `The text ${code(src.slice(line.trailing.start, line.trailing.end))} after ${code(label(line))} is ignored`
      )
    }
    return out
  }

  if (!STRUCTURAL.has(name)) return out

  if (DEPRECATED_NAMES.has(name)) {
    add(
      'deprecated-name',
      'warning',
      line.nameSpan,
      `${code(name)} is deprecated and is rendered as ${code('chapter')}`
    )
  } else if (DRAFT_NAMES.has(name)) {
    add(
      'draft-name',
      'warning',
      line.nameSpan,
      `${code(name)} is a draft EPUB structural semantic and is rendered as ${code('chapter')}`
    )
  }

  if (!line.id) {
    add(
      'missing-id',
      'error',
      {
        start: line.nameSpan.start,
        end: line.nameSpan.end + (line.colon ? 1 : 0),
      },
      `${code(name)} needs an id: write ${code(`${name}:<id>`)}`
    )
  } else if (!ID_RE.test(line.id) && line.idSpan) {
    add(
      'id-characters',
      'error',
      line.idSpan,
      `The id ${code(line.id)} may only contain letters, digits, ${code('_')} and ${code('-')}`
    )
  }

  // Attribute issues and attributes, in the order they appear on the line
  const items = [
    ...line.issues.map((issue) => ({ at: issue.span.start, issue })),
    ...line.attributes.map((attribute) => ({
      at: attribute.span.start,
      attribute,
    })),
  ].sort((a, b) => a.at - b.at)

  const seen = new Map<string, Span>()
  for (const item of items) {
    if ('issue' in item) {
      const { issue } = item
      if (issue.kind === 'missing-value') {
        add(
          'missing-value',
          'warning',
          issue.span,
          `${code(issue.key)} has no value; write ${code(`${issue.key}:""`)}`
        )
      } else if (issue.kind === 'unterminated-quote') {
        add(
          'unterminated-quote',
          'warning',
          issue.span,
          `The value of ${code(issue.key)} opens a quote that is not closed on this line`
        )
      } else if (issue.kind === 'stray-word') {
        add(
          'stray-word',
          'warning',
          issue.span,
          `${code(issue.word)} is not an attribute; attributes are written ${code('key:value')}`
        )
      } else {
        add(
          'attribute-form',
          'warning',
          issue.span,
          `${code(`${issue.key} "…"`)} is ignored; write ${code(`${issue.key}:"…"`)}`
        )
      }
      continue
    }

    const { attribute } = item
    if (!BLOCK_ATTRIBUTES.has(attribute.key)) {
      add(
        'unknown-attribute',
        'warning',
        attribute.span,
        `${code(name)} has no attribute ${code(attribute.key)}; it is ignored`
      )
      continue
    }
    const first = seen.get(attribute.key)
    if (first) {
      add(
        'duplicate-attribute',
        'warning',
        attribute.span,
        `${code(attribute.key)} is given twice; the last value is used`,
        [{ message: 'First given here', span: first }]
      )
    } else {
      seen.set(attribute.key, attribute.span)
    }
  }

  return out
}
