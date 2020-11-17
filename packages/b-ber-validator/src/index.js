const util = require('util')
const tests = require('./tests')

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

// Convenience methods to build `Result`s for us

function success(ctx, value) {
  return { success: true, value, ctx }
}

function failure(ctx, expected, fatal = false) {
  return { success: false, expected, ctx, fatal }
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

// Try each matcher in order, starting from the same point in the input.
// Return the first one that succeeds, or return the failure that got furthest
// in the input string. which failure to return is a matter of taste, we
// prefer the furthest failure because. it tends be the most useful/complete
// error message.

// Returns fatal error!
function any(parsers) {
  return ctx => {
    let furthestRes = null
    for (const parser of parsers) {
      const res = parser(ctx)
      if (res.success) return res
      if (res.fatal) return res
      if (!furthestRes || furthestRes.ctx.index > res.ctx.index) {
        furthestRes = res
      }
    }
    return furthestRes
  }
}

// Does not return fatal error
function any2(parsers) {
  return ctx => {
    let furthestRes = null
    for (const parser of parsers) {
      const res = parser(ctx)
      if (res.success) return res
      // if (res.fatal) return res
      if (!furthestRes || furthestRes.ctx.index > res.ctx.index) {
        furthestRes = res
      }
    }
    return furthestRes
  }
}

// match a parser, or succeed with null
function optional(parser) {
  return any2([parser, ctx => success(ctx, null)])
}

// Match a regexp or fail
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

// Look for 0 or more of something, until we can't parse any more.
// Note that this function never fails, it will instead succeed
// with an empty array.
function many(parser) {
  return ctx => {
    const values = []
    let nextCtx = ctx
    while (true) {
      const res = parser(nextCtx)
      if (!res.success) {
        if (res.fatal) {
          // errors.push(res.expected)
          return res
        }

        break
      }

      values.push(res.value)
      nextCtx = res.ctx
    }

    return success(nextCtx, values)
  }
}

function not(parser) {
  return ctx => {
    const values = []
    const nextCtx = ctx

    while (nextCtx.index < nextCtx.text.length) {
      const res = parser(nextCtx)

      if (res.success) return success(nextCtx)

      nextCtx.index += 1
    }

    return success(nextCtx, values)
  }
}

// Look for an exact sequence of parsers, or fail
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

// Convenience method that will map a Success to callback, to let us do
// common things like build AST nodes from input strings.
function map(parser, fn) {
  return ctx => {
    const res = parser(ctx)
    return res.success ? success(res.ctx, fn(res.value)) : res
  }
}

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

// eol function doesn't advance index
function EOL() {}
function eol() {
  return ctx => {
    const match = '\n'
    const endIdx = ctx.index + match.length
    if (
      ctx.index === ctx.text.length ||
      ctx.text.substring(ctx.index, endIdx) === match
    ) {
      return success(ctx, new EOL())
    }

    return failure(ctx, 'End of line', true)
  }
}

const space = str(' ')
const spaces = many(space)
const newLine = str('\n')
const carriageReturn = str('\r')
const whiteSpace = any([space, newLine, carriageReturn])
const whiteSpaces = many(whiteSpace)

const fence = str('\n::: ')
const word = regex(/[a-zA-Z_-]+/g)
const words = many(regex(/[a-zA-Z_-]+\s?/g))
const quote = any([str('"'), str("'")])
const sep = str(':')
const ident = regex(/[a-zA-Z_-]+/g)
const body = not(fence)
const exit = str('exit')

const close = (parser, matchIndex) => ctx => {
  const res = parser(ctx)
  if (!res.success) return res

  const { ctx: nextCtx, value } = res
  const match = value[matchIndex]
  const nextValue = value.concat(match)
  const endIdx = nextCtx.index + match.length
  const closingIdent = nextCtx.text.substring(nextCtx.index, endIdx)

  if (closingIdent === match) {
    return success({ ...ctx, index: endIdx }, nextValue)
  }

  return failure(
    { ...ctx, index: endIdx },
    `Closing ident ${closingIdent} does not match opening ident ${match}`,
    true
  )
}

function attr() {
  const quoteIndex = 3
  return any([
    sequence([space, word, sep, word]),
    close(
      map(sequence([space, word, sep, quote, words]), (...args) => args.flat()),
      quoteIndex
    ),
  ])
}

const attrs = sequence([many(attr()), optional(spaces), eol()])

// TODO fill these in, and add block directive names
const inlineDirectiveName = any([str('image')])

function inline() {
  return sequence([fence, inlineDirectiveName, sep, ident, attrs])
}

function block() {
  const identIndex = 3
  return close(
    map(
      sequence([
        fence,
        word,
        sep,
        ident, // Preserve index for exit token
        attrs,
        optional(any([lazy(directives), body])),
        fence,
        exit,
        sep,
      ]),
      (...args) => args.flat()
    ),
    identIndex
  )
}

function directives() {
  return any([
    sequence([body, inline(), body]),
    sequence([body, block(), body]),
  ])
}

const parser = sequence([many(directives()), eos()])

// Tests
let err = false
for (let i = 0; i < tests.length; i++) {
  const res = parser({ text: tests[i].text, index: 0 })
  // const res = parser({ text, index: 0 })

  // console.log(res)
  if (res.success === false) {
    console.log('='.repeat(70))
    console.log()
    console.log(tests[i].name)
    console.log()

    const lines = res.ctx.text.slice(0, res.ctx.index).split('\n')
    const line = lines[lines.length - 1]
    const len = line.length - 2 > 0 ? line.length - 2 : 0

    console.log(res.expected)
    console.log('On line', lines.length)
    console.log()
    console.log(line)
    console.log(' '.repeat(len), '^')
  }

  if (res.success !== tests[i].success) {
    console.log('Error in', tests[i].name)
    console.log(util.inspect(res, false, null, true))

    err = true
  }
}

if (!err) {
  console.log('\nAll tests passed')
}
