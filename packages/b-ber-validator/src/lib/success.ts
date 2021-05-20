import { Context } from 'b-ber-validator'

export function success(ctx: Context, value: any) {
  return { success: true, value, ctx }
}
