import util from 'util'

export function composeMessage(this: any, args: unknown[]): string {
  const message = util.format
    .call(util, ...args)
    .split('\n')
    .map((a: string) => a.trim())
    .join(`\n${' '.repeat(6)}`)
    .replace(/\{(\d+)\}/g, (_: string, d: string) =>
      this.decorate(String(this.floatFormat(d)), 'blueBright')
    )
    .replace(/\[([^\]]+)\]/g, (_: string, s: string) =>
      this.decorate(s, 'blueBright')
    )

  return message
}
