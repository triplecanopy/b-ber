// Parser types shared by the combinators and exported to consumers. These
// were an ambient `declare module 'b-ber-validator'`, which emitted
// declarations could not reference.

// Every parsing function will have this signature
export type Parser<T> = (ctx: Context) => Result<T>

// To track progress through our input string.
// We should make this immutable, because we can.
export type Context = Readonly<{
  text: string // the full input string
  index: number // our current position in it
}>

// Our result types
export type Result<T> = Success<T> | Failure

// On success we'll return a value of type T, and a new Ctx
// (position in the string) to continue parsing from
export type Success<T> = Readonly<{
  value: T
  success: true
  ctx: Context
}>

// When we fail we want to know where and why
export type Failure = Readonly<{
  expected: string
  success: false
  fatal: boolean
  ctx: Context
}>
