import state from '@canopycanopycanopy/b-ber-lib/State'
import markdownItFootnotePlugin from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  add: jest.fn(),
  find: jest.fn(() => null),
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe('b-ber-grammar-footnotes', () => {
  it('exports a function', () => {
    expect(markdownItFootnotePlugin).toBeFunction()
  })

  it('calling the factory with self returns a plugin function', () => {
    const self = {
      fileName: 'chapter-01',
      markdownIt: { renderer: { render: jest.fn(() => '<p>notes</p>') } },
    }
    const plugin = markdownItFootnotePlugin(self)
    expect(plugin).toBeFunction()
  })

  it('plugin adds footnotes entry to state', () => {
    // state is imported at top level
    const self = {
      fileName: 'chapter-01',
      markdownIt: { renderer: { render: jest.fn(() => '<p>notes</p>') } },
    }
    const plugin = markdownItFootnotePlugin(self)
    plugin([])
    expect(state.add).toHaveBeenCalledWith(
      'footnotes',
      expect.objectContaining({ fileName: 'chapter-01' })
    )
  })

  it('plugin uses spine entry title when available', () => {
    // state is imported at top level
    state.find.mockReturnValue({ title: 'Chapter One' })
    const self = {
      fileName: 'chapter-01',
      markdownIt: { renderer: { render: jest.fn(() => '<p>notes</p>') } },
    }
    const plugin = markdownItFootnotePlugin(self)
    plugin([])
    expect(state.add).toHaveBeenCalledWith(
      'footnotes',
      expect.objectContaining({ title: 'Chapter One' })
    )
  })

  it('plugin falls back to fileName as title when spine entry is missing', () => {
    // state is imported at top level
    state.find.mockReturnValue(null)
    const self = {
      fileName: 'chapter-02',
      markdownIt: { renderer: { render: jest.fn(() => '<p>notes</p>') } },
    }
    const plugin = markdownItFootnotePlugin(self)
    plugin([])
    expect(state.add).toHaveBeenCalledWith(
      'footnotes',
      expect.objectContaining({ title: 'chapter-02' })
    )
  })

  it('plugin wraps tokens with section and heading tokens', () => {
    // state is imported at top level
    state.find.mockReturnValue({ title: 'Notes' })
    let capturedTokens = null
    const self = {
      fileName: 'chapter-03',
      markdownIt: {
        renderer: {
          render: jest.fn((tokens) => {
            capturedTokens = tokens
            return '<p>rendered</p>'
          }),
        },
      },
    }
    const plugin = markdownItFootnotePlugin(self)
    plugin([])
    // Token stream should start with section open and end with section close
    expect(capturedTokens[0].tag).toBe('section')
    expect(capturedTokens[0].nesting).toBe(1)
    expect(capturedTokens[capturedTokens.length - 1].tag).toBe('section')
    expect(capturedTokens[capturedTokens.length - 1].nesting).toBe(-1)
  })
})
