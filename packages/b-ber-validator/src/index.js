const util = require('util')

// // every parsing function will have this signature
// type Parser<T> = (ctx: Context) => Result<T>

// // to track progress through our input string.
// // we should make this immutable, because we can.
// type Context = Readonly<{
//   text: string, // the full input string
//   index: number, // our current position in it
// }>

// // our result types
// type Result<T> = Success<T> | Failure

// // on success we'll return a value of type T, and a new Ctx
// // (position in the string) to continue parsing from
// type Success<T> = Readonly<{
//   success: true,
//   value: T,
//   ctx: Ctx,
// }>

// // when we fail we want to know where and why
// type Failure = Readonly<{
//   success: false,
//   expected: string,
//   ctx: Ctx,
// }>

// some convenience methods to build `Result`s for us
function success(ctx, value) {
  return { success: true, value, ctx }
}

function failure(ctx, expected) {
  return { success: false, expected, ctx }
}

function str(match, expected = '') {
  return ctx => {
    const endIdx = ctx.index + match.length
    if (ctx.text.substring(ctx.index, endIdx) === match) {
      return success({ ...ctx, index: endIdx }, match)
    }

    return failure(ctx, expected || match)
  }
}

const close = (parser, matchIndex) => ctx => {
  const res = parser(ctx)
  if (!res.success) return res
  const { ctx: nextCtx, value } = res
  const match = value[matchIndex]
  const nextValue = value.concat(match)
  const endIdx = nextCtx.index + match.length

  if (nextCtx.text.substring(nextCtx.index, endIdx) === match) {
    return success({ ...ctx, index: endIdx }, nextValue)
  }

  return failure(ctx, nextValue)
}

// try each matcher in order, starting from the same point in the input. return the first one that succeeds.
// or return the failure that got furthest in the input string.
// which failure to return is a matter of taste, we prefer the furthest failure because.
// it tends be the most useful / complete error message.
function any(parsers) {
  return ctx => {
    let furthestRes = null
    for (const parser of parsers) {
      const res = parser(ctx)
      if (res.success) return res
      if (!furthestRes || furthestRes.ctx.index < res.ctx.index) {
        furthestRes = res
      }
    }
    return furthestRes
  }
}

// match a parser, or succeed with null
function optional(parser) {
  return any([parser, ctx => success(ctx, null)])
}

// match a regexp or fail
function regex(re, expected) {
  return ctx => {
    re.lastIndex = ctx.index
    const res = re.exec(ctx.text)
    if (res && res.index === ctx.index) {
      return success({ ...ctx, index: ctx.index + res[0].length }, res[0])
    }

    return failure(ctx, expected)
  }
}

// look for 0 or more of something, until we can't parse any more.
//  note that this function never fails, it will instead succeed
// with an empty array.
function many(parser) {
  return ctx => {
    const values = []
    let nextCtx = ctx
    while (true) {
      const res = parser(nextCtx)
      if (!res.success) break
      values.push(res.value)
      nextCtx = res.ctx
    }
    return success(nextCtx, values)
  }
}

// TODO define `values` array
function not(parser) {
  return ctx => {
    const values = []
    const nextCtx = ctx

    while (nextCtx.index < nextCtx.text.length) {
      const res = parser(nextCtx)

      if (res.success) {
        // values.push(res.value)
        // nextCtx = res.ctx
        // console.log(nextCtx.text.slice(nextCtx.index))
        return success(nextCtx, values)
      }

      nextCtx.index += 1 //res.expected.length
    }

    return success(nextCtx, values)
  }
}

// look for an exact sequence of parsers, or fail
function sequence(parsers) {
  return ctx => {
    const values = []
    let nextCtx = ctx
    for (const parser of parsers) {
      const res = parser(nextCtx)
      if (!res.success) return res
      values.push(res.value)
      nextCtx = res.ctx
    }
    return success(nextCtx, values)
  }
}

// a convenience method that will map a Success to callback, to let us do common things like build AST nodes from input strings.
function map(parser, fn) {
  return ctx => {
    const res = parser(ctx)
    return res.success ? success(res.ctx, fn(res.value)) : res
  }
}

// function flatMap(parser, fn) {
//   return ctx => {
//   }
// }

function lazy(parserFn) {
  return ctx => parserFn()(ctx)
}

function EOS() {}
function eos() {
  return ctx =>
    ctx.index === ctx.text.length
      ? success(ctx, new EOS())
      : failure(ctx, 'End of string')
}

// const text = `
// ::: name:idA foo:bar baz:"some text"

// ::: name:idB foo:bar baz:"some text"

// body

// ::: exit:idB

// ::: exit:idA
// `

// const text = `

// ::: name:xxInline foo:bar baz:"some text"

// ::: name:idA foo:bar baz:"some text"

// aaaa

// ::: name:idB foo:bar baz:"some text"

// xx

// ::: exit:idB

// bbbbb

// ::: exit:idA

const text = `

::: name:idA foo:bar baz:"some text"
::: exit:idA

::: name:xxInline foo:bar baz:"some text"

`

const space = str(' ')
const newLine = str('\n')
const carriageReturn = str('\r')
const whiteSpace = any([space, newLine, carriageReturn])
const whiteSpaces = many(whiteSpace)

const fence = str('::: ')
const word = regex(/[a-zA-Z_-]+/g)
const words = many(regex(/[a-zA-Z_-]+\s?/g))
const quote = any([str('"'), str("'")])
const sep = str(':')
const ident = regex(/[a-zA-Z_-]+/g)

const attr = any([
  sequence([space, word, sep, word]),
  close(
    map(sequence([space, word, sep, quote, words]), (...args) => args.flat()),
    3
  ),
])

const attrs = many(attr)
const body = not(fence)
const exit = str('exit')

function block() {
  return close(
    map(
      sequence([
        fence,
        word,
        sep,
        ident, // preserve index for close
        attrs,
        newLine,
        body,
        optional(lazy(block)),
        body,
        fence,
        exit,
        sep,
      ]),
      (...args) => args.flat()
    ),
    3
  )
}

const inline = sequence([fence, word, sep, ident, attrs, newLine])

// const parser = sequence([body, block(), body, eos()])
const parser = sequence([body, any([block(), inline]), body, eos()])
// const parser = sequence([str('foo'), eos()])
const res = parser({ text, index: 0 })

console.log(util.inspect(res, false, null, true))
console.log('\n\n--->', res.success)
