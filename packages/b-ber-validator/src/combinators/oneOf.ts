import type { Context, Parser, Result } from '../types'

// Try each matcher in order, starting from the same point in the input.
// Return the first one that succeeds, or return the failure that got furthest
// in the input string. which failure to return is a matter of taste, we
// prefer the furthest failure because. it tends be the most useful/complete
// error message.

// Returns fatal error!

export function oneOf<T>(parsers: Parser<T>[]): Parser<T> {
  return (ctx: Context) => {
    let furthestRes = {} as Result<T>

    for (const parser of parsers) {
      const res = parser(ctx)

      if (res.success) return res
      if (res.fatal) return res

      if (!furthestRes?.ctx || furthestRes.ctx.index > res.ctx.index) {
        furthestRes = res
      }
    }

    return furthestRes
  }
}
