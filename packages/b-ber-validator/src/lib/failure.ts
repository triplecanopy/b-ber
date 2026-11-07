import type { Context, Failure } from '../types'

export function failure(
  ctx: Context,
  expected: string,
  fatal = false
): Failure {
  return { success: false, expected, ctx, fatal }
}
