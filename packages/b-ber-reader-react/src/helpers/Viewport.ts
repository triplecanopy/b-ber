import {
  breakpoints,
  columns,
  layouts,
  MEDIA_QUERY_DESKTOP,
  MEDIA_QUERY_DESKTOP_MD,
  MEDIA_QUERY_MIN_SCROLLING_ASPECT_RATIO,
  MEDIA_QUERY_MOBILE,
  MEDIA_QUERY_TABLET,
} from '../constants'

// The breakpoint CSS objects mix string ('15px') and number (0) values for
// padding fields, so callers coerce via parseInt. TODO: normalize the breakpoint
// shape in constants and tighten this.
interface BreakpointCss {
  maxWidth: string
  maxHeight: string
  columnGap: string | number
  columns: string
  paddingLeft: string | number
  paddingRight: string | number
  paddingTop: string | number
  paddingBottom: string | number
  fontSize: string
}

class Viewport {
  static isMediaQueryMobile = (): boolean =>
    window.matchMedia(MEDIA_QUERY_MOBILE).matches

  static isMediaQueryTablet = (): boolean =>
    window.matchMedia(MEDIA_QUERY_TABLET).matches

  static isMediaQueryDesktop = (): boolean =>
    window.matchMedia(MEDIA_QUERY_DESKTOP).matches

  static isMinimumScrollingAspectRatio = (): boolean =>
    window.matchMedia(MEDIA_QUERY_MIN_SCROLLING_ASPECT_RATIO).matches

  static isSingleColumn = (): boolean => {
    const { css } = Viewport.getCss()

    return (
      css.columns === columns.ONE || Viewport.isMinimumScrollingAspectRatio()
    )
  }

  static isVerticalScrollConfigured = (layout: string): boolean =>
    layout === layouts.SCROLL

  static isVerticallyScrolling = ({ layout }: { layout: string }): boolean =>
    Viewport.isSingleColumn() || Viewport.isVerticalScrollConfigured(layout)

  static isTouch = (): boolean =>
    'ontouchstart' in window /* iOS and Android */ ||
    // msPointerEnabled is a legacy Win8 IE property absent from lib.dom types
    (window.navigator as any).msPointerEnabled /* Win8 */ ||
    'ontouchstart' in document.documentElement

  static isPixelValue = (str: string): boolean =>
    (str || '').substring(str.length - 2) === 'px'

  static isPercentageValue = (str: string): boolean =>
    (str || '').substring(str.length - 1) === '%'

  static parseStringWidthValue = (str: string): number => {
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

  static parseStringHeightValue = (str: string): number => {
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

  static getHorizontalSpacing = (maxWidth: string): number => {
    if (maxWidth === 'auto') return 0

    const width = Viewport.parseStringWidthValue(maxWidth)

    return (window.innerWidth - width) / 2
  }

  static getVerticalSpacing = (maxHeight: string): number => {
    if (maxHeight === 'auto') return 0

    let height = Viewport.parseStringHeightValue(maxHeight)

    height = (window.innerHeight - height) / 2
    height = Math.max(0, height)

    return height
  }

  // The width of one "page" in the paginated columns layout — i.e. the distance
  // the layout container is translated on each page turn. This is the single
  // source of truth for that geometry; spread positioning (Spread.jsx) and the
  // page-turn transform (Reader getTranslateX) must agree on it or figures
  // drift off-screen. Sourced from viewerSettings.width (the value the transform
  // uses), which equals window.innerWidth in the columns layout. Returns NaN in
  // a vertical-scroll layout (width === 'auto'); callers guard for that.
  static getPageWidth = ({
    width,
    paddingLeft,
    paddingRight,
    columnGap,
  }: {
    width: number
    paddingLeft: number
    paddingRight: number
    columnGap: number
  }): number => width - paddingLeft - paddingRight + columnGap

  // Returns CSS to be applied to use to calculate various frame dimensions
  static getCss = (): { css: BreakpointCss; mediaQuery: string } => {
    let mediaQuery = MEDIA_QUERY_DESKTOP_MD
    let css = breakpoints.get(mediaQuery)

    for (const [query, styles] of breakpoints) {
      if (window.matchMedia(query).matches) {
        css = { ...styles }
        mediaQuery = query
        break
      }
    }

    return { css: css as BreakpointCss, mediaQuery }
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
      paddingLeft: horizontalPadding + parseInt(paddingLeft as string, 10),
      paddingRight: horizontalPadding + parseInt(paddingRight as string, 10),
      paddingTop: verticalPadding + parseInt(paddingTop as string, 10),
      paddingBottom: verticalPadding + parseInt(paddingBottom as string, 10),
      columnGap: parseInt(columnGap as string, 10),
      fontSize,
      columns: cssColumns,
    }

    return styles
  }

  static styles = () => Viewport.getStyles()
}

export default Viewport
