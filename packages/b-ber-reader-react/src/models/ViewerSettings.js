import isPlainObject from 'lodash/isPlainObject'
import has from 'lodash/has'
import { isNumeric } from '../helpers/Types'
import { transitions, themes } from '../constants'
import Viewport from '../helpers/Viewport'

const extendExistingProps = (target, ref, obj, opts = { enumerable: true }) => {
  Object.entries(ref).forEach(([key, val]) => {
    const value = has(obj, key) ? obj[key] : val
    Object.defineProperty(target, key, { value, ...opts })
  })
  return target
}

const valueOf = maybeFunction =>
  typeof maybeFunction === 'function' ? maybeFunction.call() : maybeFunction

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
    fontSize: '120%', // TODO not working, unused

    // Theme settings, transition speed in ms
    theme: themes.DEFAULT,
    transition: transitions.SLIDE,
    transitionSpeed: 400,
    columns: 2,

    columnGap: () => Viewport.styles().columnGap,
    paddingLeft: () => Viewport.styles().paddingLeft,
    paddingRight: () => Viewport.styles().paddingRight,
    paddingTop: () => Viewport.styles().paddingTop,
    paddingBottom: () => Viewport.styles().paddingBottom,
  }

  constructor(options = {}) {
    // Create the settings object by extending static default values above
    Object.defineProperty(this, 'settings', {
      value: extendExistingProps({}, ViewerSettings.defaults, options, {
        enumerable: true,
        writable: true,
      }),
      enumerable: true,
    })

    // `columnWidth` relies on calculations from the lenses so must be in
    // the constructor rather than in defaults
    this.columnWidth = () =>
      window.innerWidth / 2 - this.columnGap - this.paddingLeft
  }

  get width() {
    return this.settings.width
  }

  set width(val) {
    this.settings.width = val
  }

  get height() {
    return this.settings.height
  }

  set height(val) {
    this.settings.height = val
  }

  get paddingTop() {
    return valueOf(this.settings.paddingTop)
  }

  set paddingTop(val) {
    this.settings.paddingTop = val
  }

  get paddingLeft() {
    return valueOf(this.settings.paddingLeft)
  }

  set paddingLeft(val) {
    this.settings.paddingLeft = val
  }

  get paddingRight() {
    return valueOf(this.settings.paddingRight)
  }

  set paddingRight(val) {
    this.settings.paddingRight = val
  }

  get paddingBottom() {
    return valueOf(this.settings.paddingBottom)
  }

  set paddingBottom(val) {
    this.settings.paddingBottom = val
  }

  get paddingX() {
    return this.paddingLeft + this.paddingRight
  }

  get paddingY() {
    return this.paddingTop + this.paddingBottom
  }

  get columns() {
    return this.settings.columns
  }

  set columns(val) {
    this.settings.columns = val
  }

  get columnGap() {
    return valueOf(this.settings.columnGap)
  }

  set columnGap(val) {
    this.settings.columnGap = val
  }

  get columnWidth() {
    return valueOf(this.settings.columnWidth)
  }

  set columnWidth(val) {
    this.settings.columnWidth = val
  }

  get transition() {
    return this.settings.transition
  }

  set transition(val) {
    this.settings.transition = val
  }

  get theme() {
    return this.settings.theme
  }

  set theme(val) {
    this.settings.theme = val
  }

  get transitionSpeed() {
    return this.settings.transitionSpeed
  }

  set transitionSpeed(val) {
    this.settings.transitionSpeed = val
  }

  get fontSize() {
    return this.settings.fontSize
  }

  set fontSize(val) {
    this.settings.fontSize = val
  }

  // expects array of values
  set padding(values) {
    const [top, right, bottom, left] = values

    if (isNumeric(top)) this.settings.paddingTop = top
    if (isNumeric(right)) this.settings.paddingRight = right
    if (isNumeric(bottom)) this.settings.paddingBottom = bottom
    if (isNumeric(left)) this.settings.paddingLeft = left
  }

  get = (key = '') => {
    if (key) {
      if (!has(this.settings, key)) {
        console.error('Attempting to access undefined key %s', key)
        return
      }

      return this[key]
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

  put = (objectOrKey = {}, value = null) => {
    if (isPlainObject(objectOrKey)) {
      // https://github.com/eslint/eslint/issues/12117
      // eslint-disable-next-line no-unused-vars
      for (const [key, val] of Object.entries(objectOrKey)) {
        if (has(this.settings, key)) this[key] = val
      }
    } else if (typeof objectOrKey === 'string') {
      if (has(this.settings, objectOrKey)) {
        this[objectOrKey] = value
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
