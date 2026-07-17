import has from 'lodash/has'
import isPlainObject from 'lodash/isPlainObject'
import { columns, themes, transitions } from '../constants'
import { isNumeric } from '../helpers/Types'
import Viewport from '../helpers/Viewport'

// A setting is either a concrete value or a "lens" — a function resolved
// lazily via `valueOf` (used for values derived from the live viewport).
type Lens<T> = T | (() => T)

interface ViewerSettingsValues {
  width: number
  height: number
  theme: string
  transition: string
  transitionSpeed: number
  columns: string
  fontSize: Lens<number | string>
  columnGap: Lens<number>
  columnWidth: Lens<number>
  paddingLeft: Lens<number>
  paddingRight: Lens<number>
  paddingTop: Lens<number>
  paddingBottom: Lens<number>
}

const extendExistingProps = (
  target: Record<string, unknown>,
  ref: Record<string, unknown>,
  obj: Record<string, unknown>,
  opts: PropertyDescriptor = { enumerable: true }
): Record<string, unknown> => {
  Object.entries(ref).forEach(([key, val]) => {
    const value = has(obj, key) ? obj[key] : val
    Object.defineProperty(target, key, { value, ...opts })
  })
  return target
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: local utility, not shadowing Object.prototype.valueOf in any call site
const valueOf = <T>(maybeFunction: Lens<T>): T =>
  typeof maybeFunction === 'function'
    ? (maybeFunction as () => T)()
    : maybeFunction

class ViewerSettings {
  static defaults = {
    // width
    // height
    // paddingTop
    // paddingLeft
    // paddingRight
    // paddingBottom
    // paddingX
    // paddingY
    // columns
    // columnGap
    // columnWidth
    // transition
    // theme
    // transitionSpeed
    // fontSize

    width: 0,
    height: 0,

    // Theme settings, transition speed in ms
    theme: themes.DEFAULT,
    transition: transitions.SLIDE,
    transitionSpeed: 400,
    columns: columns.TWO,

    fontSize: () => Viewport.styles().fontSize,
    columnGap: () => Viewport.styles().columnGap,
    paddingLeft: () => Viewport.styles().paddingLeft,
    paddingRight: () => Viewport.styles().paddingRight,
    paddingTop: () => Viewport.styles().paddingTop,
    paddingBottom: () => Viewport.styles().paddingBottom,
  }

  // Assigned via Object.defineProperty in the constructor, so TS cannot see the
  // initialization; the definite-assignment assertion documents that contract.
  settings!: ViewerSettingsValues

  constructor(options: Record<string, unknown> = {}) {
    // Create the settings object by extending static default values above
    Object.defineProperty(this, 'settings', {
      value: extendExistingProps(
        {},
        ViewerSettings.defaults as Record<string, unknown>,
        options,
        {
          enumerable: true,
          writable: true,
        }
      ),
      enumerable: true,
    })

    // `columnWidth` relies on calculations from the lenses so must be in
    // the constructor rather than in defaults
    this.columnWidth = () =>
      window.innerWidth / 2 - this.columnGap - this.paddingLeft
  }

  get width(): number {
    return this.settings.width
  }

  set width(val: number) {
    this.settings.width = val
  }

  get height(): number {
    return this.settings.height
  }

  set height(val: number) {
    this.settings.height = val
  }

  get paddingTop(): number {
    return valueOf(this.settings.paddingTop)
  }

  set paddingTop(val: number) {
    this.settings.paddingTop = val
  }

  get paddingLeft(): number {
    return valueOf(this.settings.paddingLeft)
  }

  set paddingLeft(val: number) {
    this.settings.paddingLeft = val
  }

  get paddingRight(): number {
    return valueOf(this.settings.paddingRight)
  }

  set paddingRight(val: number) {
    this.settings.paddingRight = val
  }

  get paddingBottom(): number {
    return valueOf(this.settings.paddingBottom)
  }

  set paddingBottom(val: number) {
    this.settings.paddingBottom = val
  }

  get paddingX(): number {
    return this.paddingLeft + this.paddingRight
  }

  get paddingY(): number {
    return this.paddingTop + this.paddingBottom
  }

  get columns(): string {
    return this.settings.columns
  }

  set columns(val: string) {
    this.settings.columns = val
  }

  get columnGap(): number {
    return valueOf(this.settings.columnGap)
  }

  set columnGap(val: number) {
    this.settings.columnGap = val
  }

  get columnWidth(): number {
    return valueOf(this.settings.columnWidth)
  }

  // The constructor assigns a lens function here, so the setter accepts both.
  set columnWidth(val: Lens<number>) {
    this.settings.columnWidth = val
  }

  get transition(): string {
    return this.settings.transition
  }

  set transition(val: string) {
    this.settings.transition = val
  }

  get theme(): string {
    return this.settings.theme
  }

  set theme(val: string) {
    this.settings.theme = val
  }

  get transitionSpeed(): number {
    return this.settings.transitionSpeed
  }

  set transitionSpeed(val: number) {
    this.settings.transitionSpeed = val
  }

  get fontSize(): number | string {
    return valueOf(this.settings.fontSize)
  }

  set fontSize(val: number | string) {
    this.settings.fontSize = val
  }

  // expects array of values
  set padding(values: number[]) {
    const [top, right, bottom, left] = values

    if (isNumeric(top)) this.settings.paddingTop = top
    if (isNumeric(right)) this.settings.paddingRight = right
    if (isNumeric(bottom)) this.settings.paddingBottom = bottom
    if (isNumeric(left)) this.settings.paddingLeft = left
  }

  get = (key = ''): unknown => {
    if (key) {
      if (!has(this.settings, key)) {
        console.error('Attempting to access undefined key %s', key)
        return
      }

      return (this as Record<string, unknown>)[key]
    }

    return {
      width: this.width,
      height: this.height,
      paddingTop: this.paddingTop,
      paddingLeft: this.paddingLeft,
      paddingRight: this.paddingRight,
      paddingBottom: this.paddingBottom,
      columns: this.columns,
      columnGap: this.columnGap,
      columnWidth: this.columnWidth,
      transition: this.transition,
      transitionSpeed: this.transitionSpeed,
      theme: this.theme,
      fontSize: this.fontSize,
    }
  }

  put = (
    objectOrKey: Record<string, unknown> | string = {},
    value: unknown = null
  ): void => {
    if (isPlainObject(objectOrKey)) {
      for (const [key, val] of Object.entries(objectOrKey)) {
        if (has(this.settings, key)) {
          ;(this as Record<string, unknown>)[key] = val
        }
      }
    } else if (typeof objectOrKey === 'string') {
      if (has(this.settings, objectOrKey)) {
        ;(this as Record<string, unknown>)[objectOrKey] = value
      }
    } else {
      console.error(
        'Could not update viewer settings with key: %s val: %s',
        objectOrKey,
        value
      )
    }
  }
}

export default ViewerSettings
