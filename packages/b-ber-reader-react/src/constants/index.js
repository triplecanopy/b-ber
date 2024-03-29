// Speeds to debounce our mutation and resize observer callbacks. making sure
// the document is laid out before rendering in decorate-observable.js
export const RESIZE_DEBOUNCE_TIMER = 60
export const MUTATION_DEBOUNCE_TIMER = 60
export const DEFERRED_CALLBACK_TIMER = 60

// Fade transition not implemented
export const transitions = { SLIDE: 'slide', FADE: 'fade' }

// Light and dark themes not implemented
export const themes = { DEFAULT: 'default', LIGHT: 'light', DARK: 'dark' }

export const messagesTypes = {
  PAGINATION_EVENT: 'PAGINATION_EVENT',
  DEFERRED_EVENT: 'DEFERRED_EVENT',
  CLICK_EVENT: 'CLICK_EVENT',
  KEYDOWN_EVENT: 'KEYDOWN_EVENT',
  NAVIGATION_EVENT: 'NAVIGATION_EVENT',
  DOWNLOAD_EVENT: 'DOWNLOAD_EVENT',
  SCROLL_EVENT: 'SCROLL_EVENT',
}

export const MEDIA_PLAYBACK_RATES = { SLOW: 0.5, NORMAL: 1.0, FAST: 1.5 }
export const MEDIA_CONTROLS_PRESETS = new Set(['simple', 'normal', 'full'])

export const layouts = { SCROLL: 'scroll', COLUMNS: 'columns' }

// CSS declarations for columns on Layout container. 'auto auto' is required
// instead of 1, 1 auto, etc as numeric values tend to break the layout on
// Chrome when using 'layout: scroll' in the project config
export const columns = { ONE: 'auto auto', TWO: '2 auto' }

// Enforce a single column scrolling layout on awkward screen sizes
export const MEDIA_QUERY_MIN_SCROLLING_ASPECT_RATIO = 'only screen and (min-aspect-ratio: 13 / 5)'

// Media queries for various horizontal screen sizes
export const MEDIA_QUERY_MOBILE      = 'only screen and (max-width: 768px)'
export const MEDIA_QUERY_TABLET      = 'only screen and (min-width: 768px) and (max-width: 1140px)'
export const MEDIA_QUERY_DESKTOP     = 'only screen and (min-width: 1140px)'
export const MEDIA_QUERY_DESKTOP_SM  = 'only screen and (min-width: 1140px) and (max-width: 1140px)'
export const MEDIA_QUERY_DESKTOP_MD  = 'only screen and (min-width: 1140px) and (max-width: 1440px)'
export const MEDIA_QUERY_DESKTOP_LG  = 'only screen and (min-width: 1440px) and (max-width: 1920px)'
export const MEDIA_QUERY_DESKTOP_XL  = 'only screen and (min-width: 1920px)'

// Media queries used in DocumentPreProcessor for generated stylesheets
export const MEDIA_QUERY_SCROLLING = 'only screen and (max-width: 1140px), (min-aspect-ratio: 13 / 5)'
export const MEDIA_QUERY_SLIDING   = 'only screen and (min-width: 1140px) and (max-aspect-ratio: 13 / 5)'

/**
 *
 * Breakpoints
 *
 */
export const breakpoints = new Map([
  [
    MEDIA_QUERY_MOBILE,
    {
      maxWidth: '100%',
      maxHeight: 'auto',
      columnGap: '45px',
      columns: columns.ONE,
      paddingLeft: '15px',
      paddingRight: '15px',
      paddingTop: '55px',
      paddingBottom: '80px', // Offset for bottom nav
      fontSize: 'clamp(140%, 1.5vw, 160%)',
    },
  ],
  [
    MEDIA_QUERY_TABLET,
    {
      maxWidth: '738px',
      maxHeight: 'auto',
      columnGap: '45px',
      columns: columns.ONE,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: '55px',
      paddingBottom: '80px', // Offset for bottom nav
      fontSize: 'clamp(150%, 1.5vw, 160%)',
    },
  ],
  [
    MEDIA_QUERY_DESKTOP_SM, // TODO not called? See above
    {
      maxWidth: '900px',
      maxHeight: '500px',
      columnGap: '45px',
      columns: columns.TWO,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      fontSize: '137%', // 21.92px
    },
  ],
  [
    MEDIA_QUERY_DESKTOP_MD,
    {
      maxWidth: '1080px',
      maxHeight: '600px',
      columnGap: '65px',
      columns: columns.TWO,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      fontSize: '130%', // 20.8px
    },
  ],
  [
    MEDIA_QUERY_DESKTOP_LG,
    {
      maxWidth: '1280px',
      maxHeight: '675px',
      columnGap: '80px',
      columns: columns.TWO,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      fontSize: '150%', // 24px
    },
  ],
  [
    MEDIA_QUERY_DESKTOP_XL,
    {
      maxWidth: '1680px',
      maxHeight: '880px',
      columnGap: '125px',
      columns: columns.TWO,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      fontSize: '195%', // 31.2px
    },
  ],
])

