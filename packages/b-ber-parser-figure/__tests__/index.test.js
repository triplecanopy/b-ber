import MarkdownIt from 'markdown-it'
import figurePlugin from '../src'

const mockOptions = {
  validate: jest.fn(() => true),
  render: jest.fn(() => ''),
}

describe('b-ber-parser-figure', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('exports a function', () => {
    expect(typeof figurePlugin).toBe('function')
  })

  test('registers on a markdown-it instance without throwing', () => {
    const md = new MarkdownIt()
    expect(() => figurePlugin(md, 'figure', mockOptions)).not.toThrow()
  })

  test('adds a block rule named container_figure', () => {
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', mockOptions)
    const ruleNames = md.block.ruler.__rules__.map(r => r.name)
    expect(ruleNames).toContain('container_figure')
  })

  test('registers open and close renderer rules', () => {
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', mockOptions)
    expect(typeof md.renderer.rules.container_figure_open).toBe('function')
    expect(typeof md.renderer.rules.container_figure_close).toBe('function')
  })

  test('supports different plugin names on the same instance', () => {
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', mockOptions)
    figurePlugin(md, 'spread', { ...mockOptions })
    const ruleNames = md.block.ruler.__rules__.map(r => r.name)
    expect(ruleNames).toContain('container_figure')
    expect(ruleNames).toContain('container_spread')
  })
})
