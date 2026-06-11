import {
  appendExternalParams,
  ensureSearchParams,
  excludeSearchParams,
  getUrlParams,
  hasSearchParams,
  stripSearchParams,
} from '../../src/helpers/search-params'

const searchParamKeys = {
  slug: 'slug',
  currentSpineItemIndex: 'currentSpineItemIndex',
  spreadIndex: 'spreadIndex',
}

describe('search-params', () => {
  describe('getUrlParams', () => {
    test('returns the input unchanged if it is already a URLSearchParams', () => {
      const params = new URLSearchParams('foo=bar')

      expect(getUrlParams(params)).toBe(params)
    })

    test('creates a URLSearchParams from a string', () => {
      const params = getUrlParams('foo=bar')

      expect(params).toBeInstanceOf(URLSearchParams)
      expect(params.get('foo')).toBe('bar')
    })
  })

  describe('hasSearchParams', () => {
    test('returns false for falsy input', () => {
      expect(hasSearchParams('', searchParamKeys)).toBe(false)
      expect(hasSearchParams(null, searchParamKeys)).toBe(false)
    })

    test('returns false when required keys are missing', () => {
      expect(hasSearchParams('slug=foo', searchParamKeys)).toBe(false)
      expect(hasSearchParams('currentSpineItemIndex=0', searchParamKeys)).toBe(
        false
      )
    })

    test('returns true when all required keys are present', () => {
      expect(
        hasSearchParams(
          'currentSpineItemIndex=0&spreadIndex=0',
          searchParamKeys
        )
      ).toBe(true)
    })
  })

  describe('stripSearchParams', () => {
    test('removes params not in the allowed set', () => {
      const result = stripSearchParams(
        'slug=foo&currentSpineItemIndex=1&spreadIndex=2&extra=bar',
        searchParamKeys
      )

      expect(result.get('extra')).toBe(null)
      expect(result.get('slug')).toBe('foo')
      expect(result.get('currentSpineItemIndex')).toBe('1')
      expect(result.get('spreadIndex')).toBe('2')
    })
  })

  describe('ensureSearchParams', () => {
    test('sets default values when missing', () => {
      const result = ensureSearchParams('', searchParamKeys)

      expect(result.get('currentSpineItemIndex')).toBe('0')
      expect(result.get('spreadIndex')).toBe('0')
    })

    test('does not override existing values', () => {
      const result = ensureSearchParams(
        'currentSpineItemIndex=5&spreadIndex=3',
        searchParamKeys
      )

      expect(result.get('currentSpineItemIndex')).toBe('5')
      expect(result.get('spreadIndex')).toBe('3')
    })
  })

  describe('excludeSearchParams', () => {
    test('removes the bber-specific params', () => {
      const result = excludeSearchParams(
        'slug=foo&currentSpineItemIndex=1&spreadIndex=2&extra=bar',
        searchParamKeys
      )

      expect(result.get('slug')).toBe(null)
      expect(result.get('currentSpineItemIndex')).toBe(null)
      expect(result.get('spreadIndex')).toBe(null)
      expect(result.get('extra')).toBe('bar')
    })
  })

  describe('appendExternalParams', () => {
    const originalLocation = window.location

    afterEach(() => {
      delete window.location
      window.location = originalLocation
    })

    test('merges external query params from window.location.search', () => {
      delete window.location
      window.location = new URL(
        'http://localhost/?foo=bar&slug=should-be-excluded'
      )

      const result = appendExternalParams(
        'currentSpineItemIndex=0',
        searchParamKeys
      )

      expect(result.get('currentSpineItemIndex')).toBe('0')
      expect(result.get('foo')).toBe('bar')
      expect(result.get('slug')).toBe(null)
    })

    test('returns input params unchanged when location has no search params', () => {
      delete window.location
      window.location = new URL('http://localhost/')

      const result = appendExternalParams(
        'currentSpineItemIndex=0',
        searchParamKeys
      )

      expect(result.get('currentSpineItemIndex')).toBe('0')
    })
  })
})
