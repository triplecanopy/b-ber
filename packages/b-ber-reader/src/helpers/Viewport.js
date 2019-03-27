/* eslint-disable prettier/prettier */

import head from 'lodash/head'

import {
    BREAKPOINT_HORIZONTAL_SMALL,
    BREAKPOINT_HORIZONTAL_LARGE,
    BREAKPOINT_VERTICAL_SMALL,
    BREAKPOINT_VERTICAL_LARGE,
    LAYOUT_MAX_HEIGHT,
    LAYOUT_MAX_WIDTH,
    VIEWPORT_DIMENSIONS_MATRIX,
    DESKTOP_COLUMN_COUNT,
    MOBILE_COLUMN_COUNT,
} from '../constants'

import { isNumeric } from '../helpers/Types'

class Viewport {
    // used to get position X in matrix
    static horizontalSmall = () => window.innerWidth <= BREAKPOINT_HORIZONTAL_SMALL
    static horizontalMedium = () => window.innerWidth > BREAKPOINT_HORIZONTAL_SMALL && window.innerWidth < BREAKPOINT_HORIZONTAL_LARGE
    static horizontalLarge = () => window.innerWidth >= BREAKPOINT_HORIZONTAL_LARGE

    // used to get position Y in matrix
    static verticalSmall = () => window.innerHeight <= BREAKPOINT_VERTICAL_SMALL
    static verticalMedium = () => window.innerHeight > BREAKPOINT_VERTICAL_SMALL && window.innerHeight < BREAKPOINT_VERTICAL_LARGE
    static verticalLarge = () => window.innerHeight >= BREAKPOINT_VERTICAL_LARGE

    // utility breakpoint
    static isMobile = () => Viewport.horizontalSmall()

    static getBreakpointX = () => {
        if (Viewport.horizontalSmall()) return 0
        if (Viewport.horizontalMedium()) return 1
        if (Viewport.horizontalLarge()) return 2
    }
    static getBreakpointY = () => {
        if (Viewport.verticalSmall()) return 0
        if (Viewport.verticalMedium()) return 1
        if (Viewport.verticalLarge()) return 2
    }

    static getBreakpointXY = () => [
        Viewport.getBreakpointX(),
        Viewport.getBreakpointY(),
    ]

    static getColumnCount = () =>
        Viewport.isMobile() ? MOBILE_COLUMN_COUNT : DESKTOP_COLUMN_COUNT

    // flexible columns, flexible gutters.
    // gutter is hard-coded to be 20% of a column's width
    static getGutterWidth = () =>
        (35 / (Viewport.getColumnCount() - 1) / 100) * window.innerWidth
    static getColumnWidth = () =>
        (65 / Viewport.getColumnCount() / 100) * window.innerWidth

    static getHorizontalSpacingAuto = () => {
        const width = window.innerWidth
        const padding = Viewport.getColumnWidth() + Viewport.getGutterWidth()
        return width - padding * 2 > LAYOUT_MAX_WIDTH
            ? (width - LAYOUT_MAX_WIDTH) / 2
            : padding
    }
    static getVerticalSpacingAuto = () =>
        (window.innerHeight - LAYOUT_MAX_HEIGHT) / 2

    static getPixelValue = str => {
        if (str.substring(str.length - 2) !== 'px') {
            return console.error(
                'Unsupported value provided for reader position:',
                str,
            )
        }

        return parseInt(str, 10)
    }

    static getVerticalValueFromString = str => {
        const str_ = str.trim().toLowerCase()
        return str_ === 'auto'
            ? Viewport.getVerticalSpacingAuto()
            : Viewport.getPixelValue(str_)
    }

    static getHorizontalValueFromString = str => {
        const str_ = str.trim().toLowerCase()
        return str_ === 'auto'
            ? Viewport.getHorizontalSpacingAuto()
            : Viewport.getPixelValue(str_)
    }

    static getVerticalSpacing = (top, bottom) => ({
        top: isNumeric(top)
            ? window.innerHeight * (top / 100)
            : Viewport.getVerticalValueFromString(top),
        bottom: isNumeric(bottom)
            ? window.innerHeight * (bottom / 100)
            : Viewport.getVerticalValueFromString(bottom),
    })

    static getHorizontalSpacing = (left, right) => ({
        left: isNumeric(left)
            ? window.innerWidth * (left / 100)
            : Viewport.getHorizontalValueFromString(left),
        right: isNumeric(right)
            ? window.innerWidth * (right / 100)
            : Viewport.getHorizontalValueFromString(right),
    })

    static getDimensions = ([x, y]) =>
        head(
            VIEWPORT_DIMENSIONS_MATRIX.filter((_, i) => (i % 3) - x === 0)
                .filter((_, i) => (i % 3) - y === 0)
                .map(([top, right, bottom, left]) => ({
                    ...Viewport.getVerticalSpacing(top, bottom),
                    ...Viewport.getHorizontalSpacing(left, right),
                })),
        )

    static getDimensionsFromMatrix = () =>
        Viewport.getDimensions(Viewport.getBreakpointXY())

    static optimized = () => Viewport.getDimensionsFromMatrix()
}

export default Viewport
