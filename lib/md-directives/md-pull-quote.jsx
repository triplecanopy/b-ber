
/*

@type: pull-quote

@usage:
  + pull-quote citation "Name of Person"
    [content]
  + exit

@output:
  <section class="pull-quote">
    ...
    <cite>—&#160;Name of Person</cite>
  </section>

*/

import mdSection from '../md-plugins/md-section'
import { log } from '../log'

const markerOpen = /^pull-quote(?:\s+(citation)\s+"([^"]+?))?"/
let citation = ''

export default {
  plugin: mdSection,
  name: 'pullQuote',
  renderer: (instance, context) => ({
    marker: '+',
    minMarkers: 1,
    markerOpen: /pull-quote\s+/,
    markerClose: /exit/,
    validate(params) {
      return params.trim().match(markerOpen)
    },
    render(tokens, idx) {
      const { escapeHtml } = instance.utils
      const matches = tokens[idx].info.trim().match(markerOpen)
      let result = ''

      if (tokens[idx].nesting === 1) { // opening tag
        if (!matches) { log.error(`[${context._get('filename')}.md] <pull-quote> Malformed directive.`) }
        if (matches && matches[2]) { citation = matches[2] }

        result = '<section class="pull-quote">'
      } else {
        result = citation ? `<cite>—&#160;${escapeHtml(citation)}</cite>` : ''
        citation = ''
      }
      return result
    }
  })
}
