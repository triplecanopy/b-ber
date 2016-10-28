
/*

@type: img
@usage: ::: image <src> [alt]
@output: <figure><img src=" ... " alt=" ... " /></figure>

*/

import mdInline from '../md-plugins/md-inline'

export default {
  plugin: mdInline,
  name: 'image',
  renderer: instance => ({
    validate(params) {
      return params.trim().match(/^image\s+['"]?([^'"]+)['"]?(?:\s+['"]?([^\n'"]+)['"]?)?$/)
    },
    render(tokens, idx) {
      const { escapeHtml } = instance.utils
      const matches = tokens[idx].info.trim().match(/^image\s+['"]?([^'"]+)['"]?(?:\s+['"]?([^\n'"]+)['"]?)?$/)
      const alttext = matches && typeof matches[2] !== 'undefined' ? escapeHtml(matches[2]) : ''
      return `<figure>\n<img src="${escapeHtml(matches[1])}" alt="${alttext}"/>\n</figure>\n`
    }
  })
}
