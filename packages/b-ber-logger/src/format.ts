import util from 'node:util'
import chalk from 'chalk'
import { type DoneEvent, LEVEL, type ReporterSource } from './types'

export type Style =
  | 'blueBright'
  | 'bold'
  | 'cyan'
  | 'dim'
  | 'gray'
  | 'green'
  | 'red'
  | 'yellow'

// One lowercase label per kind of line, as npm (from 10.6), bun and cargo
// print them. Padded to one width so the messages line up, and told apart by
// the word itself, without colour
export type Label = 'error' | 'warn' | 'info'
const LABELS: Record<Label, [string, ...Style[]]> = {
  error: ['error', 'red', 'bold'],
  warn: ['warn', 'yellow'],
  info: ['info', 'cyan'],
}
const LABEL_WIDTH = Math.max(
  ...Object.values(LABELS).map(([text]) => text.length)
)

// Continuation lines of a multi-line message start under its first line's
// text: the label and the space after it
const CONTINUATION_INDENT = ' '.repeat(LABEL_WIDTH + 1)

// Formats a byte count for the `{N}` placeholder: 1024 → "1.02 Kb"
export function floatFormat(value: unknown): string {
  const n = Number(value)
  const units = ['B', 'Kb', 'Mb', 'Gb']
  // The number of digits picks the unit: up to 3 is bytes, 4–6 Kb, and so on
  const digits = String(Math.trunc(Math.abs(n))).length
  const unit = Math.min(Math.floor((digits - 1) / 3), units.length - 1)
  return `${(n / 10 ** (unit * 3)).toFixed(2)} ${units[unit]}`
}

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND

// A build's duration as a person reads it: 840ms, 4.2s, 1m 12s
export function formatDuration(ms: number): string {
  if (ms < MS_PER_SECOND) return `${Math.round(ms)}ms`
  if (ms < MS_PER_MINUTE) return `${(ms / MS_PER_SECOND).toFixed(1)}s`
  const minutes = Math.floor(ms / MS_PER_MINUTE)
  const seconds = Math.round((ms % MS_PER_MINUTE) / MS_PER_SECOND)
  return `${minutes}m ${seconds}s`
}

// util.format, then the two placeholders b-ber's messages use: `{N}` is a
// byte count, `[text]` is highlighted. Without colour the brackets stay, so
// that the highlighted text is still set apart from the message around it.
// Plain text when `decorate` is not given
export function composeMessage(
  args: unknown[],
  decorate?: (value: unknown, ...styles: Style[]) => string
): string {
  return util
    .format(...args)
    .trim()
    .split('\n')
    .map((a) => a.trim())
    .join(`\n${CONTINUATION_INDENT}`)
    .replace(/\{(\d+)\}/g, (_, d: string) =>
      decorate ? decorate(floatFormat(d), 'blueBright') : floatFormat(d)
    )
    .replace(/\[([^\]]+)\]/g, (match, s: string) =>
      decorate ? decorate(s, 'blueBright') : match
    )
}

// The logger's line format and colour, shared by the reporters. Reads the
// logger's options each time, so that `log.configure` applies at once
export class Formatter {
  constructor(private source: ReporterSource) {}

  // Whether styles produce colour: not with `--no-color`, and not when chalk
  // finds that stdout cannot show it (a pipe, a CI log)
  get colorEnabled(): boolean {
    return !this.source.boringOutput && chalk.level > 0
  }

  decorate = (value: unknown, ...styles: Style[]): string => {
    let text = util.format(value)
    if (!this.colorEnabled) return text

    for (let i = styles.length - 1; i >= 0; i--) {
      text = chalk[styles[i]](text)
    }
    return text
  }

  compose(args: unknown[]): string {
    return composeMessage(args, this.colorEnabled ? this.decorate : undefined)
  }

  // `[timestamp] label message`, the timestamp from LEVEL.info up
  line(label: Label, message: string): string {
    const [text, ...styles] = LABELS[label]
    let prefix = ''

    if (this.source.logLevel >= LEVEL.info) {
      prefix += `${this.decorate(`[${new Date().toISOString()}]`, 'gray')} `
    }

    // Padded outside the colour, so a background never shows the padding
    prefix +=
      this.decorate(text, ...styles) + ' '.repeat(LABEL_WIDTH - text.length)

    return `${prefix} ${message}`
  }

  // The frames of a stack trace, without the line that has its message
  stackFrames(stack: string | undefined): string | undefined {
    const frames = stack?.indexOf('\n    at ') ?? -1
    return stack && frames > -1 ? stack.slice(frames + 1) : undefined
  }

  inspect(value: unknown): string {
    return util.inspect(value, {
      showHidden: true,
      depth: null,
      colors: this.colorEnabled,
    })
  }

  // The lines `--summary` prints after a successful build
  summary(data: DoneEvent): string[] {
    const state = data.state as SummaryState
    const lines: string[] = []
    const add = (text: string, depth = 0) =>
      lines.push(this.line('info', `${'  '.repeat(depth)}${text}`))
    const heading = (text: string) => {
      lines.push('')
      add(this.decorate(text, 'blueBright'))
    }

    heading('Stats')
    add(`Build Start: ${data.formattedStartDate}`)
    add(`Build End: ${data.formattedEndDate}`)
    add(`Elapsed: ${data.sequenceEnd}`)

    heading('Configuration')
    const config = (value: unknown, depth = 0) => {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === 'string') add(`${k}: ${v}`, depth)
        if (isPlainObject(v)) {
          add(k, depth)
          config(v, depth + 1)
        }
      }
    }
    config(state.config)

    heading('Metadata')
    for (const v of Object.values(
      state.metadata.json() as Record<string, unknown>
    )) {
      if (isPlainObject(v)) add(`${v.term}: ${v.value}`)
    }

    heading('Navigation')
    const navigation = (entries: NavigationEntry[], depth = 0) => {
      for (const item of entries) {
        add(`${item.title || '[no title]'}: ${item.name}`, depth)
        if (item.nodes?.length) navigation(item.nodes, depth + 1)
      }
    }
    navigation(state.toc)

    return lines
  }
}

// The parts of b-ber-lib's State the summary reads. Structural, because
// b-ber-lib depends on this package and cannot be imported here
interface NavigationEntry {
  title?: string
  name?: string
  nodes?: NavigationEntry[]
}

interface SummaryState {
  config: unknown
  metadata: { json(): unknown }
  toc: NavigationEntry[]
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' &&
  v !== null &&
  Object.getPrototypeOf(v) === Object.prototype
