import {
  attributesList,
  attributesObject,
  blockEndComment,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import type { BlockRender } from '@canopycanopycanopy/b-ber-lib'
import plugin from '@canopycanopycanopy/b-ber-parser-gallery'

// define our open and closing markers, used by the `validateOpen` and
// `validateClose` methods in the `createRenderer`
const MARKER_OPEN_RE = /^(gallery)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /^(exit)(?::([^\s]+))?/

// A gallery, built whole, differently per target:
//
//  fullbleedContainers (web, reader): all assets (images, videos, etc) go in
//      a `fullscreen` container, so that they can be positioned with CSS
//
//  otherwise (epub, mobi, pdf): all assets go in a section.gallery, which is
//      made a slider by JS if available, and otherwise is a sequence of images
//
// The closing markup used to be b-ber-grammar-section's, drawn at the exit
const render: BlockRender = ({ node, env, h }) => {
  // The directive rule claims only the lines MARKER_OPEN_RE matches
  const [, type, id, attrs] = node.info
    .trim()
    .match(MARKER_OPEN_RE) as RegExpMatchArray
  const attributes: [string, string][] = [
    ['id', htmlId(id)],
    ...attributesList(attributesObject(attrs, type)),
  ]

  if (!env.document.target.features.fullbleedContainers) {
    return (children, closedBy) =>
      h.fragment([
        h('section', attributes, children),
        blockEndComment(h, node.id, closedBy),
      ])
  }

  // The markup's own line breaks and indentation, as it was written
  const line = '\n                '
  const closingLine = '\n            '
  return (children, closedBy) =>
    h.fragment([
      line,
      h('section', attributes, [
        line,
        h(
          'div',
          {
            class:
              'figure__large figure__inline figure__fullbleed figure__gallery',
          },
          [
            line,
            h('figure', null, [
              line,
              h('div', { class: 'figure__items' }, children),
              closingLine,
            ]),
            closingLine,
          ]
        ),
        closingLine,
      ]),
      blockEndComment(h, node.id, closedBy),
    ])
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
