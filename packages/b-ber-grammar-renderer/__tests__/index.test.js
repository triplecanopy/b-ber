import log from '@canopycanopycanopy/b-ber-logger'
import renderer from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  // Returns an Error, as the real log.error does, so that a site's
  // `throw log.error(...)` throws one rather than undefined
  error: jest.fn((err) =>
    err instanceof Error ? err : new Error(String(err))
  ),
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

  it('validateOpen throws what log.error reports when id is missing', () => {
    const noIdMarker = /^(chapter)(?::)?/
    const configNoId = renderer({
      context,
      render: renderFn,
      markerOpen: noIdMarker,
      markerClose,
    })
    expect(() => configNoId.validateOpen('chapter', 1)).toThrow('Missing [id]')
    expect(log.error).toHaveBeenCalled()
  })

  // Ids used to be recorded in `state.cursor` here, which threw on a duplicate
  // and claimed only the exit of an open block. The build's directive rule
  // does both, per file (TASK-175)
  it('validateOpen returns true for an opener or an exit with an id, recording nothing', () => {
    const exitMarker = /^(chapter|exit)(?::([^\s]+))?/
    const config = renderer({
      context,
      render: renderFn,
      markerOpen: exitMarker,
      markerClose,
    })
    expect(config.validateOpen('chapter:ch-01', 1)).toBe(true)
    expect(config.validateOpen('chapter:ch-01', 5)).toBe(true)
    expect(config.validateOpen('exit:ch-99', 10)).toBe(true)
    expect(log.error).not.toHaveBeenCalled()
  })
})
