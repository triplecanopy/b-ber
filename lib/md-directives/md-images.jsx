
/*

@type: img
@usage: + image url "image.jpg" alt "My Image" caption "What a nice image"
@output: <figure><img src=" ... " alt=" ... " /></figure>

*/

import path from 'path'
import fs from 'fs-extra'
import imgsize from 'image-size'
import conf from '../config'
import logger from '../logger'
import mdInline from '../md-plugins/md-inline'
import { hashIt, updateStore } from '../utils'

const elemRe = /^image\s\w{3,}\s"["\w]+/
const attrRe = new RegExp(/(?:(url|alt|caption)\s["]([^"]+)["])/, 'g')

let seq = 0

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
      seq += 1

      const id = hashIt(Math.random().toString(36).substr(0, 5))
      const page = `loi-${seq + 1000}.xhtml`
      const attrs = { id, page, url: '', alt: '' }
      const { escapeHtml } = instance.utils

      let matches
      while ((matches = attrRe.exec(tokens[idx].info.trim())) !== null) {
        attrs[matches[1]] = matches[2]
      }

      if (!attrs.url) { throw new Error('Image directives require a `src` attribute.') }

      const image = path.join(__dirname, '../../', conf.src, '_images', attrs.url)

      try {
        if (fs.statSync(image)) {
          const { ...dimensions } = imgsize(image)
          updateStore('images', { seq, ...attrs, ...dimensions })
          return `<div class="figure-sm portrait">
            <figure id="ref${attrs.id}">
              <a href="${page}#${id}">
                <img src="../images/${escapeHtml(attrs.url)}" alt="${attrs.alt}"/>
              </a>
            </figure>
          </div>`
        }
      } catch (e) {
        logger.warn(`ENOENT: Could not open ${image}. Check that it exists in the _images directory.`)
        return ''
      }
    }
  })
}

// still need:
// - referring page
// - image dimensions
