import { success } from '../lib/success'
import type { Context, Parser } from '../types'

// Convenience method that will map a Success to callback, to let us do
// common things like build AST nodes from input strings.

export function map<T, U>(parser: Parser<T>, fn: (value: T) => U): Parser<U> {
  return (ctx: Context) => {
    const res = parser(ctx)
    return res.success ? success(res.ctx, fn(res.value)) : res
  }
}
