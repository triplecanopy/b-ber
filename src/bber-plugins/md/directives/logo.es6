import figure from 'bber-plugins/md/plugins/figure'
import { attributes, htmlId } from 'bber-plugins/md/directives/helpers'

const markerRe = /^logo/
const directiveRe = /(logo)(?::([^\s]+)(\s?.*)?)?$/

export default {
  plugin: figure,
  name: 'logo',
  renderer: () => ({
    marker: ':',
    minMarkers: 3,
    validate(params) {
      return params.trim().match(markerRe)
    },
    render(tokens, idx) {
      const match = tokens[idx].info.trim().match(directiveRe)
      const [, type, id, attrs] = match
      const attrString = attributes(attrs, type)

      return `
        <figure id="${htmlId(id)}" class="logo">
          <img style="width:120px;" ${attrString}/>
        </figure>`
    },
  }),
}
