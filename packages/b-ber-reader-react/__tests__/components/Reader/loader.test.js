jest.mock('../../../src/helpers/Asset')
jest.mock('../../../src/helpers/Request')
jest.mock('../../../src/helpers/Storage')
jest.mock('../../../src/helpers/XMLAdaptor')

import {
  book,
  createStateFromOPF,
  loadSpineItem,
  showSpineItem,
} from '../../../src/components/Reader/loader'
import Asset from '../../../src/helpers/Asset'
import Request from '../../../src/helpers/Request'
import Storage from '../../../src/helpers/Storage'
import XMLAdaptor from '../../../src/helpers/XMLAdaptor'

// Builds a fake `self` (the selfRef shim Reader/index.jsx binds these
// functions to). `setState` shallow-merges into `self.state` and invokes the
// callback synchronously, mirroring how the real shim's effect-flushed
// callbacks ultimately run.
function createSelf(overrides = {}) {
  const self = {
    state: {
      spine: [
        { slug: 'one', absoluteURL: 'https://example.com/one.xhtml' },
        { slug: 'two', absoluteURL: 'https://example.com/two.xhtml' },
        { slug: 'three', absoluteURL: 'https://example.com/three.xhtml' },
      ],
      spreadIndex: 0,
      currentSpineItemIndex: 0,
      cache: {},
      opsURL: 'https://example.com/OPS/',
      ...overrides.state,
    },
    props: {
      readerSettings: { bookURL: 'https://example.com/book' },
      view: { lastSpreadIndex: 1 },
      viewerSettings: { paddingLeft: 0, columnGap: 0 },
      userInterfaceActions: { update: jest.fn() },
      ...overrides.props,
    },
    setState: jest.fn((update, callback) => {
      const partial = typeof update === 'function' ? update(self.state) : update
      Object.assign(self.state, partial)
      if (callback) callback()
    }),
    freeze: jest.fn(),
    savePosition: jest.fn(),
    updateQueryString: jest.fn((cb) => {
      if (cb) cb()
    }),
    showSpineItem: jest.fn(),
    ...overrides.self,
  }

  return self
}

describe('createStateFromOPF', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    XMLAdaptor.opfURL.mockReturnValue(
      'https://example.com/book/OPS/package.opf'
    )
    XMLAdaptor.opsURL.mockReturnValue('https://example.com/book/OPS/')
    Request.getText.mockResolvedValue('<opf/>')
    XMLAdaptor.parseOPF.mockResolvedValue({ rootNode: 'opf' })
    XMLAdaptor.parseNCX.mockResolvedValue({ rootNode: 'opf', __ncx: 'ncx' })
    XMLAdaptor.createGuideItems.mockResolvedValue({ guide: ['guide-item'] })
    XMLAdaptor.createSpineItems.mockResolvedValue({ spine: ['spine-item'] })
    XMLAdaptor.udpateGuideItemURLs.mockResolvedValue({
      guide: ['guide-item-updated'],
    })
    XMLAdaptor.udpateSpineItemURLs.mockResolvedValue({
      spine: ['spine-item-updated'],
    })
    XMLAdaptor.createBookMetadata.mockResolvedValue({
      guide: ['guide-item-updated'],
      spine: ['spine-item-updated'],
      metadata: { title: 'Test Book' },
    })
  })

  test('fetches and parses the OPF/NCX, then sets state with the merged data and opsURL', async () => {
    const self = createSelf()
    const callback = jest.fn()

    await createStateFromOPF.call(self, callback)

    expect(XMLAdaptor.opfURL).toHaveBeenCalledWith('https://example.com/book')
    expect(XMLAdaptor.opsURL).toHaveBeenCalledWith('https://example.com/book')
    expect(Request.getText).toHaveBeenCalledWith(
      'https://example.com/book/OPS/package.opf'
    )
    expect(XMLAdaptor.parseOPF).toHaveBeenCalledWith('<opf/>')
    expect(XMLAdaptor.parseNCX).toHaveBeenCalledWith(
      { rootNode: 'opf' },
      'https://example.com/book/OPS/'
    )
    expect(XMLAdaptor.createGuideItems).toHaveBeenCalledWith({
      rootNode: 'opf',
      __ncx: 'ncx',
    })
    expect(XMLAdaptor.createSpineItems).toHaveBeenCalledWith({
      rootNode: 'opf',
      __ncx: 'ncx',
    })
    expect(XMLAdaptor.udpateGuideItemURLs).toHaveBeenCalledWith(
      { guide: ['guide-item'], spine: ['spine-item'] },
      'https://example.com/book/OPS/'
    )
    expect(XMLAdaptor.udpateSpineItemURLs).toHaveBeenCalledWith(
      { guide: ['guide-item'], spine: ['spine-item'] },
      'https://example.com/book/OPS/'
    )
    expect(XMLAdaptor.createBookMetadata).toHaveBeenCalledWith({
      guide: ['guide-item-updated'],
      spine: ['spine-item-updated'],
    })

    expect(self.setState).toHaveBeenCalledWith(
      {
        opsURL: 'https://example.com/book/OPS/',
        guide: ['guide-item-updated'],
        spine: ['spine-item-updated'],
        metadata: { title: 'Test Book' },
      },
      callback
    )
    expect(callback).toHaveBeenCalled()
  })
})

describe('showSpineItem', () => {
  let warnSpy

  beforeEach(() => {
    jest.clearAllMocks()
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  test('warns and bails out when spine is missing from state', () => {
    const self = createSelf({ state: { spine: null } })

    showSpineItem.call(self)

    expect(warnSpy).toHaveBeenCalledWith('showSpineItem: spine is not in state')
    expect(self.setState).not.toHaveBeenCalled()
  })

  test('flags first chapter and first spread at the start of the book', () => {
    const self = createSelf({
      state: { currentSpineItemIndex: 0, spreadIndex: 0 },
      props: { view: { lastSpreadIndex: 2 } },
    })

    showSpineItem.call(self)

    expect(self.setState).toHaveBeenCalledWith(
      {
        firstChapter: true,
        lastChapter: false,
        firstSpread: true,
        lastSpread: false,
      },
      expect.any(Function)
    )
    expect(self.savePosition).toHaveBeenCalled()
  })

  test('flags last chapter and last spread at the end of the book', () => {
    const self = createSelf({
      state: { currentSpineItemIndex: 2, spreadIndex: 2 },
      props: { view: { lastSpreadIndex: 2 } },
    })

    showSpineItem.call(self)

    expect(self.setState).toHaveBeenCalledWith(
      {
        firstChapter: false,
        lastChapter: true,
        firstSpread: false,
        lastSpread: true,
      },
      expect.any(Function)
    )
    expect(self.savePosition).toHaveBeenCalled()
  })

  test('flags neither first/last when in the middle of the book', () => {
    const self = createSelf({
      state: { currentSpineItemIndex: 1, spreadIndex: 1 },
      props: { view: { lastSpreadIndex: 2 } },
    })

    showSpineItem.call(self)

    expect(self.setState).toHaveBeenCalledWith(
      {
        firstChapter: false,
        lastChapter: false,
        firstSpread: false,
        lastSpread: false,
      },
      expect.any(Function)
    )
    expect(self.savePosition).toHaveBeenCalled()
  })
})

describe('loadSpineItem', () => {
  let errorSpy
  let warnSpy

  beforeEach(() => {
    jest.clearAllMocks()
    book.content = null

    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    Asset.createHash.mockReturnValue('book-hash')
    Storage.get.mockReturnValue({})
    Request.getText.mockResolvedValue({
      data: '<html/>',
      request: { status: 200 },
    })
    XMLAdaptor.parseSpineItemResponse.mockResolvedValue({
      bookContent: '<div>chapter</div>',
      scopedCSS: '.scoped {}',
    })
  })

  afterEach(() => {
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })

  test('warns and returns early when spine is empty and no spineItem is provided', async () => {
    const self = createSelf({ state: { spine: [] } })

    await loadSpineItem.call(self, undefined)

    expect(warnSpy).toHaveBeenCalledWith(
      'loadSpineItem: called before spine was populated — skipping'
    )
    expect(self.freeze).not.toHaveBeenCalled()
    expect(Request.getText).not.toHaveBeenCalled()
  })

  test('falls back to the first spine item when no spineItem is provided', async () => {
    const self = createSelf()

    await loadSpineItem.call(self, undefined)

    expect(self.freeze).toHaveBeenCalled()
    expect(Request.getText).toHaveBeenCalledWith(
      'https://example.com/one.xhtml'
    )
    expect(XMLAdaptor.parseSpineItemResponse).toHaveBeenCalledWith({
      data: '<html/>',
      hash: 'book-hash',
      cache: self.state.cache,
      opsURL: self.state.opsURL,
      request: { status: 200 },
      requestedSpineItem: self.state.spine[0],
      paddingLeft: self.props.viewerSettings.paddingLeft,
      columnGap: self.props.viewerSettings.columnGap,
    })
  })

  test('happy path: loads the requested spine item, sets book.content, appends styles, and chains setState/updateQueryString/showSpineItem', async () => {
    const self = createSelf()
    const requestedSpineItem = self.state.spine[1]

    await loadSpineItem.call(self, requestedSpineItem)

    expect(self.freeze).toHaveBeenCalled()
    expect(Request.getText).toHaveBeenCalledWith(requestedSpineItem.absoluteURL)
    expect(XMLAdaptor.parseSpineItemResponse).toHaveBeenCalledWith(
      expect.objectContaining({ requestedSpineItem })
    )

    expect(book.content).toBe('<div>chapter</div>')
    expect(Asset.appendBookStyles).toHaveBeenCalledWith(
      '.scoped {}',
      'book-hash'
    )

    expect(self.setState).toHaveBeenCalledWith(
      {
        currentSpineItem: requestedSpineItem,
        spineItemURL: requestedSpineItem.absoluteURL,
      },
      expect.any(Function)
    )
    expect(self.updateQueryString).toHaveBeenCalledWith(expect.any(Function))
    expect(self.showSpineItem).toHaveBeenCalled()
  })

  test('error path: logs the error, clears storage for the book, re-enables the UI, and skips the success path', async () => {
    const self = createSelf()
    const requestError = new Error('network failure')
    Request.getText.mockRejectedValue(requestError)
    Storage.get.mockReturnValue({
      'book-hash': { foo: 'bar' },
      other: 'keep-me',
    })

    await loadSpineItem.call(self, self.state.spine[0])

    expect(errorSpy).toHaveBeenCalledWith(requestError)
    expect(Storage.set).toHaveBeenCalledWith({ other: 'keep-me' })
    expect(self.props.userInterfaceActions.update).toHaveBeenCalledWith({
      handleEvents: true,
      spinnerVisible: false,
    })

    expect(book.content).toBeNull()
    expect(Asset.appendBookStyles).not.toHaveBeenCalled()
    expect(self.setState).not.toHaveBeenCalled()
    expect(self.updateQueryString).not.toHaveBeenCalled()
    expect(self.showSpineItem).not.toHaveBeenCalled()
  })

  test('error path: defaults storage to an empty object when Storage.get returns falsy', async () => {
    const self = createSelf()
    const requestError = new Error('parse failure')
    XMLAdaptor.parseSpineItemResponse.mockRejectedValue(requestError)
    Storage.get.mockReturnValue(null)

    await loadSpineItem.call(self, self.state.spine[0])

    expect(errorSpy).toHaveBeenCalledWith(requestError)
    expect(Storage.set).toHaveBeenCalledWith({})
    expect(self.props.userInterfaceActions.update).toHaveBeenCalledWith({
      handleEvents: true,
      spinnerVisible: false,
    })
  })
})
