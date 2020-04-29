import isUndefined from 'lodash/isUndefined'

export const noop = () => {}

export const rand = () => String(Math.random()).substring(2)

// Returns first non-undefined value from arguemnts list, testing each from left
// to right.
// unlessDefined(undefined, undefined, false, true)  => false
// unlessDefined(null, undefined, false, true)       => null
// unlessDefined(undefined, 0, 1, false, true)       => 0
// unlessDefined()                                   => undefined
export const unlessDefined = (...args) => {
  let arg

  do {
    arg = args.shift()
  } while (isUndefined(arg) && args.length)

  return arg
}
