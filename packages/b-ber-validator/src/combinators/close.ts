import { Context, Parser, Success } from 'b-ber-validator'
import { failure } from '../lib/failure'
import { success } from '../lib/success'

export const close = (parser: Parser<any>, matchIndex: number) => (
  ctx: Context
) => {
  const res = parser(ctx)
  if (!res.success) return res

  const { ctx: nextCtx, value } = res as Success<any>

  const openingIdent = value[matchIndex]
  const nextValue = value.concat(openingIdent)
  const endIdx = nextCtx.index + openingIdent.length

  const openingRe = new RegExp(`${openingIdent}(?![^\\s])`, 'g') // Allow dangling whitespace
  openingRe.lastIndex = nextCtx.index

  const closingMatch = openingRe.exec(nextCtx.text)

  if (closingMatch?.index === nextCtx.index) {
    return success({ ...ctx, index: endIdx }, nextValue)
  }

  return failure(
    { ...ctx, index: endIdx },
    `Closing identifier to match opening identifier ${openingIdent.trim()}`,
    true
  )
}
