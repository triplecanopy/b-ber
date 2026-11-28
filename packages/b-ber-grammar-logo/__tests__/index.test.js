import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import { h, serialize } from '../../b-ber-markdown-renderer/src/xhtml'
import logo from '../src'

const render = (config, node) => serialize(config.render({ node, env, h }))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  // Returns an Error, as the real log.error does, so that a site's
  // `throw log.error(...)` throws one rather than undefined
  error: jest.fn((err) =>
    err instanceof Error ? err : new Error(String(err))
  ),
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
// The render's env, as the renderer passes it
const env = {
  document: {
    fileName: 'titlepage',
    images: jest.fn((p) => `/fake/images/${p}`),
  },
  result: {},
}

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
    const node = { info: 'logo:my-logo source:logo.png', line: 0 }
    const result = render(config, node)
    expect(result).toContain('<figure')
    expect(result).toContain('class="logo"')
    expect(result).toContain('<img')
    expect(result).toContain('logo.png')
  })

  it('render throws what log.error reports when source attribute is missing', () => {
    const config = logo.renderer({ context })
    const node = { info: 'logo:my-logo', line: 0 }
    expect(() => render(config, node)).toThrow('[source] attribute is required')
    expect(log.error).toHaveBeenCalled()
  })

  it('render logs warning when image file does not exist', () => {
    fs.existsSync.mockReturnValue(false)
    const config = logo.renderer({ context })
    const node = { info: 'logo:my-logo source:missing.png', line: 0 }
    render(config, node)
    expect(log.warn).toHaveBeenCalled()
  })
})
