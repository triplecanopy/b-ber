import {
  layouts,
  horizontalBreakpoints,
  MEDIA_QUERY_DESKTOP_MD,
  MEDIA_QUERY_MIN_SCROLLING_ASPECT_RATIO,
  MEDIA_QUERY_MOBILE,
  MEDIA_QUERY_TABLET,
  MEDIA_QUERY_DESKTOP,
  columns,
} from '../constants'

class Viewport {
  static isMediaQueryMobile = () =>
    window.matchMedia(MEDIA_QUERY_MOBILE).matches

  static isMediaQueryTablet = () =>
    window.matchMedia(MEDIA_QUERY_TABLET).matches

  static isMediaQueryDesktop = () =>
    window.matchMedia(MEDIA_QUERY_DESKTOP).matches

  static isMinimumScrollingAspectRatio = () =>
    window.matchMedia(MEDIA_QUERY_MIN_SCROLLING_ASPECT_RATIO).matches

  static isSingleColumn = () => {
    const { css } = Viewport.getCss()

    return (
      css.columns === columns.ONE || Viewport.isMinimumScrollingAspectRatio()
    )
  }

  static isVerticallyScrolling = ({ layout }) =>
    Viewport.isSingleColumn() || layout === layouts.SCROLL

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
    let mediaQuery = MEDIA_QUERY_DESKTOP_MD
    let css = horizontalBreakpoints.get(mediaQuery)

    // eslint-disable-next-line no-unused-vars
    for (const [query, styles] of horizontalBreakpoints) {
      if (window.matchMedia(query).matches) {
        css = { ...styles }
        mediaQuery = query
        break
      }
    }

    return { css, mediaQuery }
  }

  static getStyles = () => {
    const { css } = Viewport.getCss()

    const {
      maxWidth,
      maxHeight,
      columnGap,
      columns: cssColumns,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      fontSize,
    } = css

    const horizontalPadding = Viewport.getHorizontalSpacing(maxWidth)
    const verticalPadding = Viewport.getVerticalSpacing(maxHeight)

    const styles = {
      paddingLeft: horizontalPadding + parseInt(paddingLeft, 10),
      paddingRight: horizontalPadding + parseInt(paddingRight, 10),
      paddingTop: verticalPadding + parseInt(paddingTop, 10),
      paddingBottom: verticalPadding + parseInt(paddingBottom, 10),
      columnGap: parseInt(columnGap, 10),
      fontSize,
      columns: cssColumns,
    }

    return styles
  }

  static styles = () => Viewport.getStyles()
}

export default Viewport
