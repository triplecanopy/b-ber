import { failure } from '../lib/failure'
import { success } from '../lib/success'
import type { Context, Parser } from '../types'

// Match a regexp or fail

export function regex(re: RegExp, expected: string): Parser<string> {
  return (ctx: Context) => {
    re.lastIndex = ctx.index
    const res = re.exec(ctx.text)
    if (res && res.index === ctx.index) {
      return success({ ...ctx, index: ctx.index + res[0].length }, res[0])
    }

    return failure(ctx, expected)
  }
}
