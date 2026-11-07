import type { Context, Success } from '../types'

export function success<T>(ctx: Context, value: T): Success<T> {
  return { success: true, value, ctx }
}
