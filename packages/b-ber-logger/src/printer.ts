import util from 'util'

function printNotices(this: any, type: 'warnings' | 'errors', task = 'b-ber'): void {
  const notices: unknown[] = this[type]
  const leader = type === 'warnings' ? 'WARN' : 'ERR!'
  const color = type === 'warnings' ? 'bgYellowBright' : 'bgRed'

  const message = util.format.call(
    util,
    '%s%s %s task %s - %s %s',
    this.indent(),
    this.decorate('b-ber', 'whiteBright', 'bgBlack'),
    this.decorate(leader, color),
    this.decorate(task),
    this.decorate(notices.length),
    this.decorate(type)
  )

  if (this.logLevel > 2) process.stdout.write(message)
}

export function printWarnings(this: any, task?: string): void {
  printNotices.call(this, 'warnings', task)
}

export function printErrors(this: any, task?: string): void {
  printNotices.call(this, 'errors', task)
}
