
import markdownItContainer from 'markdown-it-container';

export default {
  plugin: markdownItContainer,
  name: 'spoiler',
  methods: instance => ({
    validate(params) {
      return params.trim().match(/^spoiler\s+(.*)$/);
    },
    render(tokens, idx) {
      let res;
      let m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);
      if (tokens[idx].nesting === 1) {
        // opening tag
        res = `<details><summary>${instance.utils.escapeHtml(m[1])}</summary>\n`;
      } else {
        // closing tag
        res = '</details>\n';
      }
      return res;
    },
  }),
};
