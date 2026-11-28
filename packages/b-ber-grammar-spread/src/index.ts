import {
  attributesObject,
  attributesString,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import type { DirectiveToken, DocumentEnv } from '@canopycanopycanopy/b-ber-lib'
import plugin from '@canopycanopycanopy/b-ber-parser-gallery'

// Define the open and closing markers, used by the `validateOpen` and
// `validateClose` methods in `createRenderer`
const MARKER_OPEN_RE = /^(spread)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /^(exit)(?::([^\s]+))?/

// The `render` function that gets passed into our `createRenderer` is
// responsible for the HTML output.
const render = (
  tokens: DirectiveToken[],
  index: number,
  _options: unknown,
  env: DocumentEnv
) => {
  const token = tokens[index]
  const info = token.info.trim().match(MARKER_OPEN_RE)

  if (token.nesting !== 1 || !info) return ''

  const lineNumber = token.map ? token.map[0] : null
  const fileName = `_markdown/${env.document.fileName}.md`
  const location = { fileName, lineNumber }

  const [, type, id, attrs] = info
  const attrsObject = attributesObject(attrs, type, location)
  const attrsString = attributesString(attrsObject)

  // Spread directive is handled differently based on the target:
  //
  //  fullbleedContainers (reader, web): Drop all assets (images, videos,
  //    etc) into a `fullscreen` container so that they can be positioned
  //    using custom CSS
  //
  //  otherwise (epub, mobi, pdf): Drop all assets into a section.spread
  //    container that is initialized as a slider via JS if available.
  //    defaults to a simple sequence of images

  if (env.document.target.features.fullbleedContainers) {
    return `
        <div${attrsString}>
          <div id="${htmlId(id)}" class="spread__content">`
  }
  return `<section id="${htmlId(id)}"${attrsString}>`
}

export default {
  plugin,
  name: 'spread',
  renderer: () =>
    createRenderer({
      markerOpen: MARKER_OPEN_RE,
      markerClose: MARKER_CLOSE_RE,
      render,
    }),
}
