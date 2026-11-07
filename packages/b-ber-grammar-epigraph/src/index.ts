/* eslint-disable max-len */
/*

@type: epigraph
@usage:
    + epigraph image "image.jpg"

    + epigraph caption "This is the first caption | This is the second caption" citation "first citation | second citation"

@output: <section epub:type="epigraph" class="epigraph chapter"> ... </section>

*/

import log from '@canopycanopycanopy/b-ber-logger'
import figure from '@canopycanopycanopy/b-ber-parser-figure'

const markerRe = /^epigraph/
const attrsRe = /(?:(image|caption|citation)\s["]([^"]+)["])/g

// The fields of markdown-it's `Token` this renderer reads. Declared locally
// because this package does not depend on markdown-it, and importing its types
// makes tsdown inline all of them into the published .d.ts
type Token = { info: string; nesting: number }

export default {
  plugin: figure,
  name: 'epigraph',
  renderer: ({
    instance,
    context = { fileName: '' },
  }: {
    // Typed loosely on purpose: `render` reads `instance.escapeHtml`, which
    // markdown-it does not have (it is `instance.utils.escapeHtml`), so a real
    // type here would reject it. Reported under TASK-119, not fixed in pass 1
    // biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
    instance: any
    context?: { fileName: string }
  }) => ({
    marker: ':',
    minMarkers: 3,
    validate(params: string) {
      return params.trim().match(markerRe)
    },
    render(tokens: Token[], idx: number) {
      const { escapeHtml } = instance.escapeHtml
      const attrs = { image: '', caption: '', citation: '' }
      let result = ''
      if (tokens[idx].nesting === 1) {
        // opening tag
        let matches
        while ((matches = attrsRe.exec(tokens[idx].info.trim())) !== null) {
          // eslint-disable-next-line prefer-destructuring
          // attrsRe only captures `image`, `caption` or `citation` here
          attrs[matches[1] as keyof typeof attrs] = matches[2]
        }

        if (!attrs.image && !attrs.caption) {
          log.error(`[${context.fileName}.md] <epigraph> Malformed directive.`)
          result = ''
        } else if (!attrs.image && attrs.caption) {
          const captions = attrs.caption.split('|').map((_) => _.trim())
          const citations = attrs.citation.split('|').map((_) => _.trim())
          result = [
            '<section epub:type="epigraph" class="epigraph chapter">',
            '<section epub:type="chapter" class="subchapter">',
            captions
              .map(
                (caption, idx2) =>
                  `<div class="pullquote full-width">
                                <p>${escapeHtml(caption)}</p>
                                ${
                                  citations[idx2]
                                    ? `<cite>&#x2014;${escapeHtml(
                                        citations[idx2]
                                      )}</cite>`
                                    : ''
                                }
                            </div>`
              )
              .join(''),
            '</section>',
            '</section>',
          ].join('')
        } else {
          result = [
            '<section epub:type="epigraph" class="epigraph chapter">',
            '<div class="figure-lg" style="height: auto;">',
            '<figure style="height: auto;">',
            '<div class="figure__items" style="width: 100%; margin: 0 auto;">',
            `<img class="landscape" alt="${
              attrs.image
            }" src="../images/${escapeHtml(
              attrs.image
            )}" style="width: 100%; max-width: 100%; height: auto;"/>`,
            attrs.caption
              ? `<div class="figcaption" style="width: 100%; max-width: 100%; height: auto;"><p class="small">${escapeHtml(
                  attrs.caption
                )}</p></div>`
              : '',
            '</div>',
            '</figure>',
            '</div>',
            '</section>',
          ].join('')
        }
      }
      return result
    },
  }),
}
