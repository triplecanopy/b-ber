
/*

@type: dialogue

@usage:
  + dialogue "First Second"
    [content]
  + exit

@output:
  <section class="dialogue">
    <p><span class="speaker">First</span> ... </p>
    <p><span class="speaker">Second</span> ... </p>
  </section>

*/

import dialogue from '../plugins/dialogue'
import { log } from '../../log'

const markerOpen = /^dialogue/
const markerClose = /^exit/

export default {
  plugin: dialogue,
  name: 'dialogue',
  renderer: (instance, context) => ({
    context,
    markerOpen,
    markerClose,
    marker: '+',
    minMarkers: 1,
    replacementStr: '<span class="speaker">$1</span>',
    validate: params => params.trim().match(markerOpen),
    render(tokens, idx) {
      const matches = tokens[idx].info.trim().match(markerOpen)
      let result = ''
      if (tokens[idx].nesting === 1) { // opening tag
        const line = tokens[idx].map ? tokens[idx].map[0] : null
        if (!matches) { log.error(`[${context._get('filename')}.md:${line}] <dialogue> Malformed directive.`) }
        result = '<section class="dialogue">'
      }
      return result
    }
  })
}
