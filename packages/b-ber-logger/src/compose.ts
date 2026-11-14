import util from 'node:util'
import type { Logger } from './logger'

export function composeMessage(this: Logger, args: unknown[]): string {
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
