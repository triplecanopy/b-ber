import markdownItFootnotePlugin from '../src'

// The env of the render that found the notes. The document's title is the
// build's: its spine entry's, or else its file name (b-ber-tasks' render)
const envFor = (fileName, title = fileName) => ({
  document: { fileName, title, marker: 'document' },
  result: { footnotes: [], marker: 'result' },
  // What markdown-it's footnote rules keep in the env, which the notes'
  // render does not share
  footnotes: { list: [] },
})

const selfWith = (render = jest.fn(() => '<p>notes</p>')) => ({
  markdownIt: { renderer: { render } },
})

describe('b-ber-grammar-footnotes', () => {
  it('exports a function', () => {
    expect(markdownItFootnotePlugin).toBeFunction()
  })

  it('calling the factory with self returns a plugin function', () => {
    expect(markdownItFootnotePlugin(selfWith())).toBeFunction()
  })

  it('collects the notes into the document’s result', () => {
    const env = envFor('chapter-01', 'Chapter One')
    markdownItFootnotePlugin(selfWith())([], env)
    expect(env.result.footnotes).toEqual([
      { fileName: 'chapter-01', title: 'Chapter One', notes: '<p>notes</p>' },
    ])
  })

  it('renders the notes with the document, and a reference to its page', () => {
    const render = jest.fn(() => '')
    const env = envFor('chapter-02')
    markdownItFootnotePlugin(selfWith(render))([], env)
    expect(render.mock.calls[0][2]).toEqual({
      document: env.document,
      result: env.result,
      reference: 'chapter-02.xhtml',
    })
  })

  it('plugin wraps tokens with section and heading tokens', () => {
    let capturedTokens = null
    const render = jest.fn((tokens) => {
      capturedTokens = tokens
      return '<p>rendered</p>'
    })
    markdownItFootnotePlugin(selfWith(render))(
      [],
      envFor('chapter-03', 'Notes')
    )
    // Token stream should start with section open and end with section close
    expect(capturedTokens[0].tag).toBe('section')
    expect(capturedTokens[0].nesting).toBe(1)
    expect(capturedTokens[2].content).toBe('Notes')
    expect(capturedTokens[capturedTokens.length - 1].tag).toBe('section')
    expect(capturedTokens[capturedTokens.length - 1].nesting).toBe(-1)
  })
})
