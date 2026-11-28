import {
  attributesList,
  attributesObject,
  blockEndComment,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import type { BlockRender } from '@canopycanopycanopy/b-ber-lib'
import plugin from '@canopycanopycanopy/b-ber-parser-dialogue'

// define our open and closing markers, used by the `validateOpen` and
// `validateClose` methods in the `createRenderer`
const MARKER_OPEN_RE = /^(dialogue)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /^(exit)(?::([^\s]+))?/

// A dialogue, built whole: the <section> with its speaker lines, and the
// comment that says how it closed
const render: BlockRender = ({ node, h }) => {
  const marker = node.info.trim()
  // The directive rule claims only the lines MARKER_OPEN_RE matches
  const [, type, id, attrs] = marker.match(MARKER_OPEN_RE) as RegExpMatchArray
  const attributes = attributesList(attributesObject(attrs, type))

  return (children, closedBy) =>
    h.fragment([
      h('section', [['id', htmlId(id)], ...attributes], children),
      blockEndComment(h, node.id, closedBy),
    ])
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
