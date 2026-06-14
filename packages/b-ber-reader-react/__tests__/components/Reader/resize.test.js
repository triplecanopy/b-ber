import { renderHook } from '@testing-library/react'
import { useResize } from '../../../src/components/Reader/resize'
import Viewport from '../../../src/helpers/Viewport'

// useResize reads live state/props through refs and resolves cross-cutting calls
// (freeze, navigateToSpreadByIndex) through `api`. handleResizeStart/End are
// debounced (start: leading edge → fires synchronously on first call; end:
// trailing edge → fires after 1000ms, so those tests advance fake timers).
function createDeps(overrides = {}) {
  const stateRef = {
    current: {
      disableMobileResizeEvents: false,
      spreadIndex: 0,
      ...overrides.state,
    },
  }

  const propsRef = {
    current: {
      readerSettings: { layout: 'columns' },
      view: { lastSpreadIndex: 4 },
      viewerSettingsActions: { update: jest.fn() },
      viewActions: { unload: jest.fn() },
      ...overrides.props,
    },
  }

  const setState = jest.fn((update) => {
    Object.assign(stateRef.current, update)
  })

  const api = {
    current: {
      freeze: jest.fn(),
      navigateToSpreadByIndex: jest.fn(),
      ...overrides.api,
    },
  }

  const deps = { stateRef, propsRef, setState, api }
  const { result } = renderHook(() => useResize(deps))

  return { ...deps, resize: result.current }
}

describe('handleResize', () => {
  afterEach(() => jest.restoreAllMocks())

  test('does nothing when mobile resize events are disabled', () => {
    const { resize, propsRef } = createDeps({
      state: { disableMobileResizeEvents: true },
    })

    resize.handleResize()

    expect(propsRef.current.viewerSettingsActions.update).not.toHaveBeenCalled()
  })

  test('sets height to "auto" when vertically scrolling', () => {
    jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(true)
    const { resize, propsRef } = createDeps()

    resize.handleResize()

    expect(propsRef.current.viewerSettingsActions.update).toHaveBeenCalledWith(
      expect.objectContaining({
        width: window.innerWidth,
        height: 'auto',
      })
    )
  })

  test('sets height to window.innerHeight when paginated', () => {
    jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)
    const { resize, propsRef } = createDeps()

    resize.handleResize()

    expect(propsRef.current.viewerSettingsActions.update).toHaveBeenCalledWith(
      expect.objectContaining({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    )
  })
})

describe('handleResizeStart', () => {
  // The leading-edge debounce fires synchronously on the first call.
  test('does nothing when mobile resize events are disabled', () => {
    const { resize, api, propsRef, setState } = createDeps({
      state: { disableMobileResizeEvents: true },
    })

    resize.handleResizeStart()

    expect(api.current.freeze).not.toHaveBeenCalled()
    expect(propsRef.current.viewActions.unload).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
  })

  test('freezes the UI, unloads the view, and stores the relative spread position', () => {
    const { resize, api, propsRef, stateRef } = createDeps({
      state: { spreadIndex: 2 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    resize.handleResizeStart()

    expect(api.current.freeze).toHaveBeenCalled()
    expect(propsRef.current.viewActions.unload).toHaveBeenCalled()
    expect(stateRef.current.relativeSpreadPosition).toBe(0.5)
  })

  test('uses a relative spread position of 0 when on the first spread', () => {
    const { resize, stateRef } = createDeps({
      state: { spreadIndex: 0 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    resize.handleResizeStart()

    expect(stateRef.current.relativeSpreadPosition).toBe(0)
  })

  test('uses a relative spread position of 0 when lastSpreadIndex is 0', () => {
    const { resize, stateRef } = createDeps({
      state: { spreadIndex: 0 },
      props: { view: { lastSpreadIndex: 0 } },
    })

    resize.handleResizeStart()

    expect(stateRef.current.relativeSpreadPosition).toBe(0)
  })
})

describe('handleResizeEnd', () => {
  // The trailing-edge debounce fires after the 1000ms quiet period.
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('does nothing when mobile resize events are disabled', () => {
    const { resize, api } = createDeps({
      state: { disableMobileResizeEvents: true },
    })

    resize.handleResizeEnd()
    jest.advanceTimersByTime(1000)

    expect(api.current.navigateToSpreadByIndex).not.toHaveBeenCalled()
  })

  test('navigates to the spread closest to the relative position before resize', () => {
    const { resize, api } = createDeps({
      state: { relativeSpreadPosition: 0.5 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    resize.handleResizeEnd()
    jest.advanceTimersByTime(1000)

    expect(api.current.navigateToSpreadByIndex).toHaveBeenCalledWith(2)
  })

  test('clamps the spread index to 0 when the relative position is negative', () => {
    const { resize, api } = createDeps({
      state: { relativeSpreadPosition: -1 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    resize.handleResizeEnd()
    jest.advanceTimersByTime(1000)

    expect(api.current.navigateToSpreadByIndex).toHaveBeenCalledWith(0)
  })

  test('clamps the spread index to lastSpreadIndex when the relative position exceeds 1', () => {
    const { resize, api } = createDeps({
      state: { relativeSpreadPosition: 2 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    resize.handleResizeEnd()
    jest.advanceTimersByTime(1000)

    expect(api.current.navigateToSpreadByIndex).toHaveBeenCalledWith(4)
  })
})

describe('bindResizeHandlers / unbindResizeHandlers', () => {
  test('removes and (re)adds resize and fullscreenchange listeners without throwing', () => {
    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    const docAddSpy = jest.spyOn(document, 'addEventListener')
    const docRemoveSpy = jest.spyOn(document, 'removeEventListener')

    const { resize } = createDeps()

    expect(() => resize.bindResizeHandlers()).not.toThrow()
    expect(removeSpy).toHaveBeenCalledWith('resize', resize.handleResize)
    expect(removeSpy).toHaveBeenCalledWith('resize', resize.handleResizeStart)
    expect(removeSpy).toHaveBeenCalledWith('resize', resize.handleResizeEnd)
    expect(docRemoveSpy).toHaveBeenCalledTimes(3)

    expect(() => resize.unbindResizeHandlers()).not.toThrow()
    expect(addSpy).toHaveBeenCalledWith('resize', resize.handleResize)
    expect(addSpy).toHaveBeenCalledWith('resize', resize.handleResizeStart)
    expect(addSpy).toHaveBeenCalledWith('resize', resize.handleResizeEnd)
    expect(docAddSpy).toHaveBeenCalledTimes(2)

    addSpy.mockRestore()
    removeSpy.mockRestore()
    docAddSpy.mockRestore()
    docRemoveSpy.mockRestore()
  })
})
