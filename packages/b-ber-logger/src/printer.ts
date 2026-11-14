import util from 'node:util'
import type { Logger } from './logger'

function printNotices(
  this: Logger,
  type: 'warnings' | 'errors',
  task = 'b-ber'
): void {
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

export function printWarnings(this: Logger, task?: string): void {
  printNotices.call(this, 'warnings', task)
}

export function printErrors(this: Logger, task?: string): void {
  printNotices.call(this, 'errors', task)
}
