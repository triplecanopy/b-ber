/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */

import isUndefined from 'lodash/isUndefined'
import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'
import has from 'lodash/has'
import eq from 'lodash/eq'
import gt from 'lodash/gt'
import gte from 'lodash/gte'
import lt from 'lodash/lt'
import lte from 'lodash/lte'
import browser from '../lib/browser'
import { MEDIA_CONTROLS_PRESETS } from '../constants'

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
        if (!has(args[i], key)) continue

        if (typeof target[key] !== typeof val) {
          // Overwrite target if they're not the same type
          target[key] = val
        } else {
          // Otherwise merge the objects
          target[key] = mergeDeep(target[key], val)
        }
      }
    } else {
      // eslint-disable-next-line no-param-reassign
      target = args[i]
    }
  }

  return target
}

const comparison = (() => {
  const fns = { eq, gt, gte, lt, lte }
  return (fn, a, b) => fns[fn].call(null, a, b)
})()

export const isBrowser = (name, operator = '', majorVersion = 0) => {
  if (!browser || browser.name !== name) return false

  // Simple check if is a specific browser, e.g., isBrowser('safari')
  if (!operator || !majorVersion) return true

  const [major] = browser.version.split('.').map(Number)

  return comparison(operator, major, majorVersion)
}

// If the user has passed in a preset value defined in
// MEDIA_CONTROLS_PRESETS then pass that value into the media player.
// Otherwise use the value of the controls attribute to determine weather
// to show or hide the default HTML5 controls
export const getControlsPreset = ({ controls }) =>
  MEDIA_CONTROLS_PRESETS.has(controls) ? controls : !isUndefined(controls)
