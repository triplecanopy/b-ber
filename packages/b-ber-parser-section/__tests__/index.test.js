import MarkdownIt from 'markdown-it'
import containerPlugin from '../src'

const mockOptions = {
  validateOpen: jest.fn(() => true),
  validateClose: jest.fn(() => false),
  render: jest.fn(() => ''),
  marker: ':',
  minMarkers: 3,
}

describe('b-ber-parser-section', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('exports a function', () => {
    expect(typeof containerPlugin).toBe('function')
  })

  test('registers on a markdown-it instance without throwing', () => {
    const md = new MarkdownIt()
    expect(() => containerPlugin(md, 'chapter', mockOptions)).not.toThrow()
  })

  test('adds a block rule named container_chapter', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', mockOptions)
    const ruleNames = md.block.ruler.__rules__.map((r) => r.name)
    expect(ruleNames).toContain('container_chapter')
  })

  test('registers open and close renderer rules', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', mockOptions)
    expect(typeof md.renderer.rules.container_chapter_open).toBe('function')
    expect(typeof md.renderer.rules.container_chapter_close).toBe('function')
  })

  test('supports multiple section types on the same instance', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', mockOptions)
    containerPlugin(md, 'part', { ...mockOptions })
    const ruleNames = md.block.ruler.__rules__.map((r) => r.name)
    expect(ruleNames).toContain('container_chapter')
    expect(ruleNames).toContain('container_part')
  })

  test('calls validateOpen when rendering content with triple-colon fence', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', mockOptions)
    md.render('::: section:intro\nContent here\n')
    expect(mockOptions.validateOpen).toHaveBeenCalled()
  })

  test('calls render for open and close tokens when validateOpen returns true', () => {
    const render = jest.fn(() => '')
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', { ...mockOptions, render })
    md.render('::: section:intro\nContent here\n')
    expect(render).toHaveBeenCalled()
  })

  test('does not call render when validateOpen returns false', () => {
    const validateOpen = jest.fn(() => false)
    const render = jest.fn(() => '')
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', { ...mockOptions, validateOpen, render })
    md.render('::: section:intro\nContent here\n')
    expect(validateOpen).toHaveBeenCalled()
    expect(render).not.toHaveBeenCalled()
  })

  test('passes params string and line number to validateOpen', () => {
    const validateOpen = jest.fn(() => true)
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', { ...mockOptions, validateOpen })
    md.render('::: section:intro\nContent here\n')
    expect(validateOpen).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Number)
    )
  })

  test('does not trigger block rule for content with fewer than minMarkers colons', () => {
    const validateOpen = jest.fn(() => true)
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', { ...mockOptions, validateOpen })
    md.render(':: section:intro\nContent here\n')
    expect(validateOpen).not.toHaveBeenCalled()
  })

  test('does not trigger block rule for non-container content', () => {
    const validateOpen = jest.fn(() => true)
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', { ...mockOptions, validateOpen })
    md.render('Normal paragraph text.\n')
    expect(validateOpen).not.toHaveBeenCalled()
  })

  test('handles container with inner paragraph content', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'chapter', mockOptions)
    expect(() =>
      md.render('::: section:intro\n\nA paragraph inside.\n\n')
    ).not.toThrow()
    expect(mockOptions.validateOpen).toHaveBeenCalled()
  })
})
