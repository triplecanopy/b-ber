import {
  type Diagnostic,
  locate,
  type Span,
} from '@canopycanopycanopy/b-ber-markdown-renderer/parse'
import { paint, type Style } from './colors'

export interface ReportOptions {
  // ANSI colour. Off by default, so that the text is the same in a pipe, a
  // test or an editor
  color?: boolean
}

// Spans are offsets into the source as markdown-it normalizes it, which turns
// every `\r\n` and `\r` into `\n`
const normalize = (source: string): string => source.replace(/\r\n?/g, '\n')

// The span's first line, and the span underlined beneath it. A span that runs
// past the end of its line is underlined to the end of the line
const excerpt = (
  src: string,
  span: Span,
  style: (text: string, ...styles: Style[]) => string,
  caret: Style
): string[] => {
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
    `  ${style(`${gutter} |`, 'dim')} ${text}`,
    `  ${style(`${' '.repeat(gutter.length)} |`, 'dim')} ${' '.repeat(column - 1)}${style('^'.repeat(width), caret)}`,
  ]
}

const SEVERITY: Record<Diagnostic['severity'], Style> = {
  error: 'red',
  warning: 'yellow',
}

// One diagnostic as TASK-161 specifies it: `file:line:col - severity code:
// message`, the source line with the span underlined, then each note the same
// way. A note in another file is given by its message alone, since only this
// file's source is at hand. Line and column are 1-based, the column in UTF-16
// code units, as tsc and ESLint count them
export function report(
  source: string,
  diagnostic: Diagnostic,
  { color = false }: ReportOptions = {}
): string {
  const style = color
    ? paint
    : (text: string, ..._styles: Style[]): string => text
  const src = normalize(source)
  const severity = SEVERITY[diagnostic.severity]
  const { line, column } = locate(src, diagnostic.span.start)
  const out = [
    `${style(`${diagnostic.file}:${line}:${column}`, 'cyan')} - ${style(diagnostic.severity, severity, 'bold')} ${style(diagnostic.code, 'dim')}: ${diagnostic.message}`,
    ...excerpt(src, diagnostic.span, style, severity),
  ]
  for (const note of diagnostic.notes ?? []) {
    if (note.span && (note.file ?? diagnostic.file) === diagnostic.file) {
      const at = locate(src, note.span.start)
      out.push(
        `  ${style('note', 'bold')}: ${style(`${diagnostic.file}:${at.line}:${at.column}`, 'cyan')}: ${note.message}`,
        ...excerpt(src, note.span, style, 'cyan')
      )
    } else {
      out.push(`  ${style('note', 'bold')}: ${note.message}`)
    }
  }
  return out.join('\n')
}
