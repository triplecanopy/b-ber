
/*

@type: img
@usage: + image url "image.jpg" alt "My Image" caption "What a nice image"
@output: <figure><img src=" ... " alt=" ... " /></figure>

*/

import mdInline from '../md-plugins/md-inline'
import { hashIt } from '../utils'

const elemRe = /^image\s\w{3,}\s"["\w]+/
const attrRe = new RegExp(/(?:(url|alt|caption)\s["]([^"]+)["])/, 'g')

let count = 0

export default {
  plugin: mdInline,
  name: 'image',
  renderer: instance => ({
    marker: '+',
    minMarkers: 1,
    validate(params) {
      return params.trim().match(elemRe)
    },
    render(tokens, idx) {
      count += 1
      const { escapeHtml } = instance.utils
      const attrs = { url: '', alt: '', caption: '' }

      let matches
      while ((matches = attrRe.exec(tokens[idx].info.trim())) !== null) {
        attrs[matches[1]] = matches[2]
      }

      // write corresponding figures page ...

      return `<div class="figure-sm portrait">
        <figure id="${hashIt(attrs.url)}">
          <a href="loi-${count}.xhtml#loi-${count}">
            <img src="../images/${escapeHtml(attrs.url)}" alt="${attrs.alt}"/>
          </a>
        </figure>
      </div>`
    }
  })
}
