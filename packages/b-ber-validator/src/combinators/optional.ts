import { success } from '../lib/success'
import type { Context, Parser } from '../types'
import { oneOf } from './oneOf'

// Match a parser, or succeed with null
export function optional<T>(parser: Parser<T>): Parser<T | null> {
  return oneOf<T | null>([parser, (ctx: Context) => success(ctx, null)])
}
