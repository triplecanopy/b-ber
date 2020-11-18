import { Context, Parser } from 'b-ber-validator'
import { success } from '../lib/success'
import { noneOrMany } from './noneOrMany'

// Match a parser, or succeed with null
export function optional(parser: Parser<any>) {
  return noneOrMany([parser, (ctx: Context) => success(ctx, null)])
}
