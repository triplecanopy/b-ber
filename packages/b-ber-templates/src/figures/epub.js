import { media, iframe, figure } from './helpers'

const epub = {
    portrait: data => figure({ data, ratioName: 'portrait' }),
    landscape: data => figure({ data, ratioName: 'landscape' }),
    'portrait-high': data => figure({ data, ratioName: 'portrait-high' }),
    square: data => figure({ data, ratioName: 'square' }),
    audio: data => media({ ...data }),
    video: data => media({ ...data, applyInlineClasses: true }),
    iframe: data => iframe({ ...data }),
}

export default epub
