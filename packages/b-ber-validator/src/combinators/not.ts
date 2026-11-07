import { success } from '../lib/success'
import type { Context, Parser } from '../types'

export function not(parser: Parser<any>) {
  return (ctx: Context) => {
    const values: any[] = []
    const nextCtx = { ...ctx }

    while (nextCtx.index < nextCtx.text.length) {
      const res = parser(nextCtx)

      if (res.success) return success(nextCtx, null)

      nextCtx.index += 1
    }

    return success(nextCtx, values)
  }
}
