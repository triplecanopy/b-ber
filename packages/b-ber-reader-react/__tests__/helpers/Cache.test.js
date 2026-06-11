import Asset from '../../src/helpers/Asset'
import Cache from '../../src/helpers/Cache'
import Storage from '../../src/helpers/Storage'

jest.mock('../../src/helpers/Storage')

describe('Cache', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('get returns the cached entry for a url', () => {
    const hash = Asset.createHash('http://example.com/foo')
    Storage.get.mockReturnValue({ [hash]: { data: 'cached' } })

    expect(Cache.get('http://example.com/foo')).toEqual({ data: 'cached' })
    expect(Storage.get).toHaveBeenCalledWith(Cache.localStorageKey)
  })

  test('get returns null when storage has no matching hash', () => {
    Storage.get.mockReturnValue({})

    expect(Cache.get('http://example.com/foo')).toBe(null)
  })

  test('get returns null when storage is falsy', () => {
    Storage.get.mockReturnValue(null)

    expect(Cache.get('http://example.com/foo')).toBe(null)
  })

  test('set writes the hashed entry when storage exists', () => {
    const url = 'http://example.com/foo'
    const hash = Asset.createHash(url)
    Storage.get.mockReturnValue({})

    Cache.set(url, 'some-data')

    expect(Storage.set).toHaveBeenCalledWith(
      { [hash]: { data: 'some-data' } },
      Cache.localStorageKey
    )
  })

  test('set is a no-op when storage is falsy', () => {
    Storage.get.mockReturnValue(null)

    Cache.set('http://example.com/foo', 'some-data')

    expect(Storage.set).not.toHaveBeenCalled()
  })

  test('clear delegates to Storage.clear', () => {
    Cache.clear()

    expect(Storage.clear).toHaveBeenCalledWith(Cache.localStorageKey)
  })
})
