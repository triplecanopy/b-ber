import {
  attributesList,
  attributesObject,
  blockEndComment,
  commentLines,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import {
  type BlockRender,
  type DocumentEnv,
  Html,
} from '@canopycanopycanopy/b-ber-lib'
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

// How a block's close came about, as b-ber-markdown-renderer's directive rule
// decides it: at the block's own `exit`, at an outer block's `exit` that
// crossed it, or at the end of its Markdown container
export type ClosedBy = 'exit' | 'crossed-exit' | 'end'

// A block being closed, from the directive rule's node
export interface ClosingBlock {
  // The directive's name, e.g. `chapter` or `gallery`
  name: string
  id: string
  // The opener's line after the fence, as markdown-it captured it
  info: string
}

// Gallery and spread open more than a <section> where the target has
// full-bleed containers, so their close matches
const isFullbleed = (
  name: string,
  kind: 'gallery' | 'spread',
  env: DocumentEnv
): boolean => name === kind && env.document.target.features.fullbleedContainers

// The markup that closes a block. The block's name used to be looked up in
// `state.cursor` (TASK-175). `comment` is the end comment, which says how the
// block closed, as it always has
function closeMarkup(name: string, comment: string, env: DocumentEnv): string {
  if (isFullbleed(name, 'gallery', env)) {
    // prettier-ignore
    return `</div>
            </figure>
            </div>
            </section>${comment}`
  }

  if (isFullbleed(name, 'spread', env)) {
    return `</div>
            </div>

            ${
              env.document.target.features.readerRuntime
                ? `<!-- Empty node required for spread markers -->
                   <div></div>`
                : ''
            }

            ${comment}`
  }

  return `</section>${comment}`
}

// Closes a block: at its `exit`, or at the outer block's `exit` that crossed
// it, with `section:exit#id`; at the end of its container with `section:#id`.
//
// Every block left open closes at the end of its container (TASK-161). Only a
// structural block with no attributes used to: the id was read from the
// opener's line by splitting it on `:`, so `chapter:c classes:x` read
// `c classes` and matched nothing, and a dialogue, gallery or spread was
// never closed
export function close(
  block: ClosingBlock,
  closedBy: ClosedBy,
  env: DocumentEnv
): string {
  if (closedBy === 'end') {
    return closeMarkup(
      block.name,
      Html.comment(`END: section:#${htmlId(block.id)}`),
      env
    )
  }
  log.debug(`exit directive [${block.id}]`)
  return closeMarkup(
    block.name,
    Html.comment(`END: section:exit#${htmlId(block.id)}`),
    env
  )
}

// A structural block, built whole: its start comment, the <section> with its
// children, and its end comment. Called at the opener, it reads and checks
// the opener's attributes before anything inside the block renders
const render: BlockRender = ({ node, env, h }) => {
  const lineNumber = node.line
  const fileName = `_markdown/${env.document.fileName}.md`
  const marker = node.info.trim()

  // MARKER_CLOSE_RE is unanchored, so an opener with `exit` anywhere in its
  // line is taken for an exit (TASK-174's quirk 2). It draws the close of a
  // block with no id, and fails in `htmlId`, as it always has
  const tokenClose = marker.match(MARKER_CLOSE_RE)
  if (tokenClose) {
    const stray = close(
      { name: '', id: tokenClose[2], info: marker },
      'exit',
      env
    )
    return (children, closedBy) =>
      h.fragment([h.raw(stray), ...children, h.raw(close(node, closedBy, env))])
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
  renderer: (args: { context?: Context } = {}) => ({
    ...createRenderer({
      ...args,
      markerOpen: MARKER_OPEN_RE,
      markerClose: MARKER_CLOSE_RE,
      render,
    }),
    close,
  }),
}
