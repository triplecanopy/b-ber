/* eslint-disable import/prefer-default-export */

// same as info but always prints to log, i.e., log-level doesn't need to be set.
export function notice(...args) {
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
