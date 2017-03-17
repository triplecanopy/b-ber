
/*

@type: section
@usage:
  + section <type> <title> [classes]
    [content]
  + exit
@output: <section epub:type="chapter" title="The Chapter Title" class="chapter"> ... </section>

*/

import section from '../plugins/section'
import { log } from '../../log'

const regex = /^section\s+['"]?([^\s'"]+)['"]?\s+['"]?([^'"\n]+)['"]?(?:\s+['"]?([^\n'"]+)['"]?)?$/

export default {
  plugin: section,
  name: 'section',
  renderer: (instance, context) => ({
    marker: ':',
    minMarkers: 3,
    markerOpen: /section\s+/,
    markerClose: /exit/,
    validate(params) {
      return params.trim().match(regex)
    },
    render(tokens, idx) {
      const { escapeHtml } = instance.utils
      const matches = tokens[idx].info.trim().match(regex)
      let result = ''

      if (tokens[idx].nesting === 1) { // opening tag
        const line = tokens[idx].map ? tokens[idx].map[0] : null

        if (!matches) {
          log.error(`[${context._get('filename')}.md] <section> Malformed directive.`)
          result = '<section>'
          return result
        }

        if (matches && !matches[1]) { log.error(`[${context._get('filename')}.md:${line}] <section> Missing \`type\` attribute.`) }
        if (matches && !matches[2]) { log.error(`[${context._get('filename')}.md:${line}] <section> Missing \`title\` attribute.`) }

        let classes = [matches[1]]

        if (matches[3]) {
          classes = [
            ...classes,
            ...matches[3].split(' ').map(_ =>
                escapeHtml(_.trim())).filter(Boolean)
          ]
        }

        result = [
          '<section',
          ` epub:type="${escapeHtml(matches[1])}"`,
          ` title="${escapeHtml(matches[2])}"`,
          ` class="${classes.join(' ')}"`,
          '>\n'
        ].join('')
      }
      return result
    }
  })
}
