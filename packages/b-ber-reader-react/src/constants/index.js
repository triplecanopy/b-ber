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
export const BREAKPOINT_HORIZONTAL_SMALL = 768
export const BREAKPOINT_HORIZONTAL_MEDIUM = 769
export const BREAKPOINT_HORIZONTAL_LARGE = 1141
export const BREAKPOINT_HORIZONTAL_X_LARGE = 1441

// Media queries vertical in px
export const BREAKPOINT_VERTICAL_SMALL = 480
export const BREAKPOINT_VERTICAL_MEDIUM = 768
export const BREAKPOINT_VERTICAL_LARGE = 860

// Max horizontal and vertical dimensions
export const LAYOUT_MAX_HEIGHT = 480
export const LAYOUT_MAX_WIDTH = 1921

// Columns
export const DESKTOP_COLUMN_COUNT = 16
export const MOBILE_COLUMN_COUNT = 9

// Number of breakpoints
export const HORIZONTAL_BREAKPOINT_COUNT = 4
export const VERTICAL_BREAKPOINT_COUNT = 3

// The padding for each of the combinations of the horizontal and vertical
// values is set by declaring the top, right, bottom, and left values in each
// of the boxes in the grid below:
//
//        Sm. X     Med. X   Lg. X    Xl. X
//      |---------|--------|--------|--------|
//      |         |        |        |        |
//      |    1    |   2    |   3    |   4    | Sm. Y
//      |         |        |        |        |
//      |---------|--------|--------|--------|
//      |         |        |        |        |
//      |    5    |   6    |   7    |   8    | Md. Y
//      |         |        |        |        |
//      |---------|--------|--------|--------|
//      |         |        |        |        |
//      |    9    |   10   |   11   |   12   | Lg. Y
//      |         |        |        |        |
//      |---------|--------|--------|--------|
//

// Where box 1 represents the smallest of both horizontal and vertical media
// queries, and box 9 the largest.
//
// In CSS, box 1 would look like
// @media (max-width: 768px and max-height: 480px) {}

// Box 7 would look like
// @media (max-width: 768px and min-height: 860px) {}

// Box 9 would look like
// @media (min-width: 1290px and min-height: 860px) {}

// Each box contains four values for the padding of the element, in typical CSS
// style (top, right, bottom, left). Each value is a number representing a
// percentage. The following would add 30% padding to the top and bottom of the
// reader's frame, and 15% padding to each side:
//
// [ 30, 15, 30, 15 ]
//
// The value 'auto' is also accepted. When used for a vertical value, it will
// cause the reader's frame to become fixed at a pre-determined size, i.e.,
// LAYOUT_MAX_WIDTH and LAYOUT_MAX_HEIGHT, both declared above.
//
// When 'auto' is used for a horizontal value, it will add one column + one
// gutter width of padding to the reader's frame.
//
// [ 'auto', 30, 'auto', 30 ]
// [ 'auto', 'auto', 'auto', 'auto' ]
// [ 15, 'auto', 30, 'auto' ]
//
// Values in px are also accepted, and must be passed in as a string. The
// following would add 30px to the top and bottom of the reader's frame
//
// ['30px', 'auto', '30px', 'auto']

// prettier-ignore
export const VIEWPORT_DIMENSIONS_MATRIX = [
  ['75px', '15px', '60px', '15px'], [18, 'auto', 15, 'auto'], [22, 'auto', 18, 'auto'], [22, 'auto', 18, 'auto'], // => sm x sm | md x sm | lg x sm | xl x sm
  ['75px', '15px', '60px', '15px'], [12, 'auto', 8, 'auto'],  [12, 'auto', 9, 'auto'],  [12, 'auto', 9, 'auto'],  // => sm x md | md x md | lg x md | xl x md
  ['75px', '15px', '60px', '15px'], [11, 'auto', 8, 'auto'],  [11, 'auto', 8, 'auto'],  [11, 'auto', 8, 'auto']   // => sm x lg | md x lg | lg x lg | xl x lg
]

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
