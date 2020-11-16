/* eslint-disable no-unused-vars */
/* eslint-disable yoda */
/* eslint-disable no-use-before-define */
// import { Streams, F, C } from '@masala/parser'
// import util from 'util'

const { Streams, F, C } = require('@masala/parser')
const util = require('util')

// const { Streams, F, N, C, Parser } = require("../../../build/lib")
// const { assertTrue } = require("../../assert")

function sep() {
  return C.char(':')
}

function space() {
  return C.char(' ')
}

function blank() {
  return C.charIn(['\r', '\n', ' '])
    .optrep()
    .drop()
}

function text() {
  return F.not(fence())
    .optrep()
    .drop()
}

function lf() {
  return C.char('\n')
}

function fence() {
  return lf()
    .then(sep())
    .then(sep())
    .then(sep())
    .then(space())
    .drop()
}

function ident() {
  return F.satisfy(
    c =>
      ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') || '-' === c || '_' === c
  )
    .rep()
    .map(cs => cs.join(''))
}

// TODO support unicode - should also have `sentence()`
function word() {
  return F.satisfy(
    c =>
      ('a' <= c && c <= 'z') ||
      ('A' <= c && c <= 'Z') ||
      '-' === c ||
      '_' === c ||
      c === ' '
  )
    .rep()
    .map(cs => cs.join(''))
}

function open() {
  return C.stringIn(['block'])
}

function close() {
  return C.string('exit')
}

function enter() {
  return fence()
    .then(open())
    .then(sep().drop())
    .then(ident())
}

// TODO support unicode, ', ", etc. Also requires 'wrapping' sentences in
// matching quotes, and omitting the boundaries
function attr() {
  return C.letters()
    .then(sep().drop())

    .then(
      F.try(
        C.char("'")
          .drop()
          .then(word())
          .then(C.char("'").drop())
      )
        .or(
          C.char('"')
            .drop()
            .then(word())
            .then(C.char('"').drop())
        )
        .or(C.letters())
    )
}

function attrs() {
  return space()
    .drop()
    .then(attr())
    .optrep()
    .then(C.charIn(['\n', '\r']).drop())
}

function exit() {
  return fence()
    .then(close())
    .then(sep().drop())
    .map(x => ({ val: x, other: 2 }))
}

//
//
//

function block() {
  return (
    text()
      .then(enter())

      // Return id from previous `ident()` call
      .map(({ value }) => value[1])

      .then(attrs())

      .then(text())

      // Attempt recursion
      .then(F.try(F.lazy(block).then(text().then(exit()))).or(exit()))

      // Call `string()` with id from map fn
      .flatMap(data => {
        const { value } = data
        console.log(data, value, value[0])
        return C.string(value[0])
      })

      .map(x => ({ val: x, other: 1 }))
  )
}

function expr2() {
  return attrs()

  // return C.string(">>").then(F.lazy(block2).or(C.string("<<")))
  // return fence()
}

function expr() {
  return block()
}

function combinator() {
  // return expr2()

  // return expr2().then(F.eos())

  return expr()
    .then(text())
    .then(F.eos())
}

// const string = `>>>><<<<`
// const string = `::: block:idA ::: exit:idA`

// baz:"bat qux"

// const string = ` foo:bar baz:"here is a string" bax:'here is another'`
// const string = ` foo:bar baz:"here is a string"`
// const string = ` foo:bar baz:"here is a string"`

const string = `
::: block:idA foo:bar baz:bat qux:"here is a string"

xxx

::: exxit:idA
`

// const string = `
// ::: block:idA foo:bar baz:bat qux:"here is a string"

// ::: block:idB foo:bar baz:bat qux:"here is a string"

// xxx

// ::: exit:idB

// ::: exit:idA
// `

// const string = `

// asdf

// ::: block:idA foo:bar baz:bat qux:"here is a string"

// ::: block:idB
// xx
// ::: block:idC
// xx
// xx
// xx
// xx
// xx

// ::: exit:idC
// xx
// ::: exit:idB

// xx

// ::: exit:idA

// adsf

// `

// const string = `::: block:idA ::: block:idB ::: exit:idA ::: exit:idB` // should fail
// const string = `::: block:id ::: block:id ::: exit: ::: exit:`

// const string = `::: block:id ::: block:id ::: block:id ::: block:id ::: exit ::: exit ::: exit ::: exit`

const stream = Streams.ofString(string)
const parsing = combinator().parse(stream)
// const parsing = block().parse(stream).value

// assertTrue(parsing.isAccepted());

console.log(util.inspect(parsing, false, null, true))
// console.log(util.inspect(parsing.value, false, null, true));
