import {
  attributes,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import { Html, State as state } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import plugin from '@canopycanopycanopy/b-ber-parser-section'
import { BLOCK_DIRECTIVES } from '@canopycanopycanopy/b-ber-shapes-directives'
import find from 'lodash/find'

// This matches *all* container-type directives, and outputs the appropriate
// HTML based on user-defined attributes
const containers = Array.from(BLOCK_DIRECTIVES).join('|')

// Treat `exit` like an opening marker
const MARKER_OPEN_RE = new RegExp(
  `^(${containers}|exit)(?::([^\\s]+)(\\s.*)?)?$`
)

const MARKER_CLOSE_RE = /(exit)(?::([^\s]+))?/

// What `createRenderer` stores in `state.cursor` for each open directive
type CursorEntry = { id: string; type: string }
type Context = { fileName?: string }

// The fields of markdown-it's `Token` this renderer reads. Declared locally
// because this package does not depend on markdown-it, and importing its types
// makes tsdown inline all of them into the published .d.ts
type Token = { info: string; nesting: number; map: [number, number] | null }

// `context` must be available in this `render` method and is passed
// into `createRenderer` below. Default for `context` is set for use
// during tests

function isGallery(directive: CursorEntry | undefined) {
  return (
    directive &&
    directive.type === 'gallery' &&
    (state.build === 'web' || state.build === 'reader')
  )
}

function isSpread(directive: CursorEntry | undefined) {
  return (
    directive &&
    directive.type === 'spread' &&
    (state.build === 'web' || state.build === 'reader')
  )
}

function handleExitDirective(token: RegExpMatchArray) {
  const [, type, id] = token

  // b-ber-logger types `debug` as nullary, but every caller passes a message
  // biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
  ;(log.debug as any)(`exit directive [${id}]`)

  const comment = Html.comment(`END: section:${type}#${htmlId(id)}`)
  const directive = find(state.cursor, { id }) as CursorEntry | undefined

  state.remove('cursor', { id })

  if (isGallery(directive)) {
    // prettier-ignore
    return `</div>
            </figure>
            </div>
            </section>${comment}`
  }

  if (isSpread(directive)) {
    return `</div>
            </div>

            ${
              state.build === 'reader'
                ? `<!-- Empty node required for spread markers -->
                   <div></div>`
                : ''
            }

            ${comment}`
  }

  return `</section>${comment}`
}

function openElement(
  token: RegExpMatchArray,
  fileName: string,
  lineNumber: number | null
) {
  // Destructure the attributes from matches, omitting `matches[0]` since
  // we're only interested in the captures
  const [, type, id, attr] = token

  // biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
  ;(log.debug as any)(`open directive [${id}]`)

  const comment = Html.comment(
    `START: section:${type}#${htmlId(id)}; ${fileName}:${lineNumber}`
  )

  const attrs = attributes(attr, type, { fileName, lineNumber })
  return `${comment}<section id="${htmlId(id)}"${attrs}>`
}

function closeElement(marker: string) {
  // tokens `nesting` prop is -1. we should be closing the html element
  // here, but probably have done so above since we're treating `exit`
  // directives as openers. check to see if the element has in fact been
  // closed

  const token = marker.split(':')
  if (token.length < 2) return ''

  const [, id] = token
  if (!state.contains('cursor', { id })) return ''

  // its id still exists in state, so it's open. force close here
  const comment = Html.comment(`END: section:#${htmlId(id)}`)
  const result = `</section>${comment}`

  // remove the id
  state.remove('cursor', { id })

  return result
}

const render =
  ({ context = {} }: { context?: Context }) =>
  (tokens: Token[], index: number) => {
    const token = tokens[index]
    const lineNumber = token.map ? token.map[0] : null
    const fileName = `_markdown/${context.fileName}.md`
    const marker = token.info.trim()

    if (token.nesting !== 1) return closeElement(marker)

    // token open, we ignore closing tokens and let `exit` handle those
    const tokenClose = marker.match(MARKER_CLOSE_RE)
    const tokenOpen = marker.match(MARKER_OPEN_RE)

    return tokenClose
      ? handleExitDirective(tokenClose)
      : // `validateOpen` has already matched this marker against
        // MARKER_OPEN_RE, so a non-exit token always matches here
        openElement(tokenOpen!, fileName, lineNumber)
  }

export default {
  plugin,
  name: 'section',
  renderer: (args: { context?: Context }) =>
    createRenderer({
      ...args,
      markerOpen: MARKER_OPEN_RE,
      markerClose: MARKER_CLOSE_RE,
      render: render(args),
    }),
}
