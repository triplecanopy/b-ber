import { media, unsupported, figure } from './helpers'

const mobi = {
  portrait: data => figure({ data, ratioName: 'portrait', linkImages: false }),
  landscape: data =>
    figure({ data, ratioName: 'landscape', linkImages: false }),
  'portrait-high': data =>
    figure({ data, ratioName: 'portrait-high', linkImages: false }),
  square: data => figure({ data, ratioName: 'square', linkImages: false }),
  audio: data => media({ ...data, applyInlineClasses: true }),
  video: data => media({ ...data, applyInlineClasses: true }),
  iframe: data => unsupported({ data, applyInlineClasses: true }),
  vimeo: data => unsupported({ data, applyInlineClasses: true }),
}

export default mobi
