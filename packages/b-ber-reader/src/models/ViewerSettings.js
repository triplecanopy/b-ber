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

class ViewerSettings {
  static defaults = {
    width: 0,
    height: 0,
    fontSize: 120,

    // theme settings. transition speed must be set in ms
    theme: themes.DEFAULT,
    transition: transitions.SLIDE,
    transitionSpeed: 400,
  }

  constructor(options = {}) {
    Object.defineProperty(this, 'settings', {
      value: extendExistingProps({}, ViewerSettings.defaults, options, {
        enumerable: true,
        writable: true,
      }),
      enumerable: true,
    })

    this.put = this.put.bind(this)
    this.get = this.get.bind(this)

    this.columnGap = () => Viewport.getGutterWidth()

    this.paddingLeft = () => Viewport.optimized().left
    this.paddingRight = () => Viewport.optimized().right
    this.paddingTop = () => Viewport.optimized().top
    this.paddingBottom = () => Viewport.optimized().bottom

    this.columnWidth = () =>
      window.innerWidth / 2 - this.columnGap - this.paddingLeft
  }

  get width() {
    return this.settings.width
  }

  get height() {
    return this.settings.height
  }

  // responsive
  get gridColumns() {
    return typeof this.settings.gridColumns === 'function'
      ? this.settings.gridColumns()
      : this.settings.gridColumns
  }

  get gridColumnWidth() {
    return typeof this.settings.gridColumnWidth === 'function'
      ? this.settings.gridColumnWidth()
      : this.settings.gridColumnWidth
  }

  get gridGutterWidth() {
    return typeof this.settings.gridGutterWidth === 'function'
      ? this.settings.gridGutterWidth()
      : this.settings.gridGutterWidth
  }

  get paddingTop() {
    return typeof this.settings.paddingTop === 'function'
      ? this.settings.paddingTop()
      : this.settings.paddingTop
  }

  get paddingLeft() {
    return typeof this.settings.paddingLeft === 'function'
      ? this.settings.paddingLeft()
      : this.settings.paddingLeft
  }

  get paddingRight() {
    return typeof this.settings.paddingRight === 'function'
      ? this.settings.paddingRight()
      : this.settings.paddingRight
  }

  get paddingBottom() {
    return typeof this.settings.paddingBottom === 'function'
      ? this.settings.paddingBottom()
      : this.settings.paddingBottom
  }

  get paddingX() {
    return this.settings.paddingLeft() + this.settings.paddingRight()
  }

  get paddingY() {
    return this.settings.paddingTop() + this.settings.paddingBottom()
  }

  get columns() {
    return this.settings.columns
  }

  get columnGap() {
    return typeof this.settings.columnGap === 'function'
      ? this.settings.columnGap()
      : this.settings.columnGap
  }

  get columnWidth() {
    return typeof this.settings.columnWidth === 'function'
      ? this.settings.columnWidth()
      : this.settings.columnWidth
  }

  get transition() {
    return this.settings.transition
  }

  get transitionSpeed() {
    return this.settings.transitionSpeed
  }

  get theme() {
    return this.settings.theme
  }

  // returns n as a string (percentage)
  get fontSize() {
    return `${this.settings.fontSize}%`
  }

  set gridColumns(val) {
    this.settings.gridColumns = val
  }

  set gridColumnWidth(val) {
    this.settings.gridColumnWidth = val
  }

  set gridGutterWidth(val) {
    this.settings.gridGutterWidth = val
  }

  set columnGap(val) {
    this.settings.columnGap = val
  }

  set columnWidth(val) {
    this.settings.columnWidth = val
  }

  set paddingTop(val) {
    this.settings.paddingTop = val
  }

  set paddingLeft(val) {
    this.settings.paddingLeft = val
  }

  set paddingRight(val) {
    this.settings.paddingRight = val
  }

  set paddingBottom(val) {
    this.settings.paddingBottom = val
  }

  // expects array of values
  set padding(values) {
    const [top, right, bottom, left] = values
    if (isNumeric(top)) this.settings.paddingTop = top
    if (isNumeric(right)) this.settings.paddingRight = right
    if (isNumeric(bottom)) this.settings.paddingBottom = bottom
    if (isNumeric(left)) this.settings.paddingLeft = left
  }

  set columns(val) {
    this.settings.columns = val
  }

  set transition(val) {
    this.settings.transition = val
  }

  set transitionSpeed(val) {
    this.settings.transitionSpeed = val
  }

  set theme(val) {
    this.settings.theme = val
  }

  // Stores values as numbers
  set fontSize(val) {
    let val_ = val
    if (!isNumeric(val_)) val_ = parseFloat(val_, 10)
    this.settings.fontSize = val_
  }

  get(key = '') {
    if (key) return this.settings[key]

    return {
      gridColumns: this.gridColumns,
      gridColumnWidth: this.gridColumnWidth,
      gridGutterWidth: this.gridGutterWidth,
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

  put(objectOrString = {}, val = null) {
    if (isPlainObject(objectOrString)) {
      // TODO: this should be extracted and process other props
      // @issue: https://github.com/triplecanopy/b-ber/issues/222
      if (has(objectOrString, 'fontSize')) {
        if (!isNumeric(objectOrString.fontSize)) {
          // eslint-disable-next-line no-param-reassign
          objectOrString.fontSize = parseFloat(objectOrString.fontSize, 10)
        }
      }

      // TODO This seems acceptable sinc async-await will require regenerator-runtime anyway
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of objectOrString) {
        this[key] = value
      }

      return
    }
    if (typeof objectOrString === 'string') {
      this[objectOrString] = val
      return
    }

    console.error('Invalid params: could not update settings')
  }
}

export default ViewerSettings
