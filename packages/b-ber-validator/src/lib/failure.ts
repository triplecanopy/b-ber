import { Context } from 'b-ber-validator'

export function failure(ctx: Context, expected: string, fatal = false) {
  return { success: false, expected, ctx, fatal }
}
