import plugin from 'bber-plugins/md/plugins/section'
import renderFactory from 'bber-plugins/md/directives/factory/block'
import { attributes, htmlId } from 'bber-plugins/md/directives/helpers'
import { htmlComment } from 'bber-utils'
import { BLOCK_DIRECTIVES } from 'bber-shapes/directives'

// this matches *all* container-type directives, and outputs the appropriate
// HTML based on user-defined attributes
const containers = BLOCK_DIRECTIVES.join('|')
const markerOpen = new RegExp(`^(${containers})(?::([^\\s]+)(\\s.*)?)?$`)
const markerClose = /(exit)(?::([^\s]+))?/

// since `context` needs to be available in this `render` method, we curry it
// in and pass the resulting function to the `renderFactory` below. we also
// set a default for `context` since we'll need some of its properties during
// testing
const render = ({ context = {} }) => (tokens, idx) => {
  const lineNr = tokens[idx].map ? tokens[idx].map[0] : null
  const filename = `_markdown/${context.filename}.md`

  let result = ''

  if (tokens[idx].nesting === 1) {
    const open = tokens[idx].info.trim().match(markerOpen)
    const close = tokens[idx].info.trim().match(markerClose)

    if (open) {
      // destructure the attributes from matches, omitting `matches[0]` since
      // we're only interested in the captures
      const [, type, id, att] = open
      const comment = htmlComment(`START: section:${type}#${htmlId(id)}; ${filename}:${lineNr}`)
      const attrs = attributes(att, type, { filename, lineNr })
      result = `${comment}<section id="${htmlId(id)}"${attrs}>`
    } else if (close) {
      const [, type, id] = close
      const comment = htmlComment(`END: section:${type}#${htmlId(id)}`)
      result = `</section>${comment}`
    }
  }
  return result
}

export default {
  plugin,
  name: 'section',
  renderer: args =>
    renderFactory({
      ...args,
      markerOpen,
      markerClose,
      render: render(args),
    }),
}
