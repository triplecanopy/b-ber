import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import logo from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  src: {
    images: jest.fn(p => `/fake/images/${p}`),
  },
}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('fs-extra', () => ({
  existsSync: jest.fn(() => true),
}))

afterEach(() => {
  jest.clearAllMocks()
})

const context = { fileName: 'titlepage' }

describe('b-ber-grammar-logo', () => {
  it('exports plugin, name, and renderer', () => {
    expect(logo.plugin).toBeFunction()
    expect(logo.name).toBe('logo')
    expect(logo.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = logo.renderer({ context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.validate).toBeFunction()
    expect(config.render).toBeFunction()
  })

  it('validate returns truthy for logo directive', () => {
    const config = logo.renderer({ context })
    expect(config.validate('logo:my-logo')).toBeTruthy()
  })

  it('validate returns falsy for non-logo directive', () => {
    const config = logo.renderer({ context })
    expect(config.validate('figure:my-figure')).toBeFalsy()
    expect(config.validate('image:foo')).toBeFalsy()
  })

  it('render returns figure element with image when source exists', () => {
    fs.existsSync.mockReturnValue(true)
    const config = logo.renderer({ context })
    const tokens = [{ info: 'logo:my-logo source:logo.png', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<figure')
    expect(result).toContain('class="logo"')
    expect(result).toContain('<img')
    expect(result).toContain('logo.png')
  })

  it('render logs error when source attribute is missing', () => {
    const config = logo.renderer({ context })
    const tokens = [{ info: 'logo:my-logo', map: [0, 1] }]
    config.render(tokens, 0)
    expect(log.error).toHaveBeenCalled()
  })

  it('render logs warning when image file does not exist', () => {
    fs.existsSync.mockReturnValue(false)
    const config = logo.renderer({ context })
    const tokens = [{ info: 'logo:my-logo source:missing.png', map: [0, 1] }]
    config.render(tokens, 0)
    expect(log.warn).toHaveBeenCalled()
  })
})
