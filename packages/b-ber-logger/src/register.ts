export function registerSequence(
  this: any,
  _state: unknown,
  _command: string,
  sequence: string[]
): void {
  if (this.logLevel < 1) return

  const message = this.decorate(
    this.composeMessage([
      'Preparing to run',
      sequence.length,
      `task${sequence.length > 1 ? 's' : ''}`,
    ])
  )

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
