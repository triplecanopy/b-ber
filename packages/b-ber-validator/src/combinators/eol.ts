import { failure } from '../lib/failure'
import { success } from '../lib/success'
import type { Context, Parser } from '../types'

// eol function doesn't advance index

class EOL {}

export function eol(): Parser<EOL> {
  return (ctx: Context) => {
    const match = '\n'
    const endIdx = ctx.index + match.length
    if (
      ctx.index === ctx.text.length ||
      ctx.text.substring(ctx.index, endIdx) === match
    ) {
      return success(ctx, new EOL())
    }

    return failure(ctx, 'End of line', true)
  }
}
