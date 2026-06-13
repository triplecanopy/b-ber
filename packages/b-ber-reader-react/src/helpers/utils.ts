import eq from 'lodash/eq'
import gt from 'lodash/gt'
import gte from 'lodash/gte'
import has from 'lodash/has'
import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'
import isUndefined from 'lodash/isUndefined'
import lt from 'lodash/lt'
import lte from 'lodash/lte'
import { MEDIA_CONTROLS_PRESETS } from '../constants'
import browser from '../lib/browser'

export const noop = (): void => {}

export const rand = (): string => String(Math.random()).substring(2)

// Returns first non-undefined value from arguemnts list, testing each from left
// to right.
// unlessDefined(undefined, undefined, false, true)  => false
// unlessDefined(null, undefined, false, true)       => null
// unlessDefined(undefined, 0, 1, false, true)       => 0
// unlessDefined()                                   => undefined
export const unlessDefined = (...args: any[]): any => {
  let arg: any

  do {
    arg = args.shift()
  } while (isUndefined(arg) && args.length)

  return arg
}

// This is a kludge to keep server data working properly on dev and production.
// The readerState should be refactored so that UI options are passed in as a
// separate object.
export const mergeDeep = (target: any, ...args: any[]): any => {
  let result = target
  for (let i = 0; i < args.length; i++) {
    if (isArray(args[i])) {
      result = [...(result || []), ...args[i]]
    } else if (isPlainObject(args[i])) {
      // https://github.com/eslint/eslint/issues/12117
      for (const [key, val] of Object.entries(args[i])) {
        if (!has(args[i], key)) continue

        if (typeof result[key] !== typeof val) {
          // Overwrite target if they're not the same type
          result[key] = val
        } else {
          // Otherwise merge the objects
          result[key] = mergeDeep(result[key], val)
        }
      }
    } else {
      result = args[i]
    }
  }

  return result
}

const comparison = (() => {
  const fns: Record<string, (a: unknown, b: unknown) => boolean> = {
    eq,
    gt,
    gte,
    lt,
    lte,
  }
  return (fn: string, a: unknown, b: unknown) => fns[fn].call(null, a, b)
})()

export const isBrowser = (
  name: string,
  operator = '',
  majorVersion = 0
): boolean => {
  if (!browser || browser.name !== name) return false

  // Simple check if is a specific browser, e.g., isBrowser('safari')
  if (!operator || !majorVersion) return true

  // `version` is absent on bot/node detections; the original code assumed a
  // real browser here, so we keep that assumption.
  const [major] = (browser.version as string).split('.').map(Number)

  return comparison(operator, major, majorVersion)
}

// If the user has passed in a preset value defined in
// MEDIA_CONTROLS_PRESETS then pass that value into the media player.
// Otherwise use the value of the controls attribute to determine weather
// to show or hide the default HTML5 controls
export const getControlsPreset = ({
  controls,
}: {
  controls?: unknown
}): unknown =>
  MEDIA_CONTROLS_PRESETS.has(controls as string)
    ? controls
    : !isUndefined(controls)
