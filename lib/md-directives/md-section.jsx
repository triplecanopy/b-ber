
/*

@type: section
@usage: ::: section <type> <title> [classes]
[content]
:::
@output: <section epub:type="chapter" title="The Chapter Title" class="chapter"> ... </section>

*/

import markdownItContainer from 'markdown-it-container'

export default {
  plugin: markdownItContainer,
  name: 'section',
  renderer: instance => ({
    validate(params) {
      return params.trim().match(/^section\s+['"]?([^\s'"]+)['"]?\s+['"]?([^'"\n]+)['"]?(?:\s+['"]?([^\n'"]+)['"]?)?$/)
    },
    render(tokens, idx) {
      const { escapeHtml } = instance.utils
      const matches = tokens[idx].info.trim().match(/^section\s+['"]?([^\s'"]+)['"]?\s+['"]?([^'"\n]+)['"]?(?:\s+['"]?([^\n'"]+)['"]?)?$/)
      const klasses = matches && typeof matches[3] !== 'undefined' ? ` class="${escapeHtml(matches[3])}"` : ''
      if (tokens[idx].nesting === 1) { // opening tag
        return `<section epub:type="${escapeHtml(matches[1])}" title="${escapeHtml(matches[2])}"${klasses}>\n`
      } else { // closing tag
        return '</section>\n'
      }
    }
  })
}
