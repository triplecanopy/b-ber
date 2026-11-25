import {
  attributesObject,
  attributesString,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import {
  type DirectiveToken,
  State as state,
} from '@canopycanopycanopy/b-ber-lib'
import plugin from '@canopycanopycanopy/b-ber-parser-gallery'

// define our open and closing markers, used by the `validateOpen` and
// `validateClose` methods in the `createRenderer`
const MARKER_OPEN_RE = /^(gallery)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /^(exit)(?::([^\s]+))?/

// a simple `render` function that gets passed into our `createRenderer` is
// responsible for the HTML output.
const render = (tokens: DirectiveToken[], idx: number) => {
  const token = tokens[idx].info.trim().match(MARKER_OPEN_RE)

  if (tokens[idx].nesting !== 1 || !token) return ''

  const [, type, id, attrs] = token
  const attrsObject = attributesObject(attrs, type)
  const attrsString = attributesString(attrsObject)

  // gallery directive is handled differentenly based on build:

  //  fullbleedContainers (web, reader): drop all assets (images, videos,
  //      etc) into a `fullscreen` container so that they can be positioned
  //      using custom CSS

  //  otherwise (epub, mobi, pdf): drop all assets into a section.gallery
  //      container that is initialized as a slider via JS if available.
  //      defaults to a simple sequence of images

  if (state.target.features.fullbleedContainers) {
    return `
                <section id="${htmlId(id)}" ${attrsString}>
                <div class="figure__large figure__inline figure__fullbleed figure__gallery">
                <figure>
                <div class="figure__items">`
  }
  return `<section id="${htmlId(id)}" ${attrsString}>`
}

export default {
  plugin,
  name: 'gallery',
  renderer: (args: { context?: { fileName?: string } }) =>
    createRenderer({
      ...args,
      markerOpen: MARKER_OPEN_RE,
      markerClose: MARKER_CLOSE_RE,
      render,
    }),
}
