import {
  bindResizeHandlers,
  handleResize,
  handleResizeEnd,
  handleResizeStart,
  unbindResizeHandlers,
} from '../../../src/components/Reader/resize'
import Viewport from '../../../src/helpers/Viewport'

function createSelf(overrides = {}) {
  const self = {
    state: {
      disableMobileResizeEvents: false,
      spreadIndex: 0,
      ...overrides.state,
    },
    props: {
      readerSettings: { layout: 'columns' },
      view: { lastSpreadIndex: 4 },
      viewerSettingsActions: { update: jest.fn() },
      viewActions: { unload: jest.fn() },
      ...overrides.props,
    },
    setState: jest.fn((update) => {
      Object.assign(self.state, update)
    }),
    freeze: jest.fn(),
    navigateToSpreadByIndex: jest.fn(),
    handleResize: jest.fn(),
    handleResizeStart: jest.fn(),
    handleResizeEnd: jest.fn(),
  }

  return self
}

describe('handleResize', () => {
  afterEach(() => jest.restoreAllMocks())

  test('does nothing when mobile resize events are disabled', () => {
    const self = createSelf({ state: { disableMobileResizeEvents: true } })

    handleResize.call(self)

    expect(self.props.viewerSettingsActions.update).not.toHaveBeenCalled()
  })

  test('sets height to "auto" when vertically scrolling', () => {
    jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(true)
    const self = createSelf()

    handleResize.call(self)

    expect(self.props.viewerSettingsActions.update).toHaveBeenCalledWith(
      expect.objectContaining({
        width: window.innerWidth,
        height: 'auto',
      })
    )
  })

  test('sets height to window.innerHeight when paginated', () => {
    jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)
    const self = createSelf()

    handleResize.call(self)

    expect(self.props.viewerSettingsActions.update).toHaveBeenCalledWith(
      expect.objectContaining({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    )
  })
})

describe('handleResizeStart', () => {
  test('does nothing when mobile resize events are disabled', () => {
    const self = createSelf({ state: { disableMobileResizeEvents: true } })

    handleResizeStart.call(self)

    expect(self.freeze).not.toHaveBeenCalled()
    expect(self.props.viewActions.unload).not.toHaveBeenCalled()
    expect(self.setState).not.toHaveBeenCalled()
  })

  test('freezes the UI, unloads the view, and stores the relative spread position', () => {
    const self = createSelf({
      state: { spreadIndex: 2 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    handleResizeStart.call(self)

    expect(self.freeze).toHaveBeenCalled()
    expect(self.props.viewActions.unload).toHaveBeenCalled()
    expect(self.state.relativeSpreadPosition).toBe(0.5)
  })

  test('uses a relative spread position of 0 when on the first spread', () => {
    const self = createSelf({
      state: { spreadIndex: 0 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    handleResizeStart.call(self)

    expect(self.state.relativeSpreadPosition).toBe(0)
  })

  test('uses a relative spread position of 0 when lastSpreadIndex is 0', () => {
    const self = createSelf({
      state: { spreadIndex: 0 },
      props: { view: { lastSpreadIndex: 0 } },
    })

    handleResizeStart.call(self)

    expect(self.state.relativeSpreadPosition).toBe(0)
  })
})

describe('handleResizeEnd', () => {
  test('does nothing when mobile resize events are disabled', () => {
    const self = createSelf({ state: { disableMobileResizeEvents: true } })

    handleResizeEnd.call(self)

    expect(self.navigateToSpreadByIndex).not.toHaveBeenCalled()
  })

  test('navigates to the spread closest to the relative position before resize', () => {
    const self = createSelf({
      state: { relativeSpreadPosition: 0.5 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    handleResizeEnd.call(self)

    expect(self.navigateToSpreadByIndex).toHaveBeenCalledWith(2)
  })

  test('clamps the spread index to 0 when the relative position is negative', () => {
    const self = createSelf({
      state: { relativeSpreadPosition: -1 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    handleResizeEnd.call(self)

    expect(self.navigateToSpreadByIndex).toHaveBeenCalledWith(0)
  })

  test('clamps the spread index to lastSpreadIndex when the relative position exceeds 1', () => {
    const self = createSelf({
      state: { relativeSpreadPosition: 2 },
      props: { view: { lastSpreadIndex: 4 } },
    })

    handleResizeEnd.call(self)

    expect(self.navigateToSpreadByIndex).toHaveBeenCalledWith(4)
  })
})

describe('bindResizeHandlers / unbindResizeHandlers', () => {
  test('removes and (re)adds resize and fullscreenchange listeners without throwing', () => {
    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    const docAddSpy = jest.spyOn(document, 'addEventListener')
    const docRemoveSpy = jest.spyOn(document, 'removeEventListener')

    const self = createSelf()

    expect(() => bindResizeHandlers.call(self)).not.toThrow()
    expect(removeSpy).toHaveBeenCalledWith('resize', self.handleResize)
    expect(removeSpy).toHaveBeenCalledWith('resize', self.handleResizeStart)
    expect(removeSpy).toHaveBeenCalledWith('resize', self.handleResizeEnd)
    expect(docRemoveSpy).toHaveBeenCalledTimes(3)

    expect(() => unbindResizeHandlers.call(self)).not.toThrow()
    expect(addSpy).toHaveBeenCalledWith('resize', self.handleResize)
    expect(addSpy).toHaveBeenCalledWith('resize', self.handleResizeStart)
    expect(addSpy).toHaveBeenCalledWith('resize', self.handleResizeEnd)
    expect(docAddSpy).toHaveBeenCalledTimes(2)

    addSpy.mockRestore()
    removeSpy.mockRestore()
    docAddSpy.mockRestore()
    docRemoveSpy.mockRestore()
  })
})
