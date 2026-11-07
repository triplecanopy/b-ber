import { failure } from '../lib/failure'
import { success } from '../lib/success'
import type { Context, Parser } from '../types'

class EOS {}

export function eos(): Parser<EOS> {
  return (ctx: Context) =>
    ctx.index === ctx.text.length
      ? success(ctx, new EOS())
      : failure(ctx, 'End of string')
}
