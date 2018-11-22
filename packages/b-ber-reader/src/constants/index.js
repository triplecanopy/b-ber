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
}

// TODO: rename/clean these up

// Single breakpoint set at 960px
const MOBILE = 960
const XLARGE = 1590
const TALL = 860

export const breakpoints = { MOBILE, XLARGE, TALL }

// Media queries
export const MEDIA_QUERY_SMALL = `only screen and (min-width: ${MOBILE}px)`
export const MEDIA_QUERY_LARGE = `only screen and (max-width: ${MOBILE + 1}px)`
