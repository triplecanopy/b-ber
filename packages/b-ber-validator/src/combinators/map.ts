import { success } from '../lib/success'
import type { Context, Parser, Success } from '../types'

// Convenience method that will map a Success to callback, to let us do
// common things like build AST nodes from input strings.

export function map(parser: Parser<any>, fn: (value: any) => any) {
  return (ctx: Context) => {
    const res = parser(ctx)
    return res.success ? success(res.ctx, fn((res as Success<any>).value)) : res
  }
}
