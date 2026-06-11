import {
  getPlayerPropsFromQueryString,
  getPlayingStateOnUpdate,
  getURLAndQueryParamters,
  transformSearchParamsToProps,
} from '../../src/helpers/media'
import Viewport from '../../src/helpers/Viewport'

describe('media', () => {
  describe('getPlayerPropsFromQueryString', () => {
    test('parses a query string into an object', () => {
      expect(getPlayerPropsFromQueryString('foo=bar&baz=1')).toEqual({
        foo: 'bar',
        baz: '1',
      })
    })

    test('returns an empty object for an empty string', () => {
      expect(getPlayerPropsFromQueryString('')).toEqual({})
    })
  })

  describe('getURLAndQueryParamters', () => {
    test('splits a url on the query string delimiter', () => {
      expect(getURLAndQueryParamters('http://example.com/foo?bar=baz')).toEqual(
        ['http://example.com/foo', 'bar=baz']
      )
    })

    test('returns a single element array when there is no query string', () => {
      expect(getURLAndQueryParamters('http://example.com/foo')).toEqual([
        'http://example.com/foo',
      ])
    })
  })

  describe('transformSearchParamsToProps', () => {
    test('casts truthy and falsey string values to booleans', () => {
      const result = transformSearchParamsToProps({
        autoplay: 'true',
        loop: 'false',
        muted: '1',
        controls: '0',
      })

      expect(result).toEqual({
        autoplay: true,
        loop: false,
        muted: true,
        controls: false,
        playsinline: true,
      })
    })

    test('leaves non-boolean values unchanged', () => {
      const result = transformSearchParamsToProps({ src: 'video.mp4' })

      expect(result).toEqual({ src: 'video.mp4', playsinline: true })
    })

    test('omits blacklisted props', () => {
      const result = transformSearchParamsToProps(
        { src: 'video.mp4', secret: 'hidden' },
        ['secret']
      )

      expect(result).toEqual({ src: 'video.mp4', playsinline: true })
    })
  })

  describe('getPlayingStateOnUpdate', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('returns false when state.autoplay is falsy', () => {
      const state = { autoplay: false, currentSpreadIndex: 0 }
      const props = { view: { loaded: true } }

      expect(getPlayingStateOnUpdate(state, props, {}, {})).toBe(false)
    })

    test('returns false when the view has not loaded', () => {
      const state = { autoplay: true, currentSpreadIndex: 0 }
      const props = { view: { loaded: false } }

      expect(getPlayingStateOnUpdate(state, props, {}, {})).toBe(false)
    })

    test('returns false when the spread index has not changed', () => {
      const state = { autoplay: true, currentSpreadIndex: 1 }
      const props = { view: { loaded: true } }
      const nextProps = { spreadIndex: 1 }
      const nextContext = { spreadIndex: 1 }

      expect(
        getPlayingStateOnUpdate(state, props, nextProps, nextContext)
      ).toBe(false)
    })

    test('returns playing: true when the element is on the visible spread and not vertically scrolling', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)

      const state = { autoplay: true, currentSpreadIndex: 0 }
      const props = { view: { loaded: true }, readerSettings: {} }
      const nextProps = { spreadIndex: 2 }
      const nextContext = { spreadIndex: 2 }

      expect(
        getPlayingStateOnUpdate(state, props, nextProps, nextContext)
      ).toEqual({
        playing: true,
        currentSpreadIndex: 2,
      })
    })

    test('returns playing: false when the element is not on the visible spread', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)

      const state = { autoplay: true, currentSpreadIndex: 0 }
      const props = { view: { loaded: true }, readerSettings: {} }
      const nextProps = { spreadIndex: 1 }
      const nextContext = { spreadIndex: 2 }

      expect(
        getPlayingStateOnUpdate(state, props, nextProps, nextContext)
      ).toEqual({
        playing: false,
        currentSpreadIndex: 2,
      })
    })

    test('returns playing: false when vertically scrolling, even on the visible spread', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(true)

      const state = { autoplay: true, currentSpreadIndex: 0 }
      const props = { view: { loaded: true }, readerSettings: {} }
      const nextProps = { spreadIndex: 2 }
      const nextContext = { spreadIndex: 2 }

      expect(
        getPlayingStateOnUpdate(state, props, nextProps, nextContext)
      ).toEqual({
        playing: false,
        currentSpreadIndex: 2,
      })
    })
  })
})
