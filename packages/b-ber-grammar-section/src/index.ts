import {
  attributes,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import {
  type DirectiveToken,
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

const render = (
  tokens: DirectiveToken[],
  index: number,
  _options: unknown,
  env: DocumentEnv
) => {
  const token = tokens[index]
  const lineNumber = token.map ? token.map[0] : null
  const fileName = `_markdown/${env.document.fileName}.md`
  const marker = token.info.trim()

  // Closes are drawn by `close`, from the directive rule's node
  if (token.nesting !== 1) return ''

  const tokenClose = marker.match(MARKER_CLOSE_RE)
  const tokenOpen = marker.match(MARKER_OPEN_RE)

  // MARKER_CLOSE_RE is unanchored, so an opener with `exit` anywhere in its
  // line is taken for an exit (TASK-174's quirk 2). It draws the close of a
  // block with no id, and fails in `htmlId`, as it always has
  if (tokenClose)
    return close({ name: '', id: tokenClose[2], info: marker }, 'exit', env)

  // `validateOpen` has already matched this marker against MARKER_OPEN_RE,
  // so a non-exit token always matches here
  return openElement(tokenOpen!, fileName, lineNumber)
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
