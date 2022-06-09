// Speeds to debounce our mutation and resize observer callbacks. making sure
// the document is laid out before rendering in decorate-observable.js
export const RESIZE_DEBOUNCE_TIMER = 60
export const MUTATION_DEBOUNCE_TIMER = 60
export const DEFERRED_CALLBACK_TIMER = 60

export const transitions = {
  SLIDE: 'slide',
  FADE: 'fade',
}

export const themes = {
  DEFAULT: 'default',
  LIGHT: 'light',
  DARK: 'dark',
}

export const messagesTypes = {
  PAGINATION_EVENT: 'PAGINATION_EVENT',
  DEFERRED_EVENT: 'DEFERRED_EVENT',
  CLICK_EVENT: 'CLICK_EVENT',
  KEYDOWN_EVENT: 'KEYDOWN_EVENT',
  NAVIGATION_EVENT: 'NAVIGATION_EVENT',
  DOWNLOAD_EVENT: 'DOWNLOAD_EVENT',
  SCROLL_EVENT: 'SCROLL_EVENT',
}

// Media queries from TC theme. The XL isn't currently used (except for in the
// `LAYOUT_MAX_WIDTH`), may not be necessary
//
//
// Mobile
// $mq-xs: "only screen and (max-width: 768px)";
// Tablet
// $mq-sm: "only screen and (min-width: 769px) and (max-width: 1140px)";
// Desktop 1
// $mq-md: "only screen and (min-width: 1141px) and (max-width: 1440px)";
// Desktop 2
// $mq-lg: "only screen and (min-width: 1441px) and (max-width: 1920px)";
// Desktop 3
// $mq-xl: "only screen and (min-width: 1921px)";

// Media queries horizontal in px
export const BREAKPOINT_HORIZONTAL_SMALL = 900

// Enforce a single column scrolling layout on awkward screen sizes
export const MINIMUM_ONE_COLUMN_ASPECT_RATIO = 13 / 5

// Columns
// export const DESKTOP_COLUMN_COUNT = 16
// export const MOBILE_COLUMN_COUNT = 9

// Used in DocumentPreProcessor for appended stylesheets
// prettier-ignore
export const MEDIA_QUERY_SMALL = `only screen and (min-width: ${BREAKPOINT_HORIZONTAL_SMALL}px)`
// prettier-ignore
export const MEDIA_QUERY_LARGE = `only screen and (max-width: ${BREAKPOINT_HORIZONTAL_SMALL +  1}px)`

export const MEDIA_PLAYBACK_RATES = {
  SLOW: 0.5,
  NORMAL: 1.0,
  FAST: 1.5,
}

export const MEDIA_CONTROLS_PRESETS = new Set(['simple', 'normal', 'full'])

export const layouts = { SCROLL: 'scroll', COLUMNS: 'columns' }

// Media Queries

export const mediaQueryMobile = 'only screen and (max-width: 768px)'
export const mediaQueryTablet =
  'only screen and (min-width: 768px) and (max-width: 1140px)'
export const mediaQueryDesktopSm =
  'only screen and (min-width: 1140px) and (max-width: 1140px)'
export const mediaQueryDesktopMd =
  'only screen and (min-width: 1140px) and (max-width: 1440px)'
export const mediaQueryDesktopLg = 'only screen and (min-width: 1440px)'
export const mediaQueryDesktopXl = 'only screen and (min-width: 1920px)'

/**
 *
 * Horizontal Spacing
 *
 */
export const horizontalBreakpoints = new Map([
  [
    mediaQueryMobile,
    {
      maxWidth: '100%',
      maxHeight: 'auto',
      columnGap: '45px',
      columns: 1,
      paddingLeft: '15px',
      paddingRight: '15px',
      paddingTop: 0,
      paddingBottom: '80px', // Offset for bottom nav
    },
  ],
  [
    mediaQueryTablet,
    {
      maxWidth: '738px',
      maxHeight: 'auto',
      columnGap: '45px',
      columns: 1,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: '80px', // Offset for bottom nav
    },
  ],
  [
    mediaQueryDesktopSm,
    {
      maxWidth: '900px',
      maxHeight: '500px',
      columnGap: '45px',
      columns: 2,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
  ],
  [
    mediaQueryDesktopMd,
    {
      maxWidth: '1080px',
      maxHeight: '720px',
      columnGap: '45px',
      columns: 2,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
  ],
  [
    mediaQueryDesktopLg,
    {
      maxWidth: '1280px',
      maxHeight: '750px',
      columnGap: '45px',
      columns: 2,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
  ],
  [
    mediaQueryDesktopXl,
    {
      maxWidth: '1680px',
      maxHeight: '900px',
      columnGap: '125px',
      columns: 2,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
  ],
])

/**
 *
 * Vertical Spacing
 *
 */
// TODO are these used?
export const verticalBreakpoints = new Map([
  [
    'only screen and (min-height: 500px)',
    [
      {
        maxHeight: '500px',
      },
    ],
  ],
  [
    'only screen and (max-height: 500px)',
    [
      {
        maxHeight: '720px',
      },
    ],
  ],
  [
    'only screen and (max-height: 350px)',
    [
      {
        maxHeight: '750px',
      },
    ],
  ],
])
