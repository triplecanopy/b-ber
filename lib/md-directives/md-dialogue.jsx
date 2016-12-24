
/*

@type: section
@usage:
  + section <type> <title> [classes]
    [content]
  + exit
@output: <section epub:type="chapter" title="The Chapter Title" class="chapter"> ... </section>

*/

import mdSectionTest from '../md-plugins/md-dialogue'
import log from '../log'

const regex = /^dialogue/

export default {
  plugin: mdSectionTest,
  name: 'dialogue',
  renderer: (instance, context) => ({
    marker: '+',
    minMarkers: 1,
    markerOpen: /dialogue/,
    markerClose: /exit/,
    validate: params => params.trim().match(regex),
    render(tokens, idx) {
      const matches = tokens[idx].info.trim().match(regex)

      console.log(matches)

      let result = ''

      // if (tokens[idx].type === 'container_dialogue_open') { instance.enable('pluginName') }
      // if (tokens[idx].type === 'container_dialogue_close') { instance.disable('pluginName') }

      if (tokens[idx].nesting === 1) { // opening tag
        const line = tokens[idx].map ? tokens[idx].map[0] : null
        if (!matches) { log.error(`[${context._get('filename')}.md:${line}] <dialogue> Malformed directive.`) }
        result = '<section class="dialogue">'
      }
      return result
    }
  })
}
