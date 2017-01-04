
/*

@type: img
@usage: + image url "image.jpg" alt "My Image" caption "What a nice image"
@output: <figure><img src=" ... " alt=" ... " /></figure>

*/

import path from 'path'
import fs from 'fs-extra'
import imgsize from 'image-size'
import conf from '../config'
import log from '../log'
import mdInline from '../md-plugins/md-inline-block'
import { hashIt, updateStore, getImageOrientation } from '../utils'

const cwd = process.cwd()

const elemRe = /^image\s\w{3,}\s"["\w]+/
const attrRe = /(?:(url|alt|caption)\s["]([^"]+)["])/g

let seq = 0

export default {
  plugin: mdInline,
  name: 'image',
  renderer: (instance, context) => ({
    marker: '+',
    minMarkers: 1,
    validate(params) {
      return params.trim().match(elemRe)
    },
    render(tokens, idx) {
      seq += 1

      const id = hashIt(Math.random().toString(36).substr(0, 5))
      const page = `loi-${seq + 1000}.xhtml`
      const attrs = { id, page, url: '', alt: '' }
      const line = tokens[idx].map ? tokens[idx].map[0] : null
      const { escapeHtml } = instance.utils

      let matches
      while ((matches = attrRe.exec(tokens[idx].info.trim())) !== null) { attrs[matches[1]] = matches[2] }
      if (!attrs.url) { log.error(`[${context._get('filename')}.md: ${line}] <img> Missing \`src\` attribute.`) }
      const image = path.join(cwd, conf.src, '_images', attrs.url)

      try {
        if (fs.statSync(image)) {
          const { ...dimensions } = imgsize(image)
          const { height, width } = dimensions
          const orientation = getImageOrientation(height, width)
          updateStore('images', { seq, ...attrs, ...dimensions, ref: context._get('filename') })
          return `<div class="figure-sm ${orientation}">
            <figure id="ref${id}">
              <a href="${page}#${id}">
                <img src="../images/${escapeHtml(attrs.url)}" alt="${attrs.alt}"/>
              </a>
            </figure>
          </div>`
        }
      } catch (e) {
        log.warn(`[${context._get('filename')}.md: ${line}] <img> \`${path.basename(image)}\` not found.`)
        return `<!-- Image not found: ${path.basename(image)} -->\n`
      }
      return ''
    }
  })
}
