import head from 'lodash/head'
import last from 'lodash/last'

import {
  BREAKPOINT_HORIZONTAL_SMALL,
  BREAKPOINT_HORIZONTAL_MEDIUM,
  BREAKPOINT_HORIZONTAL_LARGE,
  BREAKPOINT_HORIZONTAL_X_LARGE,
  BREAKPOINT_VERTICAL_SMALL,
  BREAKPOINT_VERTICAL_LARGE,
  LAYOUT_MAX_HEIGHT,
  LAYOUT_MAX_WIDTH,
  FRAME_PADDING,
  DESKTOP_COLUMN_COUNT,
  MOBILE_COLUMN_COUNT,
  HORIZONTAL_BREAKPOINT_COUNT,
  VERTICAL_BREAKPOINT_COUNT,
  FRAME_SIZE,
} from '../constants'

import { isNumeric } from './Types'

class Viewport {
  // used to get position X in matrix
  static horizontalSmall = () =>
    window.innerWidth <= BREAKPOINT_HORIZONTAL_SMALL

  static horizontalMedium = () =>
    window.innerWidth >= BREAKPOINT_HORIZONTAL_MEDIUM &&
    window.innerWidth < BREAKPOINT_HORIZONTAL_LARGE

  static horizontalLarge = () =>
    window.innerWidth >= BREAKPOINT_HORIZONTAL_LARGE &&
    window.innerWidth < BREAKPOINT_HORIZONTAL_X_LARGE

  static horizontalXLarge = () =>
    window.innerWidth >= BREAKPOINT_HORIZONTAL_X_LARGE

  // used to get position Y in matrix
  static verticalSmall = () => window.innerHeight <= BREAKPOINT_VERTICAL_SMALL

  static verticalMedium = () =>
    window.innerHeight > BREAKPOINT_VERTICAL_SMALL &&
    window.innerHeight < BREAKPOINT_VERTICAL_LARGE

  static verticalLarge = () => window.innerHeight >= BREAKPOINT_VERTICAL_LARGE

  // utility breakpoint
  static isMobile = () => Viewport.horizontalSmall()

  static isTouch = () =>
    'ontouchstart' in window /* iOS and Android */ ||
    window.navigator.msPointerEnabled /* Win8 */ ||
    'ontouchstart' in document.documentElement

  static getBreakpointX = () => {
    if (Viewport.horizontalSmall()) {
      // console.log(
      //   'only screen and (min-width: 769px) and (max-width: 1140px)',
      //   0,
      //   window.innerWidth
      // )
      return 0
    }
    if (Viewport.horizontalMedium()) {
      // console.log(
      //   'only screen and (min-width: 1141px) and (max-width: 1440px)',
      //   1,
      //   window.innerWidth
      // )
      return 1
    }
    if (Viewport.horizontalLarge()) {
      // console.log(
      //   'only screen and (min-width: 1441px) and (max-width: 1920px)',
      //   2,
      //   window.innerWidth
      // )
      return 2
    }
    if (Viewport.horizontalXLarge()) {
      // console.log('only screen and (min-width: 1921px)', 3, window.innerWidth)
      return 3
    }
  }

  static getBreakpointY = () => {
    if (Viewport.verticalSmall()) {
      console.log('Viewport.verticalSmall', 0)
      return 0
    }
    if (Viewport.verticalMedium()) {
      console.log('Viewport.verticalMedium', 1)
      return 1
    }
    if (Viewport.verticalLarge()) {
      console.log('Viewport.verticalLarge', 2)
      return 2
    }
  }

  static getBreakpointXY = () => [
    Viewport.getBreakpointX(),
    Viewport.getBreakpointY(),
  ]

  static getColumnCount = () =>
    Viewport.isMobile() ? MOBILE_COLUMN_COUNT : DESKTOP_COLUMN_COUNT

  // Flexible columns, flexible gutters.
  // 50% of the width of one column. Not sure if it makes sense here to
  // measure the columns against the width of the window, or the width
  // of the visible frame.
  static getGutterWidth = () => {
    // const frameWidth = Math.min(window.innerWidth, LAYOUT_MAX_WIDTH)
    const columnWidth = window.innerWidth / Viewport.getColumnCount()
    const gutterWidth = columnWidth * 0.5

    return gutterWidth
  }

  static getColumnWidth = () =>
    (65 / Viewport.getColumnCount() / 100) * window.innerWidth

  static getHorizontalSpacingAuto = (x, y) => {
    const width = window.innerWidth
    const padding = Viewport.getColumnWidth() + Viewport.getGutterWidth()

    const frameSize = head(
      FRAME_SIZE.filter(Viewport.filterDimensionsX(x)).filter(
        Viewport.filterDimensionsY(y)
      )
    )

    const maxWidth = head(frameSize)

    // console.log('maxWidth', maxWidth)

    if (maxWidth === 'auto') {
      return width - padding * 2 > LAYOUT_MAX_WIDTH
        ? (width - LAYOUT_MAX_WIDTH) / 2
        : padding
    }

    return (window.innerWidth - maxWidth) / 2
  }

  static getVerticalSpacingAuto = (x, y) => {
    const frameSize = head(
      FRAME_SIZE.filter(Viewport.filterDimensionsX(x)).filter(
        Viewport.filterDimensionsY(y)
      )
    )

    const maxHeight = last(frameSize)

    console.log('maxHeight', maxHeight)

    if (maxHeight === 'auto') {
      return (window.innerHeight - LAYOUT_MAX_HEIGHT) / 2
    }

    return (window.innerHeight - maxHeight) / 2
  }

  static getPixelValue = str => {
    if (str.substring(str.length - 2) !== 'px') {
      return console.error(
        'Unsupported value provided for reader position:',
        str
      )
    }

    return parseInt(str, 10)
  }

  static getVerticalValueFromString = (str, x, y) => {
    const str_ = str.trim().toLowerCase()
    return str_ === 'auto'
      ? Viewport.getVerticalSpacingAuto(x, y)
      : Viewport.getPixelValue(str_)
  }

  static getHorizontalValueFromString = (str, x, y) => {
    const str_ = str.trim().toLowerCase()
    return str_ === 'auto'
      ? Viewport.getHorizontalSpacingAuto(x, y)
      : Viewport.getPixelValue(str_)
  }

  static getVerticalSpacing = (top, bottom, x, y) => ({
    top: isNumeric(top)
      ? window.innerHeight * (top / 100)
      : Viewport.getVerticalValueFromString(top, x, y),

    bottom: isNumeric(bottom)
      ? window.innerHeight * (bottom / 100)
      : Viewport.getVerticalValueFromString(bottom, x, y),
  })

  static getHorizontalSpacing = (left, right, x, y) => ({
    left: isNumeric(left)
      ? window.innerWidth * (left / 100)
      : Viewport.getHorizontalValueFromString(left, x, y),

    right: isNumeric(right)
      ? window.innerWidth * (right / 100)
      : Viewport.getHorizontalValueFromString(right, x, y),
  })

  static filterDimensionsX = x => (_, i) =>
    (i % HORIZONTAL_BREAKPOINT_COUNT) - x === 0

  static filterDimensionsY = y => (_, i) =>
    (i % VERTICAL_BREAKPOINT_COUNT) - y === 0

  static getDimensions = ([x, y]) => {
    // console.log('x %d y %d', x, y)
    // console.log(
    //   FRAME_PADDING.filter(Viewport.filterDimensionsX(x)).filter(
    //     Viewport.filterDimensionsY(y)
    //   )[0]
    // )

    return head(
      FRAME_PADDING.filter(Viewport.filterDimensionsX(x))
        .filter(Viewport.filterDimensionsY(y))
        .map(([top, right, bottom, left]) => ({
          ...Viewport.getVerticalSpacing(top, bottom, x, y),
          ...Viewport.getHorizontalSpacing(left, right, x, y),
        }))
    )
  }

  static getDimensionsFromMatrix = () =>
    Viewport.getDimensions(Viewport.getBreakpointXY())

  static optimized = () => Viewport.getDimensionsFromMatrix()
}

export default Viewport
