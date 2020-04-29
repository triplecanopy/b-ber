import isUndefined from 'lodash/isUndefined'
import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'
import has from 'lodash/has'

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

// This is a kludge to keep server data working properly on dev and production.
// The readerState should be refactored so that UI options are passed in as a
// separate object.
export const mergeDeep = (target, ...args) => {
  for (let i = 0; i < args.length; i++) {
    if (isArray(args[i])) {
      // eslint-disable-next-line no-param-reassign
      target = [...(target || []), ...args[i]]
    } else if (isPlainObject(args[i])) {
      // https://github.com/eslint/eslint/issues/12117
      // eslint-disable-next-line no-unused-vars
      for (const [key, val] of Object.entries(args[i])) {
        // eslint-disable-next-line no-continue
        if (!has(args[i], key)) continue
        // eslint-disable-next-line no-param-reassign
        target[key] = mergeDeep(target[key], val)
      }
    } else {
      // eslint-disable-next-line no-param-reassign
      target = args[i]
    }
  }

  return target
}
