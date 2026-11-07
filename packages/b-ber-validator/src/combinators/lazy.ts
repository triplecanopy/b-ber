import type { Context, Parser } from '../types'

export function lazy(parserFn: () => Parser<any>) {
  return (ctx: Context) => parserFn()(ctx)
}
