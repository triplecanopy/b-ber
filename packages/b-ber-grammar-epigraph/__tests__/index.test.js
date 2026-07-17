import log from '@canopycanopycanopy/b-ber-logger'
import epigraph from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

const escapeHtml = (str) => str
const instance = { escapeHtml: { escapeHtml } }
const context = { fileName: 'test' }

describe('b-ber-grammar-epigraph', () => {
  it('exports plugin, name, and renderer', () => {
    expect(epigraph.plugin).toBeFunction()
    expect(epigraph.name).toBe('epigraph')
    expect(epigraph.renderer).toBeFunction()
  })

  it('renderer returns a config object with marker, minMarkers, validate, and render', () => {
    const config = epigraph.renderer({ instance, context })
    expect(config.marker).toBe(':')
    expect(config.minMarkers).toBeNumber()
    expect(config.validate).toBeFunction()
    expect(config.render).toBeFunction()
  })

  it('validate returns truthy for epigraph params and falsy for others', () => {
    const { validate } = epigraph.renderer({ instance, context })
    expect(validate('epigraph caption "text"')).toBeTruthy()
    expect(validate('section:ch-01')).toBeFalsy()
  })

  it('render returns section with pullquote divs for caption-only directive', () => {
    const { render } = epigraph.renderer({ instance, context })
    const tokens = [
      {
        nesting: 1,
        info: 'epigraph caption "A line of text" citation "Author"',
        map: [0, 1],
      },
    ]
    const result = render(tokens, 0)
    expect(result).toContain('<section epub:type="epigraph"')
    expect(result).toContain('pullquote')
    expect(result).toContain('A line of text')
    expect(result).toContain('Author')
  })

  it('render returns figure structure for image directive', () => {
    const { render } = epigraph.renderer({ instance, context })
    const tokens = [
      { nesting: 1, info: 'epigraph image "photo.jpg"', map: [0, 1] },
    ]
    const result = render(tokens, 0)
    expect(result).toContain('<figure')
    expect(result).toContain('photo.jpg')
  })

  it('render calls log.error and returns empty string when neither image nor caption', () => {
    log.error.mockClear()
    const { render } = epigraph.renderer({ instance, context })
    const tokens = [{ nesting: 1, info: 'epigraph', map: [0, 1] }]
    const result = render(tokens, 0)
    expect(result).toBe('')
    expect(log.error).toHaveBeenCalled()
  })

  it('render returns empty string for closing token', () => {
    const { render } = epigraph.renderer({ instance, context })
    const tokens = [{ nesting: -1, info: 'epigraph', map: [5, 6] }]
    const result = render(tokens, 0)
    expect(result).toBe('')
  })
})
