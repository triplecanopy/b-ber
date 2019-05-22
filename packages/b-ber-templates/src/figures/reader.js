import { media, iframe, figure } from './helpers'

const reader = {
    landscape: data => figure({ data, ratioName: 'landscape', applyInlineClasses: true }),
    portrait: data => figure({ data, ratioName: 'portrait', applyInlineClasses: true }),
    'portrait-high': data => figure({ data, ratioName: 'portrait-high', applyInlineClasses: true }),
    square: data => figure({ data, ratioName: 'square', applyInlineClasses: true }),
    audio: data => media({ ...data }),
    video: data => media({ ...data, applyInlineClasses: true }),
    iframe: data => iframe({ ...data }),
}

export default reader
