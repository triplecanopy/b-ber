import util from 'util'

export function error(this: any, _args: unknown): void {
  const args: unknown[] = Array.isArray(_args) ? _args : [_args]

  if (this.logLevel < 1) return
  const errCode = 1

  let message: string
  let stack: string | undefined
  let err: unknown
  let formatted: string

  while ((err = args.shift())) {
    if (err instanceof Error) {
      message = this.composeMessage([err.message])
      stack = err.stack
    } else {
      message = this.composeMessage([err])
      stack = new Error().stack
    }

    let prefix = ''
    prefix += this.decorate('b-ber', 'whiteBright', 'bgBlack')
    prefix += ' '
    prefix += this.decorate('ERR!', 'whiteBright', 'bgRed')

    formatted = util.format.apply(util, ['%s %s', prefix, message])

    this.taskErrors += 1
    this.errors.push({ stack, message, formatted })
  }

  this.errors.forEach((processedErr: { formatted: string; stack?: string }) => {
    process.stdout.write(processedErr.formatted)
    this.newLine()

    if (this.logLevel > 3) {
      process.stdout.write(util.format.call(util, processedErr.stack))
      this.newLine()
    }
  })

  process.stdout.write(
    this.decorate(`b-ber exited with code ${errCode}`, 'whiteBright', 'bgRed')
  )
  this.newLine()
  process.exit(errCode)
}
