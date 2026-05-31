import MarkdownIt from 'markdown-it'

// Mock b-ber-lib/State before importing the plugin
jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  /* eslint-disable camelcase */
  config: {
    group_footnotes: false,
  },
  /* eslint-enable camelcase */
  footnotes: [],
}))

const footnotePlugin = require('../src')

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
    const ruleNames = md.block.ruler.__rules__.map(r => r.name)
    expect(ruleNames).toContain('footnote_def')
  })

  test('adds footnote inline rules', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    const inlineRuleNames = md.inline.ruler.__rules__.map(r => r.name)
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
})
