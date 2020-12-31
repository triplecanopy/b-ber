import { Parser } from 'b-ber-validator'
import {
  BLOCK_DIRECTIVES,
  INLINE_DIRECTIVES,
  MISC_DIRECTIVES,
  DRAFT_DIRECTIVES,
  DEPRECATED_DIRECTIVES,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import { string } from './combinators/string'
import { many } from './combinators/many'
import { oneOf } from './combinators/oneOf'
import { regex } from './combinators/regex'
import { sequence } from './combinators/sequence'
import { map } from './combinators/map'
import { optional } from './combinators/optional'
import { eol } from './combinators/eol'
import { not } from './combinators/not'
import { lazy } from './combinators/lazy'
import { eos } from './combinators/eos'
import { close } from './combinators/close'
import { required } from './combinators/required'
import { constrained } from './combinators/constrained'

const space = string(' ', 'Space')
const spaces = many(space)
const newLine = string('\n', 'Newline')
const ascii = regex(/[\x21\x23-\x26\x28-\x39\x3B-\x7F]+/g, 'ASCII characters') // ASCII without whitespace, colon, or quotes
const words = regex(/[^'"]+/g, 'Words') // TODO should be 'not opening character' (i.e., `'` or `"`)
const quote = oneOf([string('"'), string("'")])

// Strings/RegExps instead of sequences to return complete value in error messages
const sep = string(':')
const delimInline = regex(/::(?!:)/g, '::')
const fenceInline = sequence([regex(/\n::(?!:)/g, '::'), required(space)])
const fenceBlock = sequence([regex(/\n:::(?!:)/g, ':::'), required(space)])

const body = not(sequence([newLine, sep, sep]))
const ident = regex(/[a-zA-Z0-9_-]+/g, 'Identifier')
const exit = regex(/exit\b/g, 'Exit')

// Directive attributes
function attr() {
  const quoteIndex = 3
  return oneOf([
    sequence([space, ascii, sep, ascii]),
    close(
      map(sequence([space, ascii, sep, quote, words]), (...args) =>
        args.flat()
      ),
      quoteIndex
    ),
  ])
}

const attrs = sequence([many(attr()), optional(spaces), eol()])

// Directive RegExp is a directive name followed by a word boundry,
// that is not followed by a hyphen. This is done to prevent false
// matches e.g., matching `figure` for `figure-inline`. All directive
// names are made up of latin a-z and hyphen. `g` flag is set to
// allow `lastIndex` to be used in the `regex` combinator.
const directiveRegExp = (s: string) => new RegExp(`${s}\\b(?!-)`, 'g')

const inlineNames = Array.from(INLINE_DIRECTIVES).map(s =>
  regex(directiveRegExp(s), s)
)

const blockNames = Array.from(BLOCK_DIRECTIVES)
  .concat(Array.from(MISC_DIRECTIVES))
  .concat(Array.from(DRAFT_DIRECTIVES))
  .concat(Array.from(DEPRECATED_DIRECTIVES))
  .map(s => regex(directiveRegExp(s), s))

const inlineDirectiveName = oneOf(inlineNames)
const blockDirectiveName = oneOf(blockNames)

const name = oneOf(inlineNames.concat(blockNames).concat(exit))

const caption = sequence([
  fenceInline,
  not(eol()),
  eol(),
  required(newLine),
  required(delimInline),
  optional(spaces),
  eol(),
])

function inline() {
  return sequence([
    fenceBlock,
    constrained(name, inlineDirectiveName, 'Valid directive name'),
    required(sep),
    required(ident),
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
        constrained(name, blockDirectiveName, 'Valid directive name'),
        required(sep),
        required(ident), // Preserve index for exit token
        attrs,
        optional(body),
        optional(lazy(directives)),
        optional(body),
        fenceBlock,
        exit,
        required(sep),
      ]),
      (...args) => args.flat()
    ),
    identIndex
  )
}

function directives() {
  return many(
    oneOf([
      sequence([optional(body), inline(), optional(body)]),
      sequence([optional(body), block(), optional(body)]),
    ])
  )
}

const parser = sequence([optional(body), directives(), optional(body), eos()])

export default parser
