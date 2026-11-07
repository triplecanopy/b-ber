import type { SpineItem } from '@canopycanopycanopy/b-ber-lib'
import { State as state } from '@canopycanopycanopy/b-ber-lib'

// `self` is b-ber-markdown-renderer's MarkdownRenderer, which cannot be
// imported here without a dependency cycle
export default function markdownItFootnotePlugin(self: {
  fileName: string
  // `render` below passes `0` where markdown-it's Renderer#render expects its
  // options object, so footnotes render without the instance's options (e.g.
  // `xhtmlOut`). markdown-it's type would reject it. Reported under TASK-119,
  // not fixed in pass 1
  // biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
  markdownIt: any
}) {
  // Token-shaped objects: some from markdown-it, some built below
  return function plugin(tokens: Record<string, unknown>[]) {
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

    const notes = self.markdownIt.renderer.render(tokens, 0, {
      reference: `${fileName}.xhtml`,
    })

    state.add('footnotes', { fileName, title, notes })
  }
}
