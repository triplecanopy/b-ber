
import markdownItContainer from 'markdown-it-container';

export default {
  plugin: markdownItContainer,
  name: 'spoiler',
  methods: (instance) => {
    return {
      validate(params) {
        return params.trim().match(/^spoiler\s+(.*)$/);
      },
      render(tokens, idx) {
        var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);
        if (tokens[idx].nesting === 1) {
          // opening tag
          return '<details><summary>' + instance.utils.escapeHtml(m[1]) + '</summary>\n';
        } else {
          // closing tag
          return '</details>\n';
        }
      }
    }
  }
};
