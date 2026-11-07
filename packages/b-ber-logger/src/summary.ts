import util from 'util'
import type { Logger } from './logger'

const INDENTATION = '  '

// The parts of b-ber-lib's State the summary reads. Structural, because
// b-ber-lib depends on this package and cannot be imported here
interface NavigationEntry {
  title?: string
  name?: string
  nodes?: NavigationEntry[]
}

export interface SummaryState {
  config: unknown
  metadata: { json(): unknown }
  toc: NavigationEntry[]
}

// What Timer#done emits on `done`, and the listener hands to printSummary
export interface SummaryData {
  state: SummaryState
  formattedStartDate: string
  formattedEndDate: string
  sequenceEnd: string
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === 'object' &&
    v !== null &&
    Object.getPrototypeOf(v) === Object.prototype
  )
}

function write(this: Logger, msgs: [string, string?][], context: Logger): void {
  const len = msgs.length - 1
  const esses = ' %s'.repeat(len)
  const msgs_ = msgs.map(([text, color]) =>
    color ? context.decorate(text, color) : context.decorate(text)
  )

  const message = util.format.call(
    util,
    `%s%s %s${esses}`,
    context.indent(),
    context.decorate('b-ber', 'whiteBright', 'bgBlack'),
    ...msgs_
  )
  process.stdout.write(message)
  context.newLine()
}

function printNavigation(
  data: NavigationEntry[],
  context: Logger,
  indent = 0
): void {
  const indent_ = INDENTATION.repeat(indent)
  function render(_data: NavigationEntry[], _context: Logger): void {
    _data.forEach((item) => {
      write.call(
        _context,
        [[`${indent_}${item.title || '[no title]'}: ${item.name}`]],
        _context
      )
      if (item.nodes && item.nodes.length) {
        render(item.nodes, _context)
      }
    })
  }
  render(data, context)
}

function writeMetadata(data: unknown, context: Logger): void {
  Object.entries(data as Record<string, unknown>).forEach(([, v]) => {
    if (isPlainObject(v)) {
      write.call(context, [[`${v.term}: ${v.value}`]], context)
    }
  })
}

function writeConfig(data: unknown, context: Logger, indent = 0): void {
  const indent_ = INDENTATION.repeat(indent)
  Object.entries(data as Record<string, unknown>).forEach(([k, v]) => {
    if (typeof v === 'string') {
      write.call(context, [[`${indent_}${k}: ${v}`]], context)
    }
    if (isPlainObject(v)) {
      write.call(context, [[`${indent_}${k}`]], context)
      writeConfig(v, context, indent + 1)
    }
  })
}

export function printSummary(
  this: Logger,
  { state, formattedStartDate, formattedEndDate, sequenceEnd }: SummaryData
): void {
  this.newLine()
  write.call(this, [['Stats', 'blueBright']], this)
  write.call(this, [['Build Start:'], [formattedStartDate]], this)
  write.call(this, [['Build End:'], [formattedEndDate]], this)
  write.call(this, [['Elapsed:'], [sequenceEnd]], this)

  this.newLine()
  write.call(this, [['Configuration', 'blueBright']], this)
  writeConfig(state.config, this)

  this.newLine()
  write.call(this, [['Metadata', 'blueBright']], this)
  writeMetadata(state.metadata.json(), this)

  this.newLine()
  write.call(this, [['Navigation', 'blueBright']], this)
  printNavigation(state.toc, this)
}
