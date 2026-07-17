import * as DOM from '../../src/helpers/DOM'

describe('DOM', () => {
  let warnSpy

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    jest.restoreAllMocks()
  })

  test('returns null and warns when elem is falsy', () => {
    expect(DOM.getPostionLeftFromMatrix(null)).toBe(null)
    expect(warnSpy).toHaveBeenCalled()
  })

  test('returns null and warns when elem has no nodeType', () => {
    expect(DOM.getPostionLeftFromMatrix({})).toBe(null)
    expect(warnSpy).toHaveBeenCalled()
  })

  test('returns null and warns when nodeType < 1', () => {
    expect(DOM.getPostionLeftFromMatrix({ nodeType: 0 })).toBe(null)
    expect(warnSpy).toHaveBeenCalled()
  })

  test('returns the translateX value parsed from the matrix', () => {
    const elem = document.createElement('div')

    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      transform: 'matrix(1, 0, 0, 1, 42, 0)',
    })

    expect(DOM.getPostionLeftFromMatrix(elem)).toBe(42)
  })
})
