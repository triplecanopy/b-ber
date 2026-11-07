import type { Context, Parser } from '../types'

// Returns fatal error to halt parser in case of failure
export const required = <T>(parser: Parser<T>): Parser<T> => {
  return (ctx: Context) => {
    const res = parser(ctx)
    if (!res.success) return { ...res, fatal: true }
    return res
  }
}
