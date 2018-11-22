/* eslint-disable max-len */

import { figure, media, iframe } from './helpers'

const inlineClasses = (data, ratioName) =>
    (data.classes || '')
        .split(' ')
        .concat(
            'figure__large',
            'figure__inline',
            `figure__inline--${ratioName}`,
        )
        .filter(Boolean)
        .join(' ')

const genericFigure = (data, ratioName) => {
    const figureStyles = ''
    const imageStyles = ''
    const figcaptionStyles = ''
    const classes = inlineClasses(data, ratioName)
    return figure({
        ...data,
        classes,
        figureStyles,
        imageStyles,
        figcaptionStyles,
    })
}

const reader = {
    landscape: data => genericFigure(data, 'landscape'),
    portrait: data => genericFigure(data, 'portrait'),
    'portrait-high': data => genericFigure(data, 'portrait-high'),
    square: data => genericFigure(data, 'square'),
    audio: data => media(data),
    video: data => media(data),
    iframe: data => iframe(data),
}

export default reader
