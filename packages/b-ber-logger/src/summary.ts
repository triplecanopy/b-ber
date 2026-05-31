import util from 'util'

const INDENTATION = '  '

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && Object.getPrototypeOf(v) === Object.prototype
}

function write(this: any, msgs: [string, string?][], context: any): void {
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

function printNavigation(data: unknown[], context: any, indent = 0): void {
  const indent_ = INDENTATION.repeat(indent)
  function render(_data: unknown[], _context: any): void {
    _data.forEach((item: any) => {
      write.call(_context, [[`${indent_}${item.title || '[no title]'}: ${item.name}`]], _context)
      if (item.nodes && item.nodes.length) {
        render(item.nodes, _context)
      }
    })
  }
  render(data, context)
}

function writeMetadata(data: unknown, context: any): void {
  Object.entries(data as Record<string, unknown>).forEach(([, v]) => {
    if (isPlainObject(v)) {
      write.call(context, [[`${(v as any).term}: ${(v as any).value}`]], context)
    }
  })
}

function writeConfig(data: unknown, context: any, indent = 0): void {
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
  this: any,
  {
    state,
    formattedStartDate,
    formattedEndDate,
    sequenceEnd,
  }: {
    state: any
    formattedStartDate: string
    formattedEndDate: string
    sequenceEnd: string
  }
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
