import state from '@canopycanopycanopy/b-ber-lib/State'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import {
  htmlId,
  attributesObject,
  attributesString,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import plugin from '@canopycanopycanopy/b-ber-parser-gallery'

// Define the open and closing markers, used by the `validateOpen` and
// `validateClose` methods in `createRenderer`
const MARKER_OPEN_RE = /^(spread)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /^(exit)(?::([^\s]+))?/

// The `render` function that gets passed into our `createRenderer` is
// responsible for the HTML output.
const render = ({ context = {} }) => (tokens, index) => {
  const token = tokens[index]
  const info = token.info.trim().match(MARKER_OPEN_RE)

  if (token.nesting !== 1 || !info) return ''

  const lineNumber = token.map ? token.map[0] : null
  const fileName = `_markdown/${context.fileName}.md`
  const location = { fileName, lineNumber }

  const [, type, id, attrs] = info
  const attrsObject = attributesObject(attrs, type, location)
  const attrsString = attributesString(attrsObject)

  // Spread directive is handled differentenly based on build:
  //
  //  reader, web: Drop all assets (images, videos, etc) into a `fullscreen`
  //    container so that they can be positioned using custom CSS
  //
  //  epub, mobi: Drop all assets into a section.spread container that is
  //    initialized as a slider via JS if available. defaults to a simple sequence
  //    of images
  //
  //  pdf: Sequence of images

  switch (state.build) {
    case 'web':
    case 'reader':
      return `
        <div ${attrsString}>
          <div id="${htmlId(id)}" class="spread__content">`
    case 'epub':
    case 'mobi':
    case 'pdf':
    case 'sample':
    default:
      return `<section id="${htmlId(id)}" ${attrsString}>`
  }
}

export default {
  plugin,
  name: 'spread',
  renderer: args =>
    createRenderer({
      ...args,
      markerOpen: MARKER_OPEN_RE,
      markerClose: MARKER_CLOSE_RE,
      render: render(args),
    }),
}
