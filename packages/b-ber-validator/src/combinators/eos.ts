import { failure } from '../lib/failure'
import { success } from '../lib/success'
import type { Context } from '../types'

class EOS {}

export function eos() {
  return (ctx: Context) =>
    ctx.index === ctx.text.length
      ? success(ctx, new EOS())
      : failure(ctx, 'End of string')
}
