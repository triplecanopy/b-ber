
/*

@type: section
@usage: ::: section <type> <title> [classes]
[content]
:::
@output: <section epub:type="chapter" title="The Chapter Title" class="chapter"> ... </section>

*/

import markdownItContainer from 'markdown-it-container'

const regex = /^section\s+['"]?([^\s'"]+)['"]?\s+['"]?([^'"\n]+)['"]?(?:\s+['"]?([^\n'"]+)['"]?)?$/

export default {
  plugin: markdownItContainer,
  name: 'section',
  renderer: instance => ({
    validate(params) {
      return params.trim().match(regex)
    },
    render(tokens, idx) {
      const { escapeHtml } = instance.utils
      const matches = tokens[idx].info.trim().match(regex)
      const klasses = matches && typeof matches[3] !== 'undefined' ? ` class="${escapeHtml(matches[3])}"` : ''
      let result
      if (tokens[idx].nesting === 1) { // opening tag
        result = `<section epub:type="${escapeHtml(matches[1])}" title="${escapeHtml(matches[2])}"${klasses}>\n`
      } else { // closing tag
        result = '</section>\n'
      }
      return result
    }
  })
}
