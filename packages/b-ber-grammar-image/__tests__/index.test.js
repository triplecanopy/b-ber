import { utils } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import { h } from '../../b-ber-markdown-renderer/src/xhtml'
import image from '../src'
import { createFigure, createFigureInline } from '../src/image'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  // Returns an Error, as the real log.error does, so that a site's
  // `throw log.error(...)` throws one rather than undefined
  error: jest.fn((err) =>
    err instanceof Error ? err : new Error(String(err))
  ),
  warn: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('fs-extra', () => ({ existsSync: jest.fn(() => true) }))

jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  attributesObject: jest.fn(() => ({ source: 'test.jpg', alt: 'test image' })),
  htmlId: jest.fn((id) => id),
}))

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  Html: {
    comment: jest.fn((s) => s),
    escape: jest.requireActual('../../b-ber-lib/src/Html').default.escape,
  },
  utils: {
    getImageDimensions: jest.fn(() => ({ width: 100, height: 150 })),
    getImageOrientation: jest.fn(() => 'landscape'),
  },
}))

jest.mock('../src/image', () => ({
  createFigure: jest.fn(() => '<div class="figure">test figure</div>'),
  createFigureInline: jest.fn(
    () => '<div class="figure-inline">test inline</div>'
  ),
}))

const instance = { renderInline: jest.fn((str) => str) }
const context = { fileName: 'test' }
// The render's env, as the renderer passes it. The project's images are
// where the document says
const env = { document: { fileName: 'test', images: (p) => p }, result: {} }

describe('b-ber-grammar-image', () => {
  it('exports plugin, name, and renderer', () => {
    expect(image.plugin).toBeFunction()
    expect(image.name).toBe('figure')
    expect(image.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = image.renderer({ instance, context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.validate).toBeFunction()
    expect(config.render).toBeFunction()
  })

  it('validate returns truthy for figure directive with id and source', () => {
    const config = image.renderer({ instance, context })
    // validate signature is (params, line) and requires id and source
    expect(
      config.validate('figure:my-id source="my-image.jpg"', 1, env)
    ).toBeTruthy()
  })

  it('validate throws for a directive whose name ends in figure, without a source', () => {
    // MARKER_OPEN_RE is not anchored at the start, so this matches as
    // `figure:foo`, with no source
    const config = image.renderer({ instance, context })
    expect(() => config.validate('notafigure:foo', 1, env)).toThrow(
      'Missing [id] or [source]'
    )
  })

  it('validate throws when id or source are missing', () => {
    const config = image.renderer({ instance, context })
    // Only type, no id or source
    expect(() => config.validate('figure', 1, env)).toThrow(
      'Missing [id] or [source]'
    )
  })

  it('renderer config includes markerOpen', () => {
    const config = image.renderer({ instance, context })
    expect(config.markerOpen).toBeDefined()
  })

  it('render calls prepare and createFigure for figure type token', () => {
    const config = image.renderer({ instance, context })
    const node = { info: 'figure:test-id source="test.jpg"', line: 0 }
    const result = config.render({ node, env, h })
    expect(createFigure).toHaveBeenCalled()
    expect(result).toBe('<div class="figure">test figure</div>')
  })

  it('passes the image dimensions from b-ber-lib to the figure', () => {
    createFigure.mockClear()
    const config = image.renderer({ instance, context })
    const node = { info: 'figure:dims-id source="test.jpg"', line: 0 }
    config.render({ node, env, h })
    // attributesObject is mocked to resolve every source to test.jpg
    expect(utils.getImageDimensions).toHaveBeenCalledWith('test.jpg')
    expect(createFigure).toHaveBeenCalledWith(
      expect.objectContaining({ width: 100, height: 150 }),
      h
    )
  })

  it('render calls createFigureInline for figure-inline type token', () => {
    const config = image.renderer({ instance, context })
    const node = { info: 'figure-inline:test-id source="test.jpg"', line: 0 }
    const result = config.render({ node, env, h })
    expect(createFigureInline).toHaveBeenCalled()
    expect(result).toBe('<div class="figure-inline">test inline</div>')
  })

  it('render passes caption to prepare via renderInline when children are present', () => {
    const config = image.renderer({ instance, context })
    const node = {
      info: 'figure:cap-id source="test.jpg"',
      line: 0,
      caption: 'caption text',
    }
    config.render({ node, env, h })
    expect(instance.renderInline).toHaveBeenCalledWith('caption text', env)
  })

  it('validate throws what log.error reports when id is undefined', () => {
    const config = image.renderer({ instance, context })
    // 'figure' with no id — id is undefined
    expect(() => config.validate('figure', 1, env)).toThrow()
    expect(log.error).toHaveBeenCalled()
  })

  it('logs an error when the referenced image is missing', () => {
    fs.existsSync.mockReturnValueOnce(false)
    const config = image.renderer({ instance, context })
    const node = { info: 'figure:missing-id source="missing.jpg"', line: 0 }
    expect(() => config.render({ node, env, h })).toThrow('Image not found')
    expect(log.error).toHaveBeenCalledWith(
      expect.stringContaining('Image not found')
    )
  })
})
