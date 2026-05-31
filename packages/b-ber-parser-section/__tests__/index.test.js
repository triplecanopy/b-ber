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
    const ruleNames = md.block.ruler.__rules__.map(r => r.name)
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
    const ruleNames = md.block.ruler.__rules__.map(r => r.name)
    expect(ruleNames).toContain('container_chapter')
    expect(ruleNames).toContain('container_part')
  })
})
