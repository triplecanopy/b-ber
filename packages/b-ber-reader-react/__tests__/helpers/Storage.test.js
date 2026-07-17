import * as Storage from '../../src/helpers/Storage'

const localStorageProto = Object.getPrototypeOf(window.localStorage)

describe('Storage', () => {
  afterEach(() => {
    window.localStorage.clear()
    jest.restoreAllMocks()
  })

  describe('get', () => {
    test('returns parsed json from localStorage', () => {
      window.localStorage.setItem(
        Storage.localStorageKey,
        JSON.stringify({ foo: 'bar' })
      )

      expect(Storage.get()).toEqual({ foo: 'bar' })
    })

    test('returns an empty object when nothing is stored', () => {
      expect(Storage.get('missing-key')).toEqual({})
    })

    test('uses a custom key when provided', () => {
      window.localStorage.setItem('custom-key', JSON.stringify({ baz: 1 }))

      expect(Storage.get('custom-key')).toEqual({ baz: 1 })
    })

    test('warns and returns parsed default when localStorage throws', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      jest.spyOn(localStorageProto, 'getItem').mockImplementation(() => {
        throw new Error('unavailable')
      })

      expect(() => Storage.get()).not.toThrow()
      expect(Storage.get()).toEqual({})
      expect(warnSpy).toHaveBeenCalledWith(
        'window.localStorage is unavailable.'
      )
    })
  })

  describe('set', () => {
    test('stringifies and stores non-string values', () => {
      Storage.set({ foo: 'bar' })

      expect(window.localStorage.getItem(Storage.localStorageKey)).toBe(
        JSON.stringify({ foo: 'bar' })
      )
    })

    test('stores string values as-is', () => {
      Storage.set('plain-string', 'custom-key')

      expect(window.localStorage.getItem('custom-key')).toBe('plain-string')
    })

    test('warns and does not throw when localStorage throws', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      jest.spyOn(localStorageProto, 'setItem').mockImplementation(() => {
        throw new Error('unavailable')
      })

      expect(() => Storage.set({ foo: 'bar' })).not.toThrow()
      expect(warnSpy).toHaveBeenCalledWith('window.localStorage is unavailable')
    })
  })

  describe('clear', () => {
    test('removes the item from localStorage', () => {
      window.localStorage.setItem(Storage.localStorageKey, 'something')

      Storage.clear()

      expect(window.localStorage.getItem(Storage.localStorageKey)).toBe(null)
    })

    test('removes a custom key', () => {
      window.localStorage.setItem('custom-key', 'something')

      Storage.clear('custom-key')

      expect(window.localStorage.getItem('custom-key')).toBe(null)
    })

    test('returns early when key is falsy', () => {
      const removeSpy = jest.spyOn(localStorageProto, 'removeItem')

      Storage.clear('')

      expect(removeSpy).not.toHaveBeenCalled()
    })

    test('warns and does not throw when localStorage throws', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      jest.spyOn(localStorageProto, 'removeItem').mockImplementation(() => {
        throw new Error('unavailable')
      })

      expect(() => Storage.clear()).not.toThrow()
      expect(warnSpy).toHaveBeenCalledWith('window.localStorage is unavailable')
    })
  })
})
