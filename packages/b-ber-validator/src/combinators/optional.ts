import { success } from '../lib/success'
import type { Context, Parser } from '../types'
import { oneOf } from './oneOf'

// Match a parser, or succeed with null
export function optional(parser: Parser<any>) {
  return oneOf([parser, (ctx: Context) => success(ctx, null)])
}
