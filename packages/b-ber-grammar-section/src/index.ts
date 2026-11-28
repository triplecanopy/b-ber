import {
  attributesList,
  attributesObject,
  blockEndComment,
  commentLines,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import type { BlockRender } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import plugin from '@canopycanopycanopy/b-ber-parser-section'
import { BLOCK_DIRECTIVES } from '@canopycanopycanopy/b-ber-shapes-directives'

// This matches *all* container-type directives, and outputs the appropriate
// HTML based on user-defined attributes
const containers = Array.from(BLOCK_DIRECTIVES).join('|')

// Treat `exit` like an opening marker
const MARKER_OPEN_RE = new RegExp(
  `^(${containers}|exit)(?::([^\\s]+)(\\s.*)?)?$`
)

const MARKER_CLOSE_RE = /(exit)(?::([^\s]+))?/

// The file `validateOpen` names. Only b-ber-parser-section's plugin calls
// it, which the build no longer registers (TASK-175)
type Context = { fileName?: string }

// A structural block, built whole: its start comment, the <section> with its
// children, and its end comment. Called at the opener, it reads and checks
// the opener's attributes before anything inside the block renders
const render: BlockRender = ({ node, env, h }) => {
  const lineNumber = node.line
  const fileName = `_markdown/${env.document.fileName}.md`
  const marker = node.info.trim()

  // MARKER_CLOSE_RE is unanchored, so an opener with `exit` anywhere in its
  // line is taken for an exit (TASK-174's quirk 2). It draws the close of a
  // block with no id, which fails in `htmlId` when the line has no `exit:id`,
  // and then the block's contents and its close, as it always has
  const tokenClose = marker.match(MARKER_CLOSE_RE)
  if (tokenClose) {
    const stray = blockEndComment(h, tokenClose[2], 'exit')
    return (children, closedBy) =>
      h.fragment([
        h.raw('</section>'),
        stray,
        ...children,
        h.raw('</section>'),
        blockEndComment(h, node.id, closedBy),
      ])
  }

  // The directive rule claims only the lines MARKER_OPEN_RE matches
  const [, type, id, attr] = marker.match(MARKER_OPEN_RE) as RegExpMatchArray

  log.debug(`open directive [${id}]`)

  const start = `START: section:${type}#${htmlId(id)}; ${fileName}:${lineNumber}`
  const attrs = attributesList(
    attributesObject(attr, type, { fileName, lineNumber })
  )

  return (children, closedBy) =>
    h.fragment([
      commentLines(h, start),
      h('section', [['id', htmlId(id)], ...attrs], children),
      blockEndComment(h, id, closedBy),
    ])
}

export default {
  plugin,
  name: 'section',
  renderer: (args: { context?: Context } = {}) =>
    createRenderer({
      ...args,
      markerOpen: MARKER_OPEN_RE,
      markerClose: MARKER_CLOSE_RE,
      render,
    }),
}
