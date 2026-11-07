import type { Logger } from './logger'

export function notice(this: Logger, ...args: unknown[]): void {
  const message = this.decorate(this.composeMessage(args))

  let prefix = ''

  if (this.logLevel > 2) {
    prefix += this.decorate(`[${new Date().toISOString()}]`, 'gray')
    prefix += ' '
  }

  prefix += this.decorate('b-ber', 'whiteBright', 'bgBlack')
  prefix += ' '
  prefix += this.decorate('info', 'green')
  prefix += ' '

  process.stdout.write(`${prefix}${message}`)
  this.newLine()
}
