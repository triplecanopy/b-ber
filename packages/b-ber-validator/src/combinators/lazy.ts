import type { Context, Parser } from '../types'

export function lazy<T>(parserFn: () => Parser<T>): Parser<T> {
  return (ctx: Context) => parserFn()(ctx)
}
