import MarkdownIt from 'markdown-it'

// Mock b-ber-lib before importing the plugin
jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  State: {
    /* eslint-disable camelcase */
    config: {
      group_footnotes: false,
    },
    /* eslint-enable camelcase */
    footnotes: [],
  },
}))

const footnotePlugin = require('../src').default

describe('b-ber-parser-footnotes', () => {
  test('exports a function', () => {
    expect(typeof footnotePlugin).toBe('function')
  })

  test('registers on a markdown-it instance without throwing', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    expect(() => footnotePlugin(md, callback)).not.toThrow()
  })

  test('adds footnote_def block rule', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    const ruleNames = md.block.ruler.__rules__.map((r) => r.name)
    expect(ruleNames).toContain('footnote_def')
  })

  test('adds footnote inline rules', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    const inlineRuleNames = md.inline.ruler.__rules__.map((r) => r.name)
    expect(inlineRuleNames).toContain('footnote_inline')
    expect(inlineRuleNames).toContain('footnote_ref')
  })

  test('registers footnote renderer rules', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    expect(typeof md.renderer.rules.footnote_ref).toBe('function')
    expect(typeof md.renderer.rules.footnote_block_open).toBe('function')
    expect(typeof md.renderer.rules.footnote_block_close).toBe('function')
    expect(typeof md.renderer.rules.footnote_open).toBe('function')
    expect(typeof md.renderer.rules.footnote_close).toBe('function')
  })

  test('parses reference-style footnote definition', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    expect(() =>
      md.render(
        '[^1]: The footnote definition.\n\nText with a reference[^1].\n'
      )
    ).not.toThrow()
  })

  test('invokes callback with collected footnote tokens', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    md.render('[^note]: The definition.\n\nText with [^note].\n')
    expect(callback).toHaveBeenCalled()
  })

  test('parses inline footnote syntax ^[...]', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    expect(() =>
      md.render('Text with an inline footnote^[inline definition].\n')
    ).not.toThrow()
    expect(callback).toHaveBeenCalled()
  })

  test('renders footnote reference as epub:type=noteref anchor', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    const result = md.render('[^1]: definition\n\nText[^1].\n')
    expect(result).toContain('epub:type="noteref"')
    expect(result).toContain('footnote-ref')
  })

  test('renders footnote block open as ordered list', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    const callbackArg = []
    callback.mockImplementation((tokens) => callbackArg.push(...tokens))
    md.render('[^1]: definition\n\nText[^1].\n')
    const types = callbackArg.map((t) => t.type)
    expect(types).toContain('footnote_block_open')
  })

  test('footnote_def block rule returns false for non-footnote content', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    // Ordinary paragraph — footnote_def rule should not fire
    md.render('Just a regular paragraph.\n')
    expect(callback).not.toHaveBeenCalled()
  })

  test('footnote_ref rule returns false when no refs are registered', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    // [^1] reference without a definition — should not trigger footnote_ref
    md.render('Text with [^unknown] reference only.\n')
    expect(callback).not.toHaveBeenCalled()
  })

  test('handles multiple footnote references to the same label', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    expect(() =>
      md.render('[^a]: definition\n\nFirst[^a] and second[^a] reference.\n')
    ).not.toThrow()
    expect(callback).toHaveBeenCalled()
  })
})
