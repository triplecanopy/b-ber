import log from '@canopycanopycanopy/b-ber-logger'
import image from '../src'
import { createFigure, createFigureInline } from '../src/image'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
  figures: [],
  add: jest.fn(),
  src: {
    images: (p) => p,
  },
}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('fs-extra', () => ({ existsSync: jest.fn(() => true) }))

jest.mock('image-size', () => jest.fn(() => ({ width: 100, height: 150 })))

jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  attributesObject: jest.fn(() => ({ source: 'test.jpg', alt: 'test image' })),
  htmlId: jest.fn((id) => id),
}))

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  State: jest.requireMock('@canopycanopycanopy/b-ber-lib/State'),
  Html: { comment: jest.fn((s) => s) },
  utils: {
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
      config.validate('figure:my-id source="my-image.jpg"', 1)
    ).toBeTruthy()
  })

  it('validate returns falsy for figure directive missing id', () => {
    const config = image.renderer({ instance, context })
    expect(config.validate('notafigure:foo', 1)).toBeFalsy()
  })

  it('validate returns falsy when id or source are missing', () => {
    const config = image.renderer({ instance, context })
    // Only type, no id or source
    expect(config.validate('figure', 1)).toBeFalsy()
  })

  it('render returns empty string for close token', () => {
    const config = image.renderer({ instance, context })
    const tokens = [
      {
        type: 'container_figure_close',
        info: 'figure:test-id source="img.jpg"',
        map: [0, 1],
        children: null,
      },
    ]
    expect(config.render(tokens, 0)).toBe('')
  })

  it('renderer config includes markerOpen', () => {
    const config = image.renderer({ instance, context })
    expect(config.markerOpen).toBeDefined()
  })

  it('render calls prepare and createFigure for figure type token', () => {
    const config = image.renderer({ instance, context })
    const tokens = [
      {
        type: 'container_figure_open',
        info: 'figure:test-id source="test.jpg"',
        map: [0, 1],
        children: null,
      },
    ]
    const result = config.render(tokens, 0)
    expect(createFigure).toHaveBeenCalled()
    expect(result).toBe('<div class="figure">test figure</div>')
  })

  it('render calls createFigureInline for figure-inline type token', () => {
    const config = image.renderer({ instance, context })
    const tokens = [
      {
        type: 'container_figure_open',
        info: 'figure-inline:test-id source="test.jpg"',
        map: [0, 1],
        children: null,
      },
    ]
    const result = config.render(tokens, 0)
    expect(createFigureInline).toHaveBeenCalled()
    expect(result).toBe('<div class="figure-inline">test inline</div>')
  })

  it('render passes caption to prepare via renderInline when children are present', () => {
    const config = image.renderer({ instance, context })
    const tokens = [
      {
        type: 'container_figure_open',
        info: 'figure:cap-id source="test.jpg"',
        map: [0, 1],
        children: 'caption text',
      },
    ]
    config.render(tokens, 0)
    expect(instance.renderInline).toHaveBeenCalledWith('caption text')
  })

  it('validate logs error and returns false when id is undefined', () => {
    const config = image.renderer({ instance, context })
    // 'figure' with no id — id is undefined
    const result = config.validate('figure', 1)
    expect(result).toBeFalsy()
    expect(log.error).toHaveBeenCalled()
  })
})
