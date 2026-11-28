import {
  attributes,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import {
  type DirectiveToken,
  Html,
  type RendererContext,
  State as state,
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

// Optional so the tests can render without a file
type Context = Partial<RendererContext>

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
const isFullbleed = (name: string, kind: 'gallery' | 'spread'): boolean =>
  name === kind && state.target.features.fullbleedContainers

// The markup that closes a block at its `exit`, or at the outer block's `exit`
// that crossed it. The block's name used to be looked up in `state.cursor`
// (TASK-175)
function closeAtExit(name: string, id: string): string {
  log.debug(`exit directive [${id}]`)

  const comment = Html.comment(`END: section:exit#${htmlId(id)}`)

  if (isFullbleed(name, 'gallery')) {
    // prettier-ignore
    return `</div>
            </figure>
            </div>
            </section>${comment}`
  }

  if (isFullbleed(name, 'spread')) {
    return `</div>
            </div>

            ${
              state.target.features.readerRuntime
                ? `<!-- Empty node required for spread markers -->
                   <div></div>`
                : ''
            }

            ${comment}`
  }

  return `</section>${comment}`
}

// What was drawn at the end of the range of a structural block left open. The
// id is read from the opener's line by splitting it on `:`, as it always was,
// so an opener with attributes (`chapter:c classes:x`) reads `c classes`,
// matches the block's id, and draws nothing (TASK-174's quirk 3)
function closeAtEnd(info: string, id: string): string {
  const token = info.trim().split(':')
  if (token.length < 2 || token[1] !== id) return ''
  return `</section>${Html.comment(`END: section:#${htmlId(id)}`)}`
}

// The markup that closes a block. A dialogue, gallery or spread left open was
// never closed
export function close(block: ClosingBlock, closedBy: ClosedBy): string {
  if (closedBy !== 'end') return closeAtExit(block.name, block.id)
  return BLOCK_DIRECTIVES.has(block.name)
    ? closeAtEnd(block.info, block.id)
    : ''
}

function openElement(
  token: RegExpMatchArray,
  fileName: string,
  lineNumber: number | null
) {
  // Destructure the attributes from matches, omitting `matches[0]` since
  // we're only interested in the captures
  const [, type, id, attr] = token

  log.debug(`open directive [${id}]`)

  const comment = Html.comment(
    `START: section:${type}#${htmlId(id)}; ${fileName}:${lineNumber}`
  )

  const attrs = attributes(attr, type, { fileName, lineNumber })
  return `${comment}<section id="${htmlId(id)}"${attrs}>`
}

const render =
  ({ context = {} }: { context?: Context }) =>
  (tokens: DirectiveToken[], index: number) => {
    const token = tokens[index]
    const lineNumber = token.map ? token.map[0] : null
    const fileName = `_markdown/${context.fileName}.md`
    const marker = token.info.trim()

    // Closes are drawn by `close`, from the directive rule's node
    if (token.nesting !== 1) return ''

    const tokenClose = marker.match(MARKER_CLOSE_RE)
    const tokenOpen = marker.match(MARKER_OPEN_RE)

    // MARKER_CLOSE_RE is unanchored, so an opener with `exit` anywhere in its
    // line is taken for an exit (TASK-174's quirk 2). It draws the close of a
    // block with no id, and fails in `htmlId`, as it always has
    if (tokenClose) return closeAtExit('', tokenClose[2])

    // `validateOpen` has already matched this marker against MARKER_OPEN_RE,
    // so a non-exit token always matches here
    return openElement(tokenOpen!, fileName, lineNumber)
  }

export default {
  plugin,
  name: 'section',
  renderer: (args: { context?: Context }) => ({
    ...createRenderer({
      ...args,
      markerOpen: MARKER_OPEN_RE,
      markerClose: MARKER_CLOSE_RE,
      render: render(args),
    }),
    close,
  }),
}
