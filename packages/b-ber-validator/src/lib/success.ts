import type { Context, Success } from '../types'

export function success(ctx: Context, value: any): Success<any> {
  return { success: true, value, ctx }
}
