import { getTarget } from '../../b-ber-lib/src/Target'
import spread from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

const context = { fileName: 'test' }

// The render's env: the document, for `target`, as the renderer passes it
const envFor = (target = 'epub') => ({
  document: { fileName: 'test', target: getTarget(target) },
  result: {},
})

describe('b-ber-grammar-spread', () => {
  it('exports plugin, name, and renderer', () => {
    expect(spread.plugin).toBeFunction()
    expect(spread.name).toBe('spread')
    expect(spread.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = spread.renderer({ context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.render).toBeFunction()
  })

  it('render returns empty string for closing token (nesting -1)', () => {
    const config = spread.renderer({ context })
    const tokens = [{ nesting: -1, info: 'exit:spread-01', map: [10, 11] }]
    expect(config.render(tokens, 0, {}, envFor())).toBe('')
  })

  it('render returns section for epub build', () => {
    const config = spread.renderer({ context })
    const tokens = [{ nesting: 1, info: 'spread:spread-01', map: [0, 1] }]
    const result = config.render(tokens, 0, {}, envFor('epub'))
    expect(result).toContain('<section')
    expect(result).toContain('spread-01')
  })

  it('render returns div scaffold for reader build', () => {
    const config = spread.renderer({ context })
    const tokens = [{ nesting: 1, info: 'spread:spread-02', map: [0, 1] }]
    const result = config.render(tokens, 0, {}, envFor('reader'))
    expect(result).toContain('spread__content')
    expect(result).toContain('spread-02')
  })
})
