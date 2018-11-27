import {
    BREAKPOINT_HORIZONTAL_SMALL,
    BREAKPOINT_HORIZONTAL_MEDIUM,
    BREAKPOINT_HORIZONTAL_LARGE,
    // BREAKPOINT_VERTICAL_SMALL,
    BREAKPOINT_VERTICAL_MEDIUM,
    BREAKPOINT_VERTICAL_LARGE,
} from '../constants'

class Viewport {
    static isMobile() {
        return window.innerWidth <= BREAKPOINT_HORIZONTAL_SMALL
    }

    static isLarge = (value, mult) =>
        (window.innerWidth >= BREAKPOINT_HORIZONTAL_LARGE ||
            window.innerHeight >= BREAKPOINT_VERTICAL_LARGE) &&
        (mult ? value * mult : value)

    static isMedium = (value, mult) =>
        (window.innerWidth <= BREAKPOINT_HORIZONTAL_LARGE ||
            window.innerHeight <= BREAKPOINT_VERTICAL_LARGE) &&
        (mult ? value * mult : value)

    static isSmall = (value, mult) =>
        (window.innerWidth <= BREAKPOINT_HORIZONTAL_MEDIUM ||
            window.innerHeight <= BREAKPOINT_VERTICAL_MEDIUM) &&
        (mult ? value * mult : value)

    // Dynamic dimensions. `min`, `med`, and `max` params are ratios to multiply
    // `value` (probably window.innerWidth/innerHeight) against. Checks against
    // the media queries above and performs corresponding calculations.
    //
    // marginLeft: Viewport.optimize(0.05, 0.07, 0.075, window.innerWidth)
    //
    // will produce (approximately)
    // margin-left: 32px // at small breakpoints
    // margin-left: 67px // at medium breakpoints
    // margin-left: 120px // at large breakpoints
    //
    static optimize = (min, med, max, value) =>
        Viewport.isSmall(value, min) ||
        Viewport.isMedium(value, med) ||
        Viewport.isLarge(value, max)

    // Same as above but with exact values, i.e.,
    //
    // marginLeft: Viewport.exact(30px, 60px, 120px)
    // yields
    //
    // margin-left: 30px // at small breakpoints
    // margin-left: 60px // at medium breakpoints
    // margin-left: 120px // at large breakpoints
    static exact = (min, med, max) =>
        Viewport.isSmall(min) || Viewport.isMedium(med) || Viewport.isLarge(max)
}

export default Viewport
