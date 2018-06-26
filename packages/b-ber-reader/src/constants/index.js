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
}

// single breakpoint set at 960px
export const breakpoints = {
    MOBILE: 960,
}

export const media = {
    MEDIA_QUERY_SMALL: `only screen and (min-width: ${breakpoints.MOBILE}px)`,
    MEDIA_QUERY_LARGE: `only screen and (max-width: ${breakpoints.MOBILE + 1}px)`,
}
