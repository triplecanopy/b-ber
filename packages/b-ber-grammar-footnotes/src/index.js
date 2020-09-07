import state from '@canopycanopycanopy/b-ber-lib/State'

export default function markdownItFootnotePlugin(self) {
  return function plugin(tokens) {
    const { fileName } = self
    const entry = state.find('spine.flattened', { fileName })
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
