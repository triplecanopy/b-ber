import {
  attributes,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import plugin from '@canopycanopycanopy/b-ber-parser-dialogue'

// define our open and closing markers, used by the `validateOpen` and
// `validateClose` methods in the `createRenderer`
const MARKER_OPEN_RE = /^(dialogue)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /^(exit)(?::([^\s]+))?/

// The fields of markdown-it's `Token` this renderer reads. Declared locally
// because this package does not depend on markdown-it, and importing its types
// makes tsdown inline all of them into the published .d.ts
type Token = { info: string; nesting: number }

function handleOpen(token: RegExpMatchArray) {
  const [, type, id, attrs] = token
  const attrsString = attributes(attrs, type)
  return `<section id="${htmlId(id)}" ${attrsString}>`
}

function handleClose() {
  return '</section>'
}

// a simple `render` function that gets passed into our `createRenderer` is
// responsible for the HTML output.
const render = (tokens: Token[], idx: number) => {
  if (tokens[idx].nesting !== 1) return ''

  const marker = tokens[idx].info.trim()
  const tokenOpen = marker.match(MARKER_OPEN_RE)

  return tokenOpen ? handleOpen(tokenOpen) : handleClose()
}

export default {
  plugin,
  name: 'dialogue',
  renderer: (args: { context?: { fileName?: string } }) =>
    createRenderer({
      ...args,
      markerOpen: MARKER_OPEN_RE,
      markerClose: MARKER_CLOSE_RE,
      render,
    }),
}
