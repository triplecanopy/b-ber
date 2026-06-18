jest.mock('../../../src/helpers/Asset')
jest.mock('../../../src/helpers/Request')
jest.mock('../../../src/helpers/Storage')
jest.mock('../../../src/helpers/XMLAdaptor')

import { renderHook } from '@testing-library/react'
import { useLoader } from '../../../src/components/Reader/loader'
import Asset from '../../../src/helpers/Asset'
import * as Request from '../../../src/helpers/Request'
import * as Storage from '../../../src/helpers/Storage'
import XMLAdaptor from '../../../src/helpers/XMLAdaptor'

// useLoader reads live state/props through refs and resolves cross-cutting calls
// (freeze, savePosition, updateQueryString, showSpineItem) through `api`. This
// builds those deps: `setState` shallow-merges into stateRef.current and invokes
// the callback synchronously (mirroring how the real shim's effect-flushed
// callbacks ultimately run), and `api.current` holds jest.fn stand-ins.
function createDeps(overrides = {}) {
  const stateRef = {
    current: {
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
  }

  const propsRef = {
    current: {
      readerSettings: { bookURL: 'https://example.com/book' },
      view: { lastSpreadIndex: 1 },
      viewerSettings: { paddingLeft: 0, columnGap: 0 },
      userInterfaceActions: { update: jest.fn() },
      contentActions: { setContent: jest.fn() },
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
      freeze: jest.fn(),
      savePosition: jest.fn(),
      updateQueryString: jest.fn((cb) => {
        if (cb) cb()
      }),
      showSpineItem: jest.fn(),
      ...overrides.api,
    },
  }

  const deps = { stateRef, propsRef, setState, api }
  const { result } = renderHook(() => useLoader(deps))

  return { ...deps, loader: result.current }
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
    const { loader, setState } = createDeps()
    const callback = jest.fn()

    await loader.createStateFromOPF(callback)

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

    expect(setState).toHaveBeenCalledWith(
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
    const { loader, setState } = createDeps({ state: { spine: null } })

    loader.showSpineItem()

    expect(warnSpy).toHaveBeenCalledWith('showSpineItem: spine is not in state')
    expect(setState).not.toHaveBeenCalled()
  })

  test('flags first chapter and first spread at the start of the book', () => {
    const { loader, setState, api } = createDeps({
      state: { currentSpineItemIndex: 0, spreadIndex: 0 },
      props: { view: { lastSpreadIndex: 2 } },
    })

    loader.showSpineItem()

    expect(setState).toHaveBeenCalledWith(
      {
        firstChapter: true,
        lastChapter: false,
        firstSpread: true,
        lastSpread: false,
      },
      expect.any(Function)
    )
    expect(api.current.savePosition).toHaveBeenCalled()
  })

  test('flags last chapter and last spread at the end of the book', () => {
    const { loader, setState, api } = createDeps({
      state: { currentSpineItemIndex: 2, spreadIndex: 2 },
      props: { view: { lastSpreadIndex: 2 } },
    })

    loader.showSpineItem()

    expect(setState).toHaveBeenCalledWith(
      {
        firstChapter: false,
        lastChapter: true,
        firstSpread: false,
        lastSpread: true,
      },
      expect.any(Function)
    )
    expect(api.current.savePosition).toHaveBeenCalled()
  })

  test('flags neither first/last when in the middle of the book', () => {
    const { loader, setState, api } = createDeps({
      state: { currentSpineItemIndex: 1, spreadIndex: 1 },
      props: { view: { lastSpreadIndex: 2 } },
    })

    loader.showSpineItem()

    expect(setState).toHaveBeenCalledWith(
      {
        firstChapter: false,
        lastChapter: false,
        firstSpread: false,
        lastSpread: false,
      },
      expect.any(Function)
    )
    expect(api.current.savePosition).toHaveBeenCalled()
  })
})

describe('loadSpineItem', () => {
  let errorSpy
  let warnSpy

  beforeEach(() => {
    jest.clearAllMocks()

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
    const { loader, api } = createDeps({ state: { spine: [] } })

    await loader.loadSpineItem(undefined)

    expect(warnSpy).toHaveBeenCalledWith(
      'loadSpineItem: called before spine was populated — skipping'
    )
    expect(api.current.freeze).not.toHaveBeenCalled()
    expect(Request.getText).not.toHaveBeenCalled()
  })

  test('falls back to the first spine item when no spineItem is provided', async () => {
    const { loader, api, stateRef, propsRef } = createDeps()

    await loader.loadSpineItem(undefined)

    expect(api.current.freeze).toHaveBeenCalled()
    expect(Request.getText).toHaveBeenCalledWith(
      'https://example.com/one.xhtml'
    )
    expect(XMLAdaptor.parseSpineItemResponse).toHaveBeenCalledWith({
      data: '<html/>',
      hash: 'book-hash',
      cache: stateRef.current.cache,
      opsURL: stateRef.current.opsURL,
      request: { status: 200 },
      requestedSpineItem: stateRef.current.spine[0],
      paddingLeft: propsRef.current.viewerSettings.paddingLeft,
      columnGap: propsRef.current.viewerSettings.columnGap,
    })
  })

  test('happy path: loads the requested spine item, writes content, appends styles, and chains setState/updateQueryString/showSpineItem', async () => {
    const { loader, api, stateRef, setState, propsRef } = createDeps()
    const requestedSpineItem = stateRef.current.spine[1]

    await loader.loadSpineItem(requestedSpineItem)

    expect(api.current.freeze).toHaveBeenCalled()
    expect(Request.getText).toHaveBeenCalledWith(requestedSpineItem.absoluteURL)
    expect(XMLAdaptor.parseSpineItemResponse).toHaveBeenCalledWith(
      expect.objectContaining({ requestedSpineItem })
    )

    // content (node + spineItemURL) is written atomically to the store
    expect(propsRef.current.contentActions.setContent).toHaveBeenCalledWith({
      spineItemURL: requestedSpineItem.absoluteURL,
      node: '<div>chapter</div>',
    })
    expect(Asset.appendBookStyles).toHaveBeenCalledWith(
      '.scoped {}',
      'book-hash'
    )

    expect(setState).toHaveBeenCalledWith(
      {
        currentSpineItem: requestedSpineItem,
      },
      expect.any(Function)
    )
    expect(api.current.updateQueryString).toHaveBeenCalledWith(
      expect.any(Function)
    )
    expect(api.current.showSpineItem).toHaveBeenCalled()
  })

  test('error path: logs the error, clears storage for the book, re-enables the UI, and skips the success path', async () => {
    const { loader, api, propsRef, setState, stateRef } = createDeps()
    const requestError = new Error('network failure')
    Request.getText.mockRejectedValue(requestError)
    Storage.get.mockReturnValue({
      'book-hash': { foo: 'bar' },
      other: 'keep-me',
    })

    await loader.loadSpineItem(stateRef.current.spine[0])

    expect(errorSpy).toHaveBeenCalledWith(requestError)
    expect(Storage.set).toHaveBeenCalledWith({ other: 'keep-me' })
    expect(propsRef.current.userInterfaceActions.update).toHaveBeenCalledWith({
      handleEvents: true,
      spinnerVisible: false,
    })

    expect(propsRef.current.contentActions.setContent).not.toHaveBeenCalled()
    expect(Asset.appendBookStyles).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
    expect(api.current.updateQueryString).not.toHaveBeenCalled()
    expect(api.current.showSpineItem).not.toHaveBeenCalled()
  })

  test('error path: defaults storage to an empty object when Storage.get returns falsy', async () => {
    const { loader, propsRef, stateRef } = createDeps()
    const requestError = new Error('parse failure')
    XMLAdaptor.parseSpineItemResponse.mockRejectedValue(requestError)
    Storage.get.mockReturnValue(null)

    await loader.loadSpineItem(stateRef.current.spine[0])

    expect(errorSpy).toHaveBeenCalledWith(requestError)
    expect(Storage.set).toHaveBeenCalledWith({})
    expect(propsRef.current.userInterfaceActions.update).toHaveBeenCalledWith({
      handleEvents: true,
      spinnerVisible: false,
    })
  })
})
