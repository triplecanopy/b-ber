
/*

@type: epigraph
@usage:
  + epigraph image "image.jpg"

  + epigraph caption "This is the first caption | This is the second caption" citation "first citation | second citation"

@output: <section epub:type="epigraph" class="epigraph chapter"> ... </section>

*/

import figure from 'bber-plugins/md/plugins/figure'
import { log } from 'bber-plugins'

const markerRe = /^epigraph/
const attrsRe = /(?:(image|caption|citation)\s["]([^"]+)["])/g

export default {
  plugin: figure,
  name: 'epigraph',
  renderer: (instance, context) => ({
    marker: ':',
    minMarkers: 3,
    validate(params) {
      return params.trim().match(markerRe)
    },
    render(tokens, idx) {
      const { escapeHtml } = instance.utils
      const attrs = { image: '', caption: '', citation: '' }
      let result = ''

      if (tokens[idx].nesting === 1) { // opening tag
        let matches
        while ((matches = attrsRe.exec(tokens[idx].info.trim())) !== null) { attrs[matches[1]] = matches[2] }

        if (!attrs.image && !attrs.caption) {
          log.error(`[${context.filename}.md] <epigraph> Malformed directive.`)
          result = ''
        } else if (!attrs.image && attrs.caption) {
          const captions = attrs.caption.split('|').map(_ => _.trim())
          const citations = attrs.citation.split('|').map(_ => _.trim())
          result = [
            '<section epub:type="epigraph" class="epigraph chapter">',
            '<section epub:type="subchapter" class="subchapter">',
            captions.map((caption, idx2) =>
              `<div class="pull-quote full-width">
                <p>${escapeHtml(caption)}</p>
                ${(citations[idx2] ? `<cite>&#x2014;${escapeHtml(citations[idx2])}</cite>` : '')}
              </div>`
            ).join(''),
            '</section>',
            '</section>'
          ].join('')
        } else {
          result = [
            '<section epub:type="epigraph" class="epigraph chapter">',
            '<div class="figure-lg" style="height: auto;">',
            '<figure style="height: auto;">',
            '<div class="img-wrap" style="width: 100%; margin: 0 auto;">',
            `<img class="landscape" alt="${attrs.image}" src="../images/${escapeHtml(attrs.image)}" style="width: 100%; max-width: 100%; height: auto;"/>`,
            (attrs.caption ? `<div class="figcaption" style="width: 100%; max-width: 100%; height: auto;"><p class="small">${escapeHtml(attrs.caption)}</p></div>` : ''),
            '</div>',
            '</figure>',
            '</div>',
            '</section>'
          ].join('')
        }
      }
      return result
    }
  })
}
