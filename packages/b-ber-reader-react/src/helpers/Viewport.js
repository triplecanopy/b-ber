import {
  BREAKPOINT_HORIZONTAL_SMALL,
  MINIMUM_ONE_COLUMN_ASPECT_RATIO,
  layouts,
  horizontalBreakpoints,
  mediaQueryDesktopMd,
} from '../constants'

class Viewport {
  // used to get position X in matrix
  // TODO remove
  static horizontalSmall = () =>
    window.innerWidth <= BREAKPOINT_HORIZONTAL_SMALL

  // Utility breakpoint
  // TODO fix me - where is this used and what is the effect
  static isMobile = () => Viewport.horizontalSmall()

  static isSingleColumn = () => {
    const css = Viewport.getCss()

    return parseInt(css.columns, 10) === 1
  }

  static isTouch = () =>
    'ontouchstart' in window /* iOS and Android */ ||
    window.navigator.msPointerEnabled /* Win8 */ ||
    'ontouchstart' in document.documentElement

  static isPixelValue = str => (str || '').substring(str.length - 2) === 'px'

  static isPercentageValue = str =>
    (str || '').substring(str.length - 1) === '%'

  static parseStringWidthValue = str => {
    let width = 0

    if (Viewport.isPixelValue(str)) {
      width = parseInt(str, 10)
    } else if (Viewport.isPercentageValue(str)) {
      width = (window.innerWidth * parseInt(str, 10)) / 100
    } else {
      console.error('Unsupported value `%s`', str)
    }

    return width
  }

  static parseStringHeightValue = str => {
    let height = 0

    if (Viewport.isPixelValue(str)) {
      height = parseInt(str, 10)
    } else if (Viewport.isPercentageValue(str)) {
      height = (window.innerHeight * parseInt(str, 10)) / 100
    } else {
      console.error('Unsupported value `%s`', str)
    }

    return height
  }

  static getHorizontalSpacing = maxWidth => {
    if (maxWidth === 'auto') return 0

    const width = Viewport.parseStringWidthValue(maxWidth)

    return (window.innerWidth - width) / 2
  }

  static getVerticalSpacing = maxHeight => {
    if (maxHeight === 'auto') return 0

    let height = Viewport.parseStringHeightValue(maxHeight)

    height = (window.innerHeight - height) / 2
    height = Math.max(0, height)

    return height
  }

  // Returns CSS to be applied to use to calculate various frame dimensions
  static getCss = () => {
    let css = horizontalBreakpoints.get(mediaQueryDesktopMd)

    // eslint-disable-next-line no-unused-vars
    for (const [query, data] of horizontalBreakpoints) {
      if (window.matchMedia(query).matches) {
        css = { ...data }
        break
      }
    }

    return css
  }

  static getDimensions = () => {
    const css = Viewport.getCss()

    const {
      maxWidth,
      maxHeight,
      columnGap,
      columns,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    } = css

    const horizontalPadding = Viewport.getHorizontalSpacing(maxWidth)
    const verticalPadding = Viewport.getVerticalSpacing(maxHeight)

    const styles = {
      paddingLeft: horizontalPadding + parseInt(paddingLeft, 10),
      paddingRight: horizontalPadding + parseInt(paddingRight, 10),
      paddingTop: verticalPadding + parseInt(paddingTop, 10),
      paddingBottom: verticalPadding + parseInt(paddingBottom, 10),
      columnGap: parseInt(columnGap, 10),
      columns,
    }

    return styles
  }

  static styles = () => Viewport.getDimensions()

  static verticallyScrolling = ({ layout }) =>
    Viewport.isSingleColumn() ||
    layout === layouts.SCROLL ||
    window.innerWidth / window.innerHeight >= MINIMUM_ONE_COLUMN_ASPECT_RATIO
}

export default Viewport
