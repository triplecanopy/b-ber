import { failure } from '../lib/failure'
import { success } from '../lib/success'
import type { Context, Parser } from '../types'

export const close =
  (parser: Parser<unknown[]>, matchIndex: number): Parser<unknown[]> =>
  (ctx: Context) => {
    const res = parser(ctx)
    if (!res.success) return res

    const { ctx: nextCtx, value } = res

    // The value at `matchIndex` is the opening identifier, which a `regex` or
    // `string` parser matched
    const openingIdent = value[matchIndex] as string
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
