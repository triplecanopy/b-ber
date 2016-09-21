
/*

@type: img
@usage: ::: image <src> [alt]
@output: <figure><img src=" ... " alt=" ... " /></figure>

*/

import mdInline from '../md-plugins/md-inline';

export default {
  plugin: mdInline,
  name: 'image',
  renderer: instance => ({
    validate(params) {
      return params.trim().match(/^image\s+['"]([^'"]+)['"](?:\s+['"]([^\n'"]+)['"])?$/);
    },
    render(tokens, idx) {
      let matches = tokens[idx].info.trim().match(/^image\s+['"]([^'"]+)['"](?:\s+([^\n]+))?$/);
      let alttext = matches && typeof matches[2] !== 'undefined' ? instance.utils.escapeHtml(matches[2]) : '';
      return `<figure>\n<img src="${instance.utils.escapeHtml(matches[1])}" alt="${alttext}"/></figure>\n`;
    },
  }),
};
