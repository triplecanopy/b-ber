import dialogue from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  cursor: [],
  add: jest.fn(),
  remove: jest.fn(),
  indexOf: jest.fn(() => -1),
  contains: jest.fn(() => false),
}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

describe('b-ber-grammar-dialogue', () => {
  it('exports plugin, name, and renderer', () => {
    expect(dialogue.plugin).toBeFunction()
    expect(dialogue.name).toBe('dialogue')
    expect(dialogue.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = dialogue.renderer({ context: { fileName: 'test' } })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.render).toBeFunction()
  })

  it('render() produces section open tag for a dialogue directive', () => {
    const config = dialogue.renderer({ context: { fileName: 'test' } })
    const tokens = [{ nesting: 1, info: 'dialogue:ch-01', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<section')
    expect(result).toContain('ch-01')
  })

  it('render() returns empty string for closing token', () => {
    const config = dialogue.renderer({ context: { fileName: 'test' } })
    const tokens = [{ nesting: -1, info: 'exit:ch-01', map: [10, 11] }]
    const result = config.render(tokens, 0)
    expect(result).toBe('')
  })
})
