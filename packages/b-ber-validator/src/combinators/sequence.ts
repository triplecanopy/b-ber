import { Context, Parser, Success } from 'b-ber-validator'
import { success } from '../lib/success'

// Look for an exact sequence of parsers, or fail

export function sequence(parsers: Parser<any>[]) {
  return (ctx: Context) => {
    const values = []
    let nextCtx = ctx
    for (const parser of parsers) {
      const res = parser(nextCtx)
      if (!res.success) return res
      values.push((res as Success<any>).value)
      nextCtx = res.ctx
    }
    return success(nextCtx, values)
  }
}
