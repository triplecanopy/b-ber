import {
  attributesList,
  attributesObject,
  blockEndComment,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import type { BlockRender } from '@canopycanopycanopy/b-ber-lib'
import plugin from '@canopycanopycanopy/b-ber-parser-gallery'

// Define the open and closing markers, used by the `validateOpen` and
// `validateClose` methods in `createRenderer`
const MARKER_OPEN_RE = /^(spread)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /^(exit)(?::([^\s]+))?/

// A spread, built whole, differently per target:
//
//  fullbleedContainers (reader, web): all assets (images, videos, etc) go in
//    a `fullscreen` container, so that they can be positioned with CSS
//
//  otherwise (epub, mobi, pdf): all assets go in a section.spread, which is
//    made a slider by JS if available, and otherwise is a sequence of images
//
// The closing markup used to be b-ber-grammar-section's, drawn at the exit
const render: BlockRender = ({ node, env, h }) => {
  const lineNumber = node.line
  const fileName = `_markdown/${env.document.fileName}.md`
  const location = { fileName, lineNumber }

  // The directive rule claims only the lines MARKER_OPEN_RE matches
  const [, type, id, attrs] = node.info
    .trim()
    .match(MARKER_OPEN_RE) as RegExpMatchArray
  const attributes = attributesList(attributesObject(attrs, type, location))
  const { fullbleedContainers, readerRuntime } = env.document.target.features

  if (!fullbleedContainers) {
    return (children, closedBy) =>
      h.fragment([
        h('section', [['id', htmlId(id)], ...attributes], children),
        blockEndComment(h, node.id, closedBy),
      ])
  }

  // The markup's own line breaks and indentation, as it was written
  return (children, closedBy) =>
    h.fragment([
      '\n        ',
      h('div', attributes, [
        '\n          ',
        h('div', { id: htmlId(id), class: 'spread__content' }, children),
        '\n            ',
      ]),
      '\n\n            ',
      // The reader needs an empty node after a spread for its markers
      ...(readerRuntime
        ? [
            h.comment('Empty node required for spread markers'),
            '\n                   ',
            h('div'),
          ]
        : []),
      '\n\n            ',
      blockEndComment(h, node.id, closedBy),
    ])
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
