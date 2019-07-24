import { media, iframe, figure } from './helpers'

const mobi = {
    portrait: data => figure({ data, ratioName: 'portrait', linkImages: false }),
    landscape: data => figure({ data, ratioName: 'landscape', linkImages: false }),
    'portrait-high': data => figure({ data, ratioName: 'portrait-high', linkImages: false }),
    square: data => figure({ data, ratioName: 'square', linkImages: false }),
    audio: data => media({ ...data }),
    video: data => media({ ...data, applyInlineClasses: true }),
    iframe: data => iframe({ ...data }),
}

export default mobi
