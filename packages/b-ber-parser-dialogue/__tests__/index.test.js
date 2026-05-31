import MarkdownIt from 'markdown-it'
import containerPlugin from '../src'

const mockOptions = {
  validateOpen: jest.fn(() => true),
  validateClose: jest.fn(() => false),
  render: jest.fn(() => ''),
  marker: ':',
  minMarkers: 3,
}

describe('b-ber-parser-dialogue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('exports a function', () => {
    expect(typeof containerPlugin).toBe('function')
  })

  test('registers on a markdown-it instance without throwing', () => {
    const md = new MarkdownIt()
    expect(() => containerPlugin(md, 'dialogue', mockOptions)).not.toThrow()
  })

  test('adds a block rule named container_dialogue', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'dialogue', mockOptions)
    const ruleNames = md.block.ruler.__rules__.map(r => r.name)
    expect(ruleNames).toContain('container_dialogue')
  })

  test('registers open and close renderer rules', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'dialogue', mockOptions)
    expect(typeof md.renderer.rules.container_dialogue_open).toBe('function')
    expect(typeof md.renderer.rules.container_dialogue_close).toBe('function')
  })

  test('supports registering multiple named containers on the same instance', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'dialogue', mockOptions)
    containerPlugin(md, 'monologue', { ...mockOptions })
    const ruleNames = md.block.ruler.__rules__.map(r => r.name)
    expect(ruleNames).toContain('container_dialogue')
    expect(ruleNames).toContain('container_monologue')
  })
})
