import { failure } from '../lib/failure'
import { success } from '../lib/success'
import type { Context } from '../types'

export function string(match: string, expected = '') {
  return (ctx: Context) => {
    const endIdx = ctx.index + match.length

    if (ctx.text.substring(ctx.index, endIdx) === match) {
      return success({ ...ctx, index: endIdx }, match)
    }

    return failure(ctx, expected || match)
  }
}
