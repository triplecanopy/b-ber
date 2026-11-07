import { success } from '../lib/success'
import type { Context, Parser } from '../types'

// Succeeds with null once `parser` matches, or with an empty array at the end
// of the input
export function not(parser: Parser<unknown>): Parser<unknown[] | null> {
  return (ctx: Context) => {
    const values: unknown[] = []
    const nextCtx = { ...ctx }

    while (nextCtx.index < nextCtx.text.length) {
      const res = parser(nextCtx)

      if (res.success) return success(nextCtx, null)

      nextCtx.index += 1
    }

    return success(nextCtx, values)
  }
}
