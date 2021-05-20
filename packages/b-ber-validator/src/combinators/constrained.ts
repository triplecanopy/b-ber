import { Context, Parser } from 'b-ber-validator'

// Value *must* match first parser, and can match second
export const constrained = (
  parser1: Parser<any>,
  parser2: Parser<any>,
  expected = 'Valid constraint'
) => {
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
