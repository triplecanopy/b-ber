import util from 'util'

export function printVersion(this: any, version: string): void {
  const message = util.format.call(
    util,
    '%s%s %s %s',
    this.indent(),
    this.decorate('b-ber', 'whiteBright', 'bgBlack'),
    this.decorate('version'),
    this.decorate(version, 'blueBright')
  )

  process.stdout.write(message)
  this.newLine()
}
