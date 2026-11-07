import type { Context, Parser } from '../types'

// Value *must* match first parser, and can match second
export const constrained = <T>(
  parser1: Parser<unknown>,
  parser2: Parser<T>,
  expected = 'Valid constraint'
): Parser<T> => {
  return (ctx: Context) => {
    const res1 = parser1(ctx)
    const res2 = parser2(ctx)

    // Fails fatally if first condition is not met
    if (!res1.success) {
      return { ...res1, expected, fatal: true }
    }

    // Allowed to fail normally afterwards
    return res2
  }
}
