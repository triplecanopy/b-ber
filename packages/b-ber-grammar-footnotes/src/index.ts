import type { MarkdownToken, SpineItem } from '@canopycanopycanopy/b-ber-lib'
import { State as state } from '@canopycanopycanopy/b-ber-lib'

// `self` is b-ber-markdown-renderer's MarkdownRenderer, which cannot be
// imported here without a dependency cycle
export default function markdownItFootnotePlugin(self: {
  fileName: string
  // The parts of markdown-it's Renderer this plugin calls
  markdownIt: {
    renderer: {
      render(
        // markdown-it's Token, and the token-shaped objects built below
        tokens: object[],
        options: object,
        env: { reference: string }
      ): string
    }
  }
}) {
  // Some whole markdown-it tokens, some built below with only the fields the
  // renderer reads
  return function plugin(tokens: Partial<MarkdownToken>[]) {
    const { fileName } = self
    const entry = state.find('spine.flattened', { fileName }) as
      | Omit<SpineItem, 'nodes'>
      | undefined
    const title = entry?.title || fileName

    // Add footnote container and heading. Doing this here instead of in
    // `footnotes.js` because we need the file's title
    tokens.unshift(
      {
        type: 'block',
        tag: 'section',
        attrs: [['class', 'footnotes break-after']],
        nesting: 1,
        block: true,
      },
      { type: 'block', tag: 'h1', nesting: 1, block: true },
      { type: 'text', block: false, content: title },
      { type: 'block', tag: 'h1', nesting: -1 }
    )

    // add closing section tag
    tokens.push({ type: 'block', tag: 'section', nesting: -1 })

    // Defect, see #728: `0` is passed where Renderer#render expects the
    // instance's options, so footnotes render without them (e.g. `xhtmlOut`).
    // The cast keeps the call as it is until then
    const notes = self.markdownIt.renderer.render(
      tokens,
      0 as unknown as object,
      {
        reference: `${fileName}.xhtml`,
      }
    )

    state.add('footnotes', { fileName, title, notes })
  }
}
