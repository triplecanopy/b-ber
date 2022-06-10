import ViewerSettings from '../../src/models/ViewerSettings'
import { transitions, themes } from '../../src/constants'

console.error = jest.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('ViewerSettings', () => {
  test('creates the viewer settings', () => {
    let vs

    vs = new ViewerSettings({})

    expect(vs.settings).toEqual(
      expect.objectContaining({
        paddingTop: expect.any(Function),
        paddingLeft: expect.any(Function),
        paddingRight: expect.any(Function),
        paddingBottom: expect.any(Function),
        fontSize: expect.any(Function),
        columnGap: expect.any(Function),
        columnWidth: expect.any(Function),
        theme: themes.DEFAULT,
        transition: transitions.SLIDE,
        transitionSpeed: expect.any(Number),
        width: expect.any(Number),
      })
    )

    vs = new ViewerSettings({ fontSize: 1 })

    expect(vs.settings).toEqual(
      expect.objectContaining({
        fontSize: 1,
      })
    )
  })

  test('gets properties using lenses', () => {
    const vs = new ViewerSettings({})

    expect(vs.paddingTop).toBeNumber()
    expect(vs.paddingLeft).toBeNumber()
    expect(vs.paddingRight).toBeNumber()
    expect(vs.paddingBottom).toBeNumber()
    expect(vs.paddingX).toBeNumber()
    expect(vs.paddingY).toEqual(vs.paddingTop + vs.paddingBottom)
    expect(vs.columns).toEqual(ViewerSettings.defaults.columns)
    expect(vs.columnGap).toBeNumber()
    expect(vs.transition).toEqual(ViewerSettings.defaults.transition)
    expect(vs.transitionSpeed).toEqual(ViewerSettings.defaults.transitionSpeed)
    expect(vs.theme).toEqual(ViewerSettings.defaults.theme)
  })

  test('sets properties using lenses', () => {
    const vs = new ViewerSettings({})

    vs.paddingTop = 1
    vs.paddingLeft = 1
    vs.paddingRight = 1
    vs.paddingBottom = 1
    vs.columns = 1
    vs.columnGap = 1
    vs.transition = 1
    vs.transitionSpeed = 1
    vs.theme = 1

    expect(vs.paddingTop).toBe(1)
    expect(vs.paddingLeft).toBe(1)
    expect(vs.paddingRight).toBe(1)
    expect(vs.paddingBottom).toBe(1)
    expect(vs.columns).toBe(1)
    expect(vs.columnGap).toBe(1)
    expect(vs.transition).toBe(1)
    expect(vs.transitionSpeed).toBe(1)
    expect(vs.theme).toBe(1)

    expect(() => (vs.paddingX = 1)).toThrow()
    expect(() => (vs.paddingY = 1)).toThrow()
  })

  it('sets properties using shorthand values', () => {
    const vs = new ViewerSettings({})

    vs.padding = [1, 2, 3, 4]

    expect(vs.paddingTop).toBe(1)
    expect(vs.paddingRight).toBe(2)
    expect(vs.paddingBottom).toBe(3)
    expect(vs.paddingLeft).toBe(4)
  })

  it('uses custom lenses', () => {
    const vs = new ViewerSettings({})

    expect(typeof vs.fontSize).toBe('string')

    vs.fontSize = '100%'
    expect(vs.fontSize).toBe('100%')
  })

  it('gets properties by key', () => {
    const vs = new ViewerSettings({})

    expect(vs.get('paddingTop')).toBeNumber()
    expect(vs.get('paddingLeft')).toBeNumber()
    expect(vs.get('paddingRight')).toBeNumber()
    expect(vs.get('paddingBottom')).toBeNumber()
    expect(vs.get('columns')).toBe(ViewerSettings.defaults.columns)
    expect(vs.get('columnGap')).toBeNumber()
    expect(vs.get('transition')).toBe(ViewerSettings.defaults.transition)
    expect(vs.get('transitionSpeed')).toBe(
      ViewerSettings.defaults.transitionSpeed
    )
    expect(vs.get('theme')).toBe(ViewerSettings.defaults.theme)

    expect(vs.get()).toEqual(
      expect.objectContaining({
        paddingTop: expect.any(Number),
        paddingLeft: expect.any(Number),
        paddingRight: expect.any(Number),
        paddingBottom: expect.any(Number),
        fontSize: expect.any(String),
        columnGap: expect.any(Number),
        columnWidth: expect.any(Number),
        theme: themes.DEFAULT,
        transition: transitions.SLIDE,
        transitionSpeed: expect.any(Number),
      })
    )
  })

  it('sets properties by key', () => {
    const vs = new ViewerSettings({})

    vs.put('width', 1)
    vs.put('height', 1)
    vs.put('paddingTop', 1)
    vs.put('paddingLeft', 1)
    vs.put('paddingRight', 1)
    vs.put('paddingBottom', 1)
    // vs.put('paddingX', 1)
    // vs.put('paddingY', 1)
    vs.put('columns', 1)
    vs.put('columnGap', 1)
    vs.put('columnWidth', 1)
    vs.put('transition', 1)
    vs.put('theme', 1)
    vs.put('transitionSpeed', 1)
    vs.put('fontSize', 1)

    expect(vs.width).toBe(1)
    expect(vs.height).toBe(1)
    expect(vs.paddingTop).toBe(1)
    expect(vs.paddingLeft).toBe(1)
    expect(vs.paddingRight).toBe(1)
    expect(vs.paddingBottom).toBe(1)
    expect(vs.paddingX).toBe(2)
    expect(vs.paddingY).toBe(2)
    expect(vs.columns).toBe(1)
    expect(vs.columnGap).toBe(1)
    expect(vs.columnWidth).toBe(1)
    expect(vs.transition).toBe(1)
    expect(vs.theme).toBe(1)
    expect(vs.transitionSpeed).toBe(1)
    expect(vs.fontSize).toBe(1)

    vs.put({ fontSize: '100%', paddingTop: 10, paddingBottom: 10 })
    expect(vs.fontSize).toBe('100%')
    expect(vs.paddingBottom).toBe(10)
    expect(vs.paddingY).toBe(20)

    vs.put('paddingLeft', () => 11)
    expect(vs.paddingLeft).toBe(11)
    expect(vs.paddingX).toBe(12)

    vs.put(['bogus'])
    expect(console.error).toHaveBeenCalled()

    vs.put({ bogus: 1 })
    expect(console.error).toHaveBeenCalled()

    vs.put('bogus', 1)
    expect(console.error).toHaveBeenCalled()
  })
})
