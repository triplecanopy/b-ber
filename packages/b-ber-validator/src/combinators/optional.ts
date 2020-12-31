import { Context, Parser } from 'b-ber-validator'
import { success } from '../lib/success'
import { oneOf } from './oneOf'

// Match a parser, or succeed with null
export function optional(parser: Parser<any>) {
  return oneOf([parser, (ctx: Context) => success(ctx, null)])
}
