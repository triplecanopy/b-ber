import isUndefined from 'lodash/isUndefined'

export const noop = () => {}

export const rand = () => String(Math.random()).substring(2)

export const unlessDefined = (...args) => {
  let arg

  do {
    arg = args.shift()
  } while (isUndefined(arg) && args.length)

  return arg
}
