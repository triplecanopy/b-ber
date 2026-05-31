import state from '@canopycanopycanopy/b-ber-lib/State'
import section from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
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

const context = { fileName: 'test' }

describe('b-ber-grammar-section', () => {
  it('exports plugin, name, and renderer', () => {
    expect(section.plugin).toBeFunction()
    expect(section.name).toBe('section')
    expect(section.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = section.renderer({ context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.render).toBeFunction()
  })

  it('render openElement produces section with id', () => {
    const config = section.renderer({ context })
    const tokens = [{ nesting: 1, info: 'chapter:ch-01', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<section')
    expect(result).toContain('ch-01')
  })

  it('render closeElement returns empty string when id is not in state', () => {
    // state is imported at top level
    state.contains.mockReturnValue(false)
    const config = section.renderer({ context })
    const tokens = [{ nesting: -1, info: 'chapter:ch-99', map: [5, 6] }]
    const result = config.render(tokens, 0)
    expect(result).toBe('')
  })

  it('render handleExitDirective returns closing section tag', () => {
    // state is imported at top level
    state.contains.mockReturnValue(true)
    const config = section.renderer({ context })
    const tokens = [{ nesting: 1, info: 'exit:ch-01', map: [5, 6] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('</section>')
    expect(result).toContain('ch-01')
  })
})
