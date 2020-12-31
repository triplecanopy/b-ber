import { Context, Parser, Success } from 'b-ber-validator'
import { failure } from '../lib/failure'
import { success } from '../lib/success'

export const close = (parser: Parser<any>, matchIndex: number) => (
  ctx: Context
) => {
  const res = parser(ctx)
  if (!res.success) return res

  const { ctx: nextCtx, value } = res as Success<any>
  const match = value[matchIndex]
  const nextValue = value.concat(match)
  const endIdx = nextCtx.index + match.length
  const closingIdent = nextCtx.text.substring(nextCtx.index, endIdx)

  if (closingIdent === match) {
    return success({ ...ctx, index: endIdx }, nextValue)
  }

  return failure(
    { ...ctx, index: endIdx },
    `Closing ident ${closingIdent.trim()} to match opening ident ${match.trim()}`,
    true
  )
}
