import { success } from '../lib/success'
import type { Context, Parser } from '../types'

// Look for 0 or more of something, until we can't parse any more.
// Note that this function never fails, it will instead succeed
// with an empty array.

export function many<T>(parser: Parser<T>): Parser<T[]> {
  return (ctx: Context) => {
    const values: T[] = []
    let nextCtx = ctx
    while (true) {
      const res = parser(nextCtx)
      if (!res.success) {
        if (res.fatal) return res

        break
      }

      values.push(res.value)
      nextCtx = res.ctx
    }

    return success(nextCtx, values)
  }
}
