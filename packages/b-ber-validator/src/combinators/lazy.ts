import { Context, Parser } from 'b-ber-validator'

export function lazy(parserFn: () => Parser<any>) {
  return (ctx: Context) => parserFn()(ctx)
}
