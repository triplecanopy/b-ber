import { failure } from '../lib/failure'
import { success } from '../lib/success'
import type { Context } from '../types'

// Match a regexp or fail

export function regex(re: RegExp, expected: string) {
  return (ctx: Context) => {
    re.lastIndex = ctx.index
    const res = re.exec(ctx.text)
    if (res && res.index === ctx.index) {
      return success({ ...ctx, index: ctx.index + res[0].length }, res[0])
    }

    return failure(ctx, expected)
  }
}
