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

export const BREAKPOINT_HORIZONTAL_SMALL = 680
export const BREAKPOINT_HORIZONTAL_MEDIUM = 960
export const BREAKPOINT_HORIZONTAL_LARGE = 1590

export const BREAKPOINT_VERTICAL_SMALL = 320
export const BREAKPOINT_VERTICAL_MEDIUM = 480
export const BREAKPOINT_VERTICAL_LARGE = 860

// Media queries
export const MEDIA_QUERY_SMALL = `only screen and (min-width: ${BREAKPOINT_HORIZONTAL_SMALL}px)`
export const MEDIA_QUERY_LARGE = `only screen and (max-width: ${BREAKPOINT_HORIZONTAL_SMALL +
    1}px)`
