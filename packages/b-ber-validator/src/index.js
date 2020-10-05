/* eslint-disable no-unused-vars */
/* eslint-disable yoda */
/* eslint-disable no-use-before-define */
import { Streams, F, C } from '@masala/parser'
import util from 'util'

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
      C.charIn(["'", '"'])
        .opt()
        .drop()
    )

    .then(F.try(C.letters()).or(word()))

    .then(
      C.charIn(["'", '"'])
        .opt()
        .drop()
    )
}

function attrs() {
  return space()
    .drop()
    .then(attr())
    .rep()
}

function exit() {
  return fence()
    .then(close())
    .then(sep())
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

      // TODO reenable once `attrs()` passes
      // .then(text())

      // Attempt recursion
      .then(F.try(F.lazy(block).then(text().then(exit()))).or(exit()))

      // Call `string()` with id from map fn
      .flatMap(({ value }) => C.string(value[0]))
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

  return expr2() //.then(F.eos())

  // return expr()
  //   .then(text())
  //   .then(F.eos())
}

// const string = `>>>><<<<`
// const string = `::: block:idA ::: exit:idA`

// baz:"bat qux"

const string = ` foo:bar baz:"here is a string"`
// const string = ` foo:bar baz:"here is a string"`

// const string = `
// ::: block:idA foo:bar baz:bat qux:"here is a string"
// ::: exit:idA
// `

// const string = `

// asdf

// ::: block:idA xx

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
