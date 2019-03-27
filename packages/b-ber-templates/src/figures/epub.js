import { media, iframe, figure } from './helpers'

const epub = {
    portrait: data =>
        figure({
            data,
            ratioName: 'portrait',
            figureStyles: {
                width: '70%',
                margin: '0 auto',
            },
            imageStyles: {
                width: '100%',
                'max-width': '100%',
                height: 'auto',
            },
            figcaptionStyles: {
                width: '100%',
                'max-width': '100%',
                height: 'auto',
            },
        }),

    landscape: data =>
        figure({
            data,
            ratioName: 'landscape',
            figureStyles: {},
            imageStyles: {
                'max-width': '100%',
            },
            figcaptionStyles: {
                'max-width': '100%',
            },
        }),

    'portrait-high': data =>
        figure({
            data,
            ratioName: 'portrait-high',
            figureStyles: {
                width: '60%',
                margin: '0 auto',
            },
            imageStyles: {
                width: '100%',
                'max-width': '100%',
                height: 'auto',
            },
            figcaptionStyles: {
                width: '100%',
                'max-width': '100%',
                height: 'auto',
            },
        }),

    square: data =>
        figure({
            data,
            ratioName: 'square',
            figureStyles: {
                width: '85%',
                margin: '0 auto',
            },
            imageStyles: {
                width: '100%',
                'max-width': '100%',
                height: 'auto',
            },
            figcaptionStyles: {
                width: '100%',
                'max-width': '100%',
                height: 'auto',
            },
        }),

    audio: data => media(data),
    video: data => media(data),
    iframe: data => iframe(data),
}

export default epub
