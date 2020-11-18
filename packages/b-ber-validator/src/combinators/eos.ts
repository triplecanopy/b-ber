import { Context } from 'b-ber-validator'
import { failure } from '../lib/failure'
import { success } from '../lib/success'

class EOS {}

export function eos() {
  return (ctx: Context) =>
    ctx.index === ctx.text.length
      ? success(ctx, new EOS())
      : failure(ctx, 'End of string')
}
