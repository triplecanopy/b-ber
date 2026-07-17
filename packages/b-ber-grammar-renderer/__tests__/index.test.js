import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import renderer from '../src'

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

afterEach(() => {
  jest.clearAllMocks()
})

const markerOpen = /^(chapter|section)(?::([^\s]+))?/
const markerClose = /^exit/
const renderFn = jest.fn(() => '')
const context = { fileName: 'test' }

describe('b-ber-grammar-renderer', () => {
  it('exports a function', () => {
    expect(renderer).toBeFunction()
  })

  it('returns a config object with expected properties', () => {
    const config = renderer({
      context,
      render: renderFn,
      markerOpen,
      markerClose,
    })
    expect(config.render).toBeFunction()
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.markerOpen).toBe(markerOpen)
    expect(config.markerClose).toBe(markerClose)
    expect(config.validateOpen).toBeFunction()
  })

  it('validateOpen returns false for params that do not match markerOpen', () => {
    const config = renderer({
      context,
      render: renderFn,
      markerOpen,
      markerClose,
    })
    expect(config.validateOpen('pullquote:pq-01', 1)).toBe(false)
  })

  it('validateOpen returns false when id is missing', () => {
    const noIdMarker = /^(chapter)(?::)?/
    const configNoId = renderer({
      context,
      render: renderFn,
      markerOpen: noIdMarker,
      markerClose,
    })
    const result = configNoId.validateOpen('chapter', 1)
    expect(result).toBe(false)
    expect(log.error).toHaveBeenCalled()
  })

  it('validateOpen returns true for valid new directive', () => {
    state.indexOf.mockReturnValue(-1)
    const config = renderer({
      context,
      render: renderFn,
      markerOpen,
      markerClose,
    })
    const result = config.validateOpen('chapter:ch-01', 1)
    expect(result).toBe(true)
    expect(state.add).toHaveBeenCalledWith('cursor', {
      id: 'ch-01',
      type: 'chapter',
    })
  })

  it('validateOpen returns falsy and logs error when id is already in state (duplicate)', () => {
    state.indexOf.mockReturnValue(0)
    const config = renderer({
      context,
      render: renderFn,
      markerOpen,
      markerClose,
    })
    const result = config.validateOpen('chapter:ch-duplicate', 5)
    expect(result).toBeFalsy()
    expect(log.error).toHaveBeenCalled()
  })

  it('validateOpen returns false when closing a directive that is not open', () => {
    state.indexOf.mockReturnValue(-1)
    const exitMarker = /^(exit)(?::([^\s]+))?/
    const config = renderer({
      context,
      render: renderFn,
      markerOpen: exitMarker,
      markerClose,
    })
    expect(config.validateOpen('exit:ch-99', 10)).toBe(false)
  })

  it('validateOpen returns true when closing a directive that is open', () => {
    state.indexOf.mockReturnValue(0)
    const exitMarker = /^(exit)(?::([^\s]+))?/
    const config = renderer({
      context,
      render: renderFn,
      markerOpen: exitMarker,
      markerClose,
    })
    expect(config.validateOpen('exit:ch-01', 10)).toBe(true)
  })
})
