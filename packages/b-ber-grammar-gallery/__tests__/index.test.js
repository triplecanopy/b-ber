import state from '@canopycanopycanopy/b-ber-lib/State'
import gallery from '../src'

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

describe('b-ber-grammar-gallery', () => {
  it('exports plugin, name, and renderer', () => {
    expect(gallery.plugin).toBeFunction()
    expect(gallery.name).toBe('gallery')
    expect(gallery.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = gallery.renderer({ context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.render).toBeFunction()
  })

  it('render returns empty string for closing token (nesting -1)', () => {
    const config = gallery.renderer({ context })
    const tokens = [{ nesting: -1, info: 'exit:gallery-01', map: [10, 11] }]
    expect(config.render(tokens, 0)).toBe('')
  })

  it('render returns section for epub build', () => {
    // state is imported at top level
    state.build = 'epub'
    const config = gallery.renderer({ context })
    const tokens = [{ nesting: 1, info: 'gallery:gallery-01', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<section')
    expect(result).toContain('gallery-01')
  })

  it('render returns div figure structure for web build', () => {
    // state is imported at top level
    state.build = 'web'
    const config = gallery.renderer({ context })
    const tokens = [{ nesting: 1, info: 'gallery:gallery-02', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<figure')
    expect(result).toContain('figure__gallery')
  })
})
