import { Context, Failure, Parser, Success } from 'b-ber-validator'
import { success } from '../lib/success'

// Look for 0 or more of something, until we can't parse any more.
// Note that this function never fails, it will instead succeed
// with an empty array.

export function many(parser: Parser<any>) {
  return (ctx: Context) => {
    const values = []
    let nextCtx = ctx
    while (true) {
      const res = parser(nextCtx)
      if (!res.success) {
        if ((res as Failure).fatal) return res

        break
      }

      values.push((res as Success<any>).value)
      nextCtx = res.ctx
    }

    return success(nextCtx, values)
  }
}
