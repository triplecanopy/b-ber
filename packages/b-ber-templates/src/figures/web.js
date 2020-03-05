import { media, iframe, figure, vimeo } from './helpers'

const web = {
  portrait: data => figure({ data, ratioName: 'portrait' }),
  landscape: data => figure({ data, ratioName: 'landscape' }),
  'portrait-high': data => figure({ data, ratioName: 'portrait-high' }),
  square: data => figure({ data, ratioName: 'square' }),
  audio: data => media({ ...data, applyInlineClasses: true }),
  video: data => media({ ...data, applyInlineClasses: true }),
  iframe: data => iframe({ ...data, applyInlineClasses: true }),
  vimeo: data => vimeo({ ...data, applyInlineClasses: true }),
}

export default web
