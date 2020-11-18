import { Context, Parser, Result } from 'b-ber-validator'

// Does not return fatal error

export function noneOrMany(parsers: Parser<any>[]) {
  return (ctx: Context) => {
    let furthestRes = {} as Result<any>
    for (const parser of parsers) {
      const res = parser(ctx)
      if (res.success) return res
      if (!furthestRes?.ctx || furthestRes.ctx.index > res.ctx.index) {
        furthestRes = res
      }
    }
    return furthestRes
  }
}
