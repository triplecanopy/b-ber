import plugin from 'bber-plugins/md/plugins/dialogue'
import renderer from 'bber-plugins/md/directives/factory/block'

const dialogueOpenRegExp = /^(dialogue)(?::([^\s]+)(\s.*)?)?$/
const dialogueCloseRegExp = /(exit)(?::([^\s]+))?/

const render = () => (tokens, idx) => {
  const open = tokens[idx].info.trim().match(dialogueOpenRegExp)
  const close = tokens[idx].info.trim().match(dialogueCloseRegExp)
  if (open) {
    return '\n<section class="dialogue">'
  }

  if (close) {
    return '\n</section>'
  }

  return ''
}

export default {
  plugin,
  name: 'dialogue',
  renderer: refs =>
    renderer(render(refs))(
      refs,
      dialogueOpenRegExp,
      dialogueCloseRegExp
    ),
}
