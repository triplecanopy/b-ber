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

  test('calls validate when rendering content with triple-colon fence', () => {
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', mockOptions)
    md.render('::: figure:my-id source="img.jpg"\n')
    expect(mockOptions.validate).toHaveBeenCalled()
  })

  test('calls render when validate returns true', () => {
    const render = jest.fn(() => '')
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', { ...mockOptions, render })
    md.render('::: figure:my-id source="img.jpg"\n')
    expect(render).toHaveBeenCalled()
  })

  test('does not call render when validate returns false', () => {
    const validate = jest.fn(() => false)
    const render = jest.fn(() => '')
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', { validate, render })
    md.render('::: figure:my-id source="img.jpg"\n')
    expect(validate).toHaveBeenCalled()
    expect(render).not.toHaveBeenCalled()
  })

  test('does not trigger for non-container content', () => {
    const validate = jest.fn(() => true)
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', { ...mockOptions, validate })
    md.render('Normal paragraph.\n')
    expect(validate).not.toHaveBeenCalled()
  })

  test('does not trigger for content with fewer than minMarkers colons', () => {
    const validate = jest.fn(() => true)
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', { ...mockOptions, validate })
    md.render(':: figure:my-id\n')
    expect(validate).not.toHaveBeenCalled()
  })

  test('handles figure block with caption delimiters', () => {
    const render = jest.fn(() => '')
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', { ...mockOptions, render })
    // Caption syntax: line starting with :: after the opening fence
    expect(() =>
      md.render('::: figure:my-id source="img.jpg"\n:: Caption text\n::\n')
    ).not.toThrow()
    expect(render).toHaveBeenCalled()
  })

  test('passes params string and line number to validate', () => {
    const validate = jest.fn(() => true)
    const md = new MarkdownIt()
    figurePlugin(md, 'figure', { ...mockOptions, validate })
    md.render('::: figure:my-id source="img.jpg"\n')
    expect(validate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Number)
    )
  })
})
