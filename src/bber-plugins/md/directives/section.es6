import plugin from 'bber-plugins/md/plugins/section'
import renderer from 'bber-plugins/md/directives/factory/block'
import { attributes, htmlId } from 'bber-plugins/md/directives/helpers'
import { htmlComment } from 'bber-utils'
import { BLOCK_DIRECTIVES } from 'bber-shapes/directives'

const containers = BLOCK_DIRECTIVES.join('|')
const containerOpenRegExp = new RegExp(`^(${containers})(?::([^\\s]+)(\\s.*)?)?$`)
// matching `exit` tag generated dynamically based on opening tag `id` in factory/block#validateClose
const containerCloseRegExp = /(exit)(?::([^\s]+))?/

const render = ({ context }) => (tokens, idx) => {
  let result = ''
  let attrs = ''
  let id, type, att, startComment, endComment

  const lineNr = tokens[idx].map ? tokens[idx].map[0] : null
  const filename = `_markdown/${context.filename}.md`

  if (tokens[idx].nesting === 1) { // built-in open, used for both `section` and `exit`
    const open = tokens[idx].info.trim().match(containerOpenRegExp)
    const close = tokens[idx].info.trim().match(containerCloseRegExp)

    if (open) { // is section directive
      type = open[1]
      id = open[2]
      att = open[3]
      startComment = htmlComment(`START: section:${type}#${htmlId(id)}; ${filename}:${lineNr}`)
      attrs = attributes(att, type, { filename, lineNr })
      result = `${startComment}<section id="${htmlId(id)}"${attrs}>`
    } else if (close) {
      type = close[1]
      id = close[2]
      endComment = htmlComment(`END: section:${type}#${htmlId(id)}`)
      result = `</section>${endComment}`
    }
  }

  return result
}

export default {
  plugin,
  name: 'section',
  renderer: refs =>
    renderer(render(refs))(
      refs,
      containerOpenRegExp,
      containerCloseRegExp
    )
}
