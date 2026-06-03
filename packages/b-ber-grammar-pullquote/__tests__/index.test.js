import pullquote from '../src'

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

const instance = { renderInline: jest.fn((str) => str) }
const context = { fileName: 'test' }

describe('b-ber-grammar-pullquote', () => {
  it('exports plugin, name, and renderer', () => {
    expect(pullquote.plugin).toBeFunction()
    expect(pullquote.name).toBe('pullQuote')
    expect(pullquote.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = pullquote.renderer({ instance, context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.validateOpen).toBeFunction()
    expect(config.render).toBeFunction()
  })

  it('validateOpen returns false when id is missing', () => {
    const config = pullquote.renderer({ instance, context })
    expect(config.validateOpen('pullquote', 1)).toBe(false)
  })

  it('render returns empty string for closing token (nesting -1)', () => {
    const config = pullquote.renderer({ instance, context })
    const tokens = [{ nesting: -1, info: 'exit:pq-01', map: [10, 11] }]
    expect(config.render(tokens, 0)).toBe('')
  })

  it('render handleOpen produces section open tag for pullquote directive', () => {
    const config = pullquote.renderer({ instance, context })
    const tokens = [{ nesting: 1, info: 'pullquote:pq-01', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<section')
    expect(result).toContain('pq-01')
  })

  it('render handleOpen produces blockquote open tag for blockquote directive', () => {
    const config = pullquote.renderer({ instance, context })
    const tokens = [{ nesting: 1, info: 'blockquote:bq-01', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<blockquote')
    expect(result).toContain('bq-01')
  })
})
