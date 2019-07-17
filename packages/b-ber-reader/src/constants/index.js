// speeds to debounce our mutation and resize observer callbacks. making sure
// the document is laid out before rendering in decorate-observable.js
export const ENSURE_RENDER_TIMEOUT = 200
export const DEBOUNCE_TIMER = 200

// used for calling deferred pagination events in decorate-deferrable.js
export const DEFERRED_CALLBACK_TIMER = 200

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
}

// Media queries horizontal in px
export const BREAKPOINT_HORIZONTAL_SMALL = 768
export const BREAKPOINT_HORIZONTAL_MEDIUM = 960
export const BREAKPOINT_HORIZONTAL_LARGE = 1290

// Media queries vertical in px
export const BREAKPOINT_VERTICAL_SMALL = 480
export const BREAKPOINT_VERTICAL_MEDIUM = 768
export const BREAKPOINT_VERTICAL_LARGE = 860

// Max horizontal and vertical dimensions
export const LAYOUT_MAX_HEIGHT = 480
export const LAYOUT_MAX_WIDTH = 1440

// Columns
export const DESKTOP_COLUMN_COUNT = 16
export const MOBILE_COLUMN_COUNT = 9

// The padding for each of the combinations of the horizontal and vertical
// values is set by declaring the top, right, bottom, and left values in each
// of the boxes in the grid below:
//
//        Sm. X     Med. X   Lg. X
//      |---------|--------|--------|
//      |         |        |        |
//      |    1    |   2    |   3    | Sm. Y
//      |         |        |        |
//      |---------|--------|--------|
//      |         |        |        |
//      |    4    |   5    |   6    | Md. Y
//      |         |        |        |
//      |---------|--------|--------|
//      |         |        |        |
//      |    7    |   8    |   9    | Lg. Y
//      |         |        |        |
//      |---------|--------|--------|
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
    ['60px', '30px', '60px', '30px'], [18, 'auto', 15, 'auto'], [22, 'auto', 18, 'auto'], // => sm x sm, md x sm, lg x sm
    ['60px', '30px', '60px', '30px'], [15, 'auto', 10, 'auto'], [15, 'auto', 10, 'auto'], // => sm x md, md x md, lg x md
    ['60px', '30px', '60px', '30px'], [30, 'auto', 20, 'auto'], [15, 'auto', 10, 'auto'], // => sm x lg, md x lg, lg x lg
]

// used in DocumentPreProcessor for appended stylesheets
export const MEDIA_QUERY_SMALL = `only screen and (min-width: ${BREAKPOINT_HORIZONTAL_SMALL}px)`
export const MEDIA_QUERY_LARGE = `only screen and (max-width: ${BREAKPOINT_HORIZONTAL_SMALL + 1}px)`
