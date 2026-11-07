import { failure } from '../lib/failure'
import { success } from '../lib/success'
import type { Context, Parser } from '../types'

export function string(match: string, expected = ''): Parser<string> {
  return (ctx: Context) => {
    const endIdx = ctx.index + match.length

    if (ctx.text.substring(ctx.index, endIdx) === match) {
      return success({ ...ctx, index: endIdx }, match)
    }

    return failure(ctx, expected || match)
  }
}
