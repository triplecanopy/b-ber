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
    const ruleNames = md.block.ruler.__rules__.map((r) => r.name)
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
    const ruleNames = md.block.ruler.__rules__.map((r) => r.name)
    expect(ruleNames).toContain('container_dialogue')
    expect(ruleNames).toContain('container_monologue')
  })

  test('calls validateOpen when rendering content with triple-colon fence', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'dialogue', mockOptions)
    md.render('::: dialogue:intro\nContent here\n')
    expect(mockOptions.validateOpen).toHaveBeenCalled()
  })

  test('calls render for open and close tokens when validateOpen returns true', () => {
    const render = jest.fn(() => '')
    const md = new MarkdownIt()
    containerPlugin(md, 'dialogue', { ...mockOptions, render })
    md.render('::: dialogue:intro\nContent here\n')
    expect(render).toHaveBeenCalled()
  })

  test('does not call render when validateOpen returns false', () => {
    const validateOpen = jest.fn(() => false)
    const render = jest.fn(() => '')
    const md = new MarkdownIt()
    containerPlugin(md, 'dialogue', { ...mockOptions, validateOpen, render })
    md.render('::: dialogue:intro\nContent here\n')
    expect(validateOpen).toHaveBeenCalled()
    expect(render).not.toHaveBeenCalled()
  })

  test('does not trigger block rule for non-container content', () => {
    const validateOpen = jest.fn(() => true)
    const md = new MarkdownIt()
    containerPlugin(md, 'dialogue', { ...mockOptions, validateOpen })
    md.render('Normal paragraph text.\n')
    expect(validateOpen).not.toHaveBeenCalled()
  })

  test('processes interlocutor pattern :: speaker :: in child tokens', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'dialogue', mockOptions)
    expect(() =>
      md.render('::: dialogue:intro\n:: Alice :: She said hello.\n')
    ).not.toThrow()
    expect(mockOptions.validateOpen).toHaveBeenCalled()
  })

  test('handles content without interlocutor pattern inside dialogue block', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'dialogue', mockOptions)
    expect(() =>
      md.render('::: dialogue:intro\nPlain content without speaker.\n')
    ).not.toThrow()
    expect(mockOptions.render).toHaveBeenCalled()
  })

  test('does not process interlocutor tokens outside dialogue block', () => {
    const md = new MarkdownIt()
    containerPlugin(md, 'section', mockOptions)
    expect(() =>
      md.render('::: section:intro\n:: Alice :: She said hello.\n')
    ).not.toThrow()
  })
})
