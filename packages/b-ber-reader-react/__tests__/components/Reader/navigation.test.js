import { renderHook } from '@testing-library/react'
import { useNavigation } from '../../../src/components/Reader/navigation'
import Viewport from '../../../src/helpers/Viewport'

// useNavigation reads live state/props through refs and resolves cross-cutting
// calls (loadSpineItem, closeSidebars, sibling nav methods) through `api`. This
// builds those deps: `setState` shallow-merges into stateRef.current and invokes
// the callback synchronously (mirroring how the real shim's effect-flushed
// callbacks ultimately run), and `api.current` holds jest.fn stand-ins for the
// cross-cutting calls so each is independently assertable.
function createDeps(overrides = {}) {
  const stateRef = {
    current: {
      spreadIndex: 0,
      currentSpineItemIndex: 0,
      spine: [
        { slug: 'one', absoluteURL: 'https://example.com/one.xhtml' },
        { slug: 'two', absoluteURL: 'https://example.com/two.xhtml' },
        { slug: 'three', absoluteURL: 'https://example.com/three.xhtml' },
      ],
      currentSpineItem: { slug: 'one' },
      ...overrides.state,
    },
  }

  const propsRef = {
    current: {
      view: { lastSpreadIndex: 1 },
      readerSettings: {
        searchParamKeys: {
          slug: 'slug',
          currentSpineItemIndex: 'currentSpineItemIndex',
          spreadIndex: 'spreadIndex',
        },
      },
      readerLocation: { searchParams: '' },
      readerLocationActions: {
        updateLocation: jest.fn(),
        updateLocalStorage: jest.fn(),
      },
      userInterfaceActions: {
        disablePageTransitions: jest.fn(),
      },
      viewerSettings: { paddingTop: 0, paddingBottom: 0, columnGap: 0 },
      ...overrides.props,
    },
  }

  const setState = jest.fn((update, callback) => {
    const partial =
      typeof update === 'function' ? update(stateRef.current) : update
    Object.assign(stateRef.current, partial)
    if (callback) callback()
  })

  const api = {
    current: {
      handleChapterNavigation: jest.fn(),
      updateQueryString: jest.fn(),
      loadSpineItem: jest.fn(),
      savePosition: jest.fn(),
      closeSidebars: jest.fn(),
      navigateToSpreadByIndex: jest.fn(),
      ...overrides.api,
    },
  }

  const deps = { stateRef, propsRef, setState, api }
  const { result } = renderHook(() => useNavigation(deps))

  return { ...deps, nav: result.current }
}

describe('handlePageNavigation', () => {
  test('navigates to the next chapter when the next index is past lastSpreadIndex', () => {
    const { nav, api, setState } = createDeps({ state: { spreadIndex: 1 } })

    nav.handlePageNavigation(1)

    expect(api.current.handleChapterNavigation).toHaveBeenCalledWith(1)
    expect(setState).not.toHaveBeenCalled()
  })

  test('navigates to the previous chapter when the next index is below 0', () => {
    const { nav, api, setState } = createDeps({ state: { spreadIndex: 0 } })

    nav.handlePageNavigation(-1)

    expect(api.current.handleChapterNavigation).toHaveBeenCalledWith(-1)
    expect(setState).not.toHaveBeenCalled()
  })

  test('moves to the next spread within the chapter and updates the query string', () => {
    const { nav, api, stateRef } = createDeps({ state: { spreadIndex: 0 } })

    nav.handlePageNavigation(1)

    expect(api.current.handleChapterNavigation).not.toHaveBeenCalled()
    expect(stateRef.current).toMatchObject({
      spreadIndex: 1,
      firstSpread: false,
      lastSpread: true,
      spreadDelta: 1,
      showSidebar: null,
    })
    expect(api.current.updateQueryString).toHaveBeenCalled()
  })

  test('flags the first spread and a negative spread delta when moving backwards', () => {
    const { nav, stateRef } = createDeps({
      state: { spreadIndex: 1 },
      props: { view: { lastSpreadIndex: 1 } },
    })

    nav.handlePageNavigation(-1)

    expect(stateRef.current).toMatchObject({
      spreadIndex: 0,
      firstSpread: true,
      lastSpread: false,
      spreadDelta: -1,
    })
  })
})

describe('handleChapterNavigation', () => {
  test('flags firstChapter when moving before the first chapter', () => {
    const { nav, api, setState } = createDeps({
      state: { currentSpineItemIndex: 0 },
    })

    nav.handleChapterNavigation(-1)

    expect(setState).toHaveBeenCalledWith({
      firstChapter: true,
      lastChapter: false,
    })
    expect(api.current.loadSpineItem).not.toHaveBeenCalled()
  })

  test('flags lastChapter when moving past the last chapter', () => {
    const { nav, api, setState } = createDeps({
      state: { currentSpineItemIndex: 2 },
    })

    nav.handleChapterNavigation(1)

    expect(setState).toHaveBeenCalledWith({
      firstChapter: false,
      lastChapter: true,
    })
    expect(api.current.loadSpineItem).not.toHaveBeenCalled()
  })

  test('moves to the next chapter and loads/saves position', () => {
    const { nav, api, stateRef } = createDeps({
      state: { currentSpineItemIndex: 0 },
    })

    nav.handleChapterNavigation(1)

    expect(stateRef.current).toMatchObject({
      spreadIndex: 0,
      currentSpineItemIndex: 1,
      currentSpineItem: {
        slug: 'two',
        absoluteURL: 'https://example.com/two.xhtml',
      },
      showSidebar: null,
      firstChapter: false,
      lastChapter: false,
      spreadDelta: 1,
      chapterDelta: 1,
    })
    expect(api.current.loadSpineItem).toHaveBeenCalledWith(
      stateRef.current.currentSpineItem
    )
    expect(api.current.savePosition).toHaveBeenCalled()
  })
})

describe('navigateToSpreadByIndex', () => {
  test('sets the spread index and updates the query string', () => {
    const { nav, api, stateRef, setState } = createDeps()

    nav.navigateToSpreadByIndex(3)

    expect(stateRef.current.spreadIndex).toBe(3)
    expect(setState).toHaveBeenCalledWith(
      { spreadIndex: 3 },
      expect.any(Function)
    )
    expect(api.current.updateQueryString).toHaveBeenCalled()
  })
})

describe('navigateToElementById', () => {
  let warnSpy

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    jest.restoreAllMocks()
  })

  test('warns and bails out when the element is not found', () => {
    jest.spyOn(document, 'querySelector').mockReturnValue(null)
    const { nav, setState } = createDeps()

    nav.navigateToElementById('#missing')

    expect(warnSpy).toHaveBeenCalledWith('Could not find element #missing')
    expect(setState).not.toHaveBeenCalled()
  })

  test('scrolls the frame when the layout is vertically scrolling', () => {
    const target = document.createElement('div')
    Object.defineProperty(target, 'offsetTop', {
      value: 500,
      configurable: true,
    })
    Object.defineProperty(target, 'offsetLeft', {
      value: 0,
      configurable: true,
    })

    const header = document.createElement('div')
    Object.defineProperty(header, 'offsetHeight', {
      value: 50,
      configurable: true,
    })

    const frame = { scrollTo: jest.fn() }

    jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '.bber-controls__header') return header
      return target
    })
    jest.spyOn(document, 'getElementById').mockReturnValue(frame)
    jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(true)

    const { nav, api, setState } = createDeps()
    nav.navigateToElementById('#target')

    // padding (25) + header offsetHeight (50) = 75; top = 500 - 75 = 425
    expect(frame.scrollTo).toHaveBeenCalledWith(0, 425)
    expect(setState).toHaveBeenCalledWith(
      { spreadIndex: 0 },
      expect.any(Function)
    )
    expect(api.current.updateQueryString).toHaveBeenCalled()
  })

  test('computes the spread index from the element position when not scrolling', () => {
    const target = document.createElement('div')
    Object.defineProperty(target, 'offsetTop', { value: 0, configurable: true })
    Object.defineProperty(target, 'offsetLeft', {
      value: 1536,
      configurable: true,
    })

    jest.spyOn(document, 'querySelector').mockReturnValue(target)
    jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)

    const { nav, setState } = createDeps({
      props: {
        viewerSettings: { paddingTop: 0, paddingBottom: 0, columnGap: 0 },
      },
    })

    // jsdom's default window.innerHeight is 768
    nav.navigateToElementById('#target')

    // frameHeight = 768; left = 1536; spreadIndex = floor(1536 / 768 / 2) = 1
    expect(setState).toHaveBeenCalledWith(
      { spreadIndex: 1 },
      expect.any(Function)
    )
  })
})

describe('navigateToChapterByURL', () => {
  test('closes sidebars when navigating to the current chapter', () => {
    const { nav, api, setState } = createDeps({
      state: { currentSpineItemIndex: 0 },
    })

    nav.navigateToChapterByURL('https://example.com/one.xhtml')

    expect(api.current.closeSidebars).toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
  })

  test('warns and bails out when no spine item matches the URL', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { nav, setState } = createDeps({
      state: { currentSpineItemIndex: 0 },
    })

    nav.navigateToChapterByURL('https://example.com/missing.xhtml')

    expect(warnSpy).toHaveBeenCalledWith(
      'No spine item found for https://example.com/missing.xhtml'
    )
    expect(setState).not.toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  test('navigates to the matched chapter, disabling page transitions', () => {
    const { nav, api, propsRef, stateRef } = createDeps({
      state: { currentSpineItemIndex: 0 },
    })

    nav.navigateToChapterByURL('https://example.com/two.xhtml')

    expect(
      propsRef.current.userInterfaceActions.disablePageTransitions
    ).toHaveBeenCalled()
    expect(stateRef.current).toMatchObject({
      currentSpineItem: {
        slug: 'two',
        absoluteURL: 'https://example.com/two.xhtml',
      },
      currentSpineItemIndex: 1,
      spreadIndex: 0,
    })
    expect(api.current.loadSpineItem).toHaveBeenCalledWith(
      stateRef.current.currentSpineItem
    )
    expect(api.current.savePosition).toHaveBeenCalled()
  })
})

describe('getSpineItemByAbsoluteUrl', () => {
  test('returns the index of the matching spine item', () => {
    const { nav } = createDeps()

    expect(nav.getSpineItemByAbsoluteUrl('https://example.com/two.xhtml')).toBe(
      1
    )
  })

  test('returns -1 when no spine item matches', () => {
    const { nav } = createDeps()

    expect(
      nav.getSpineItemByAbsoluteUrl('https://example.com/missing.xhtml')
    ).toBe(-1)
  })

  test('ignores hash and query string when matching', () => {
    const { nav } = createDeps()

    expect(
      nav.getSpineItemByAbsoluteUrl(
        'https://example.com/two.xhtml?foo=bar#section'
      )
    ).toBe(1)
  })
})

describe('updateQueryString', () => {
  test('does nothing when there is no current spine item', () => {
    const { nav, propsRef } = createDeps({ state: { currentSpineItem: null } })

    nav.updateQueryString()

    expect(
      propsRef.current.readerLocationActions.updateLocation
    ).not.toHaveBeenCalled()
  })

  test('updates the location with the current slug, spine index, and spread index', () => {
    const { nav, propsRef } = createDeps({
      state: {
        spreadIndex: 2,
        currentSpineItemIndex: 1,
        currentSpineItem: { slug: 'two' },
      },
    })

    nav.updateQueryString()

    expect(
      propsRef.current.readerLocationActions.updateLocation
    ).toHaveBeenCalledWith({
      searchParams: 'slug=two&currentSpineItemIndex=1&spreadIndex=2',
    })
  })

  test('invokes the callback after updating the location', () => {
    const { nav } = createDeps({
      state: { currentSpineItem: { slug: 'one' } },
    })
    const callback = jest.fn()

    nav.updateQueryString(callback)

    expect(callback).toHaveBeenCalled()
  })
})

describe('savePosition', () => {
  test('persists the current chapter and spread index to local storage', () => {
    const { nav, propsRef } = createDeps({
      state: { currentSpineItemIndex: 1, spreadIndex: 2 },
    })

    nav.savePosition()

    expect(
      propsRef.current.readerLocationActions.updateLocalStorage
    ).toHaveBeenCalledWith({
      searchParams: 'currentSpineItemIndex=1&spreadIndex=2',
    })
  })
})
