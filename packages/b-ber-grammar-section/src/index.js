import find from 'lodash.find'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { Html } from '@canopycanopycanopy/b-ber-lib'
import { BLOCK_DIRECTIVES } from '@canopycanopycanopy/b-ber-shapes-directives'
import log from '@canopycanopycanopy/b-ber-logger'
import plugin from '@canopycanopycanopy/b-ber-parser-section'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import {
  attributes,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'

// this matches *all* container-type directives, and outputs the appropriate
// HTML based on user-defined attributes
const containers = BLOCK_DIRECTIVES.join('|')
const MARKER_OPEN_RE = new RegExp(
  `^(${containers}|exit)(?::([^\\s]+)(\\s.*)?)?$`
) // treat `exit` like an opening marker since we're using it as such
const MARKER_CLOSE_RE = /(exit)(?::([^\s]+))?/

// since `context` needs to be available in this `render` method, we curry it
// in and pass the resulting function to the `createRenderer` below. we also
// set a default for `context` since we'll need some of its properties during
// testing

function isGallery(directive) {
  return (
    directive &&
    directive.type === 'gallery' &&
    (state.build === 'web' || state.build === 'reader')
  )
}

function isSpread(directive) {
  return (
    directive &&
    directive.type === 'spread' &&
    (state.build === 'web' || state.build === 'reader')
  )
}

function handleExitDirective(token) {
  const [, type, id] = token

  log.debug(`exit directive [${id}]`)

  const comment = Html.comment(`END: section:${type}#${htmlId(id)}`)
  const directive = find(state.cursor, { id })

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
            </div>${comment}`
  }

  return `</section>${comment}`
}

function openElement(token, fileName, lineNumber) {
  // destructure the attributes from matches, omitting `matches[0]` since
  // we're only interested in the captures
  const [, type, id, attr] = token

  log.debug(`open directive [${id}]`)

  const comment = Html.comment(
    `START: section:${type}#${htmlId(id)}; ${fileName}:${lineNumber}`
  )

  const attrs = attributes(attr, type, { fileName, lineNumber })
  return `${comment}<section id="${htmlId(id)}"${attrs}>`
}

function closeElement(marker) {
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

const render = ({ context = {} }) => (tokens, index) => {
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
    : openElement(tokenOpen, fileName, lineNumber)
}

export default {
  plugin,
  name: 'section',
  renderer: args =>
    createRenderer({
      ...args,
      markerOpen: MARKER_OPEN_RE,
      markerClose: MARKER_CLOSE_RE,
      render: render(args),
    }),
}
