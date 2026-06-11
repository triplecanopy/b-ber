import {
  getSpineItemByAbsoluteUrl,
  handleChapterNavigation,
  handlePageNavigation,
  navigateToChapterByURL,
  navigateToElementById,
  navigateToSpreadByIndex,
  savePosition,
  updateQueryString,
} from '../../../src/components/Reader/navigation'
import Viewport from '../../../src/helpers/Viewport'

// Builds a fake `self` (the selfRef shim Reader/index.jsx binds these
// functions to). `setState` shallow-merges into `self.state` and invokes the
// callback synchronously, mirroring how the real shim's effect-flushed
// callbacks ultimately run.
function createSelf(overrides = {}) {
  const self = {
    state: {
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
    props: {
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
    setState: jest.fn((update, callback) => {
      const partial = typeof update === 'function' ? update(self.state) : update
      Object.assign(self.state, partial)
      if (callback) callback()
    }),
    handleChapterNavigation: jest.fn(),
    updateQueryString: jest.fn(),
    loadSpineItem: jest.fn(),
    savePosition: jest.fn(),
    closeSidebars: jest.fn(),
    navigateToSpreadByIndex: jest.fn(),
  }

  return self
}

describe('handlePageNavigation', () => {
  test('navigates to the next chapter when the next index is past lastSpreadIndex', () => {
    const self = createSelf({ state: { spreadIndex: 1 } })

    handlePageNavigation.call(self, 1)

    expect(self.handleChapterNavigation).toHaveBeenCalledWith(1)
    expect(self.setState).not.toHaveBeenCalled()
  })

  test('navigates to the previous chapter when the next index is below 0', () => {
    const self = createSelf({ state: { spreadIndex: 0 } })

    handlePageNavigation.call(self, -1)

    expect(self.handleChapterNavigation).toHaveBeenCalledWith(-1)
    expect(self.setState).not.toHaveBeenCalled()
  })

  test('moves to the next spread within the chapter and updates the query string', () => {
    const self = createSelf({ state: { spreadIndex: 0 } })

    handlePageNavigation.call(self, 1)

    expect(self.handleChapterNavigation).not.toHaveBeenCalled()
    expect(self.state).toMatchObject({
      spreadIndex: 1,
      firstSpread: false,
      lastSpread: true,
      spreadDelta: 1,
      showSidebar: null,
    })
    expect(self.updateQueryString).toHaveBeenCalled()
  })

  test('flags the first spread and a negative spread delta when moving backwards', () => {
    const self = createSelf({
      state: { spreadIndex: 1 },
      props: { view: { lastSpreadIndex: 1 } },
    })

    handlePageNavigation.call(self, -1)

    expect(self.state).toMatchObject({
      spreadIndex: 0,
      firstSpread: true,
      lastSpread: false,
      spreadDelta: -1,
    })
  })
})

describe('handleChapterNavigation', () => {
  test('flags firstChapter when moving before the first chapter', () => {
    const self = createSelf({ state: { currentSpineItemIndex: 0 } })

    handleChapterNavigation.call(self, -1)

    expect(self.setState).toHaveBeenCalledWith({
      firstChapter: true,
      lastChapter: false,
    })
    expect(self.loadSpineItem).not.toHaveBeenCalled()
  })

  test('flags lastChapter when moving past the last chapter', () => {
    const self = createSelf({ state: { currentSpineItemIndex: 2 } })

    handleChapterNavigation.call(self, 1)

    expect(self.setState).toHaveBeenCalledWith({
      firstChapter: false,
      lastChapter: true,
    })
    expect(self.loadSpineItem).not.toHaveBeenCalled()
  })

  test('moves to the next chapter and loads/saves position', () => {
    const self = createSelf({ state: { currentSpineItemIndex: 0 } })

    handleChapterNavigation.call(self, 1)

    expect(self.state).toMatchObject({
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
    expect(self.loadSpineItem).toHaveBeenCalledWith(self.state.currentSpineItem)
    expect(self.savePosition).toHaveBeenCalled()
  })
})

describe('navigateToSpreadByIndex', () => {
  test('sets the spread index and updates the query string', () => {
    const self = createSelf()

    navigateToSpreadByIndex.call(self, 3)

    expect(self.state.spreadIndex).toBe(3)
    expect(self.setState).toHaveBeenCalledWith(
      { spreadIndex: 3 },
      self.updateQueryString
    )
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
    const self = createSelf()

    navigateToElementById.call(self, '#missing')

    expect(warnSpy).toHaveBeenCalledWith('Could not find element #missing')
    expect(self.setState).not.toHaveBeenCalled()
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

    const self = createSelf()
    navigateToElementById.call(self, '#target')

    // padding (25) + header offsetHeight (50) = 75; top = 500 - 75 = 425
    expect(frame.scrollTo).toHaveBeenCalledWith(0, 425)
    expect(self.setState).toHaveBeenCalledWith(
      { spreadIndex: 0 },
      self.updateQueryString
    )
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

    const self = createSelf({
      props: {
        viewerSettings: { paddingTop: 0, paddingBottom: 0, columnGap: 0 },
      },
    })

    // jsdom's default window.innerHeight is 768
    navigateToElementById.call(self, '#target')

    // frameHeight = 768; left = 1536; spreadIndex = floor(1536 / 768 / 2) = 1
    expect(self.setState).toHaveBeenCalledWith(
      { spreadIndex: 1 },
      self.updateQueryString
    )
  })
})

describe('navigateToChapterByURL', () => {
  test('closes sidebars when navigating to the current chapter', () => {
    const self = createSelf({ state: { currentSpineItemIndex: 0 } })

    navigateToChapterByURL.call(self, 'https://example.com/one.xhtml')

    expect(self.closeSidebars).toHaveBeenCalled()
    expect(self.setState).not.toHaveBeenCalled()
  })

  test('warns and bails out when no spine item matches the URL', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const self = createSelf({ state: { currentSpineItemIndex: 0 } })

    navigateToChapterByURL.call(self, 'https://example.com/missing.xhtml')

    expect(warnSpy).toHaveBeenCalledWith(
      'No spine item found for https://example.com/missing.xhtml'
    )
    expect(self.setState).not.toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  test('navigates to the matched chapter, disabling page transitions', () => {
    const self = createSelf({ state: { currentSpineItemIndex: 0 } })

    navigateToChapterByURL.call(self, 'https://example.com/two.xhtml')

    expect(
      self.props.userInterfaceActions.disablePageTransitions
    ).toHaveBeenCalled()
    expect(self.state).toMatchObject({
      currentSpineItem: {
        slug: 'two',
        absoluteURL: 'https://example.com/two.xhtml',
      },
      currentSpineItemIndex: 1,
      spreadIndex: 0,
    })
    expect(self.loadSpineItem).toHaveBeenCalledWith(self.state.currentSpineItem)
    expect(self.savePosition).toHaveBeenCalled()
  })
})

describe('getSpineItemByAbsoluteUrl', () => {
  test('returns the index of the matching spine item', () => {
    const self = createSelf()

    expect(
      getSpineItemByAbsoluteUrl.call(self, 'https://example.com/two.xhtml')
    ).toBe(1)
  })

  test('returns -1 when no spine item matches', () => {
    const self = createSelf()

    expect(
      getSpineItemByAbsoluteUrl.call(self, 'https://example.com/missing.xhtml')
    ).toBe(-1)
  })

  test('ignores hash and query string when matching', () => {
    const self = createSelf()

    expect(
      getSpineItemByAbsoluteUrl.call(
        self,
        'https://example.com/two.xhtml?foo=bar#section'
      )
    ).toBe(1)
  })
})

describe('updateQueryString', () => {
  test('does nothing when there is no current spine item', () => {
    const self = createSelf({ state: { currentSpineItem: null } })

    updateQueryString.call(self)

    expect(
      self.props.readerLocationActions.updateLocation
    ).not.toHaveBeenCalled()
  })

  test('updates the location with the current slug, spine index, and spread index', () => {
    const self = createSelf({
      state: {
        spreadIndex: 2,
        currentSpineItemIndex: 1,
        currentSpineItem: { slug: 'two' },
      },
    })

    updateQueryString.call(self)

    expect(
      self.props.readerLocationActions.updateLocation
    ).toHaveBeenCalledWith({
      searchParams: 'slug=two&currentSpineItemIndex=1&spreadIndex=2',
    })
  })

  test('invokes the callback after updating the location', () => {
    const self = createSelf({
      state: { currentSpineItem: { slug: 'one' } },
    })
    const callback = jest.fn()

    updateQueryString.call(self, callback)

    expect(callback).toHaveBeenCalled()
  })
})

describe('savePosition', () => {
  test('persists the current chapter and spread index to local storage', () => {
    const self = createSelf({
      state: { currentSpineItemIndex: 1, spreadIndex: 2 },
    })

    savePosition.call(self)

    expect(
      self.props.readerLocationActions.updateLocalStorage
    ).toHaveBeenCalledWith({
      searchParams: 'currentSpineItemIndex=1&spreadIndex=2',
    })
  })
})
