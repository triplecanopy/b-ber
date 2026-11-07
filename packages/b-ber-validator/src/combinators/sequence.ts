import { success } from '../lib/success'
import type { Context, Parser } from '../types'

// Look for an exact sequence of parsers, or fail

// Each parser's value is kept, in order. The combinators that read them back
// (`close`, and `map`'s callbacks) index into the array
export function sequence(parsers: Parser<unknown>[]): Parser<unknown[]> {
  return (ctx: Context) => {
    const values: unknown[] = []
    let nextCtx = ctx
    for (const parser of parsers) {
      const res = parser(nextCtx)
      if (!res.success) return res
      values.push(res.value)
      nextCtx = res.ctx
    }
    return success(nextCtx, values)
  }
}
