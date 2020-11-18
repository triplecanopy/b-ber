import util from 'util'
import { Parser } from 'b-ber-validator'
import tests from './tests'
import { string } from './combinators/string'
import { many } from './combinators/many'
import { oneOrMany } from './combinators/oneOrMany'
import { regex } from './combinators/regex'
import { sequence } from './combinators/sequence'
import { map } from './combinators/map'
import { optional } from './combinators/optional'
import { eol } from './combinators/eol'
import { not } from './combinators/not'
import { lazy } from './combinators/lazy'
import { eos } from './combinators/eos'
import { close } from './combinators/close'
import { noneOrMany } from './combinators/noneOrMany'

const space = string(' ')
const spaces = many(space)
const newLine = string('\n')
// const carriageReturn = string('\r')
// const whiteSpace = oneOrMany([space, newLine, carriageReturn])
// const whiteSpaces = many(whiteSpace)

const word = regex(/[a-zA-Z_-]+/g, 'Word')
const words = many(regex(/[a-zA-Z_-]+\s?/g, 'Words'))
const quote = oneOrMany([string('"'), string("'")])

const sep = string(':')
const delimBlock = sequence([sep, sep, sep])
const delimInline = sequence([sep, sep])
const fenceBlock = sequence([newLine, delimBlock, space])
const fenceInline = sequence([newLine, delimInline, space])

const body = not(sequence([newLine, sep, sep]))
const ident = regex(/[a-zA-Z_-]+/g, 'Ident')
const exit = string('exit')

function attr() {
  const quoteIndex = 3
  return oneOrMany([
    sequence([space, word, sep, word]),
    close(
      map(sequence([space, word, sep, quote, words]), (...args) => args.flat()),
      quoteIndex
    ),
  ])
}

const attrs = sequence([many(attr()), optional(spaces), eol()])

// TODO fill these in, and add block directive names
const inlineDirectiveName = oneOrMany([string('image')])

const caption = sequence([
  fenceInline,
  not(eol()),
  eol(),
  newLine,
  delimInline,
  optional(spaces),
  eol(),
])

function inline() {
  return sequence([
    fenceBlock,
    inlineDirectiveName,
    sep,
    ident,
    attrs,
    optional(caption),
  ])
}

function block(): Parser<any> {
  const identIndex = 3
  return close(
    map(
      sequence([
        fenceBlock,
        word,
        sep,
        ident, // Preserve index for exit token
        attrs,
        optional(noneOrMany([lazy(directives), body])),
        fenceBlock,
        exit,
        sep,
      ]),
      (...args) => args.flat()
    ),
    identIndex
  )
}

function directives() {
  return oneOrMany([
    sequence([body, inline(), body]),
    sequence([body, block(), body]),
  ])
}

const parser = sequence([many(directives()), eos()])

// Tests
let err = false

// function report(name: string, res: any) {
//   console.log('='.repeat(70))
//   console.log()
//   console.log(name)
//   console.log()

//   const lines = res.ctx.text.slice(0, res.ctx.index).split('\n')
//   const line = lines[lines.length - 1]
//   const len = line.length - 2 > 0 ? line.length - 2 : 0

//   console.log(res.expected)
//   console.log('On line', lines.length)
//   console.log()
//   console.log(line)
//   console.log(' '.repeat(len), '^')
// }

for (let i = 0; i < tests.length; i++) {
  const res = parser({ text: tests[i].text, index: 0 })

  // if (res.success === false) {
  //   report(tests[i].name, res)
  // }

  if (res.success !== tests[i].success) {
    console.log('Error in', tests[i].name)
    console.log(util.inspect(res, false, null, true))

    err = true
  }
}

if (!err) {
  console.log('\nAll tests passed')
}
