import configureMockStore from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import {
  locationStates,
  setInitialSearchParams,
  updateLocalStorage,
  updateLocation,
  updateQueryString,
} from '../../src/actions/reader-location'
import * as actionTypes from '../../src/constants/reader-location'
import Storage from '../../src/helpers/Storage'
import history from '../../src/lib/History'

jest.mock('../../src/lib/History', () => ({
  __esModule: true,
  default: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}))

const mockStore = configureMockStore([thunk])

const searchParamKeys = {
  slug: 'slug',
  currentSpineItemIndex: 'currentSpineItemIndex',
  spreadIndex: 'spreadIndex',
}

const baseReaderSettings = {
  bookURL: 'https://example.com/book',
  searchParamKeys,
  searchParams: '',
  locationState: locationStates.QUERY_PARAMS,
}

const baseReaderLocation = { searchParams: '' }

describe('actions/reader-location', () => {
  let originalLocationSearch

  beforeEach(() => {
    originalLocationSearch = window.location.search
    window.localStorage.clear()
  })

  afterEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: originalLocationSearch },
      writable: true,
    })
  })

  describe('updateLocalStorage', () => {
    test('persists location to localStorage and dispatches LOCATION_UPDATE', () => {
      const store = mockStore({
        readerSettings: baseReaderSettings,
        readerLocation: baseReaderLocation,
      })

      const location = { searchParams: 'currentSpineItemIndex=1&spreadIndex=0' }

      store.dispatch(updateLocalStorage(location))

      const actions = store.getActions()
      expect(actions).toEqual([
        { type: actionTypes.LOCATION_UPDATE, payload: location },
      ])

      const stored = Storage.get()
      const hash = require('../../src/helpers/Asset').default.createHash(
        baseReaderSettings.bookURL
      )
      expect(stored[hash].location).toEqual(location)
    })
  })

  describe('updateQueryString', () => {
    test('uses history.replace when there is no previous slug', () => {
      const store = mockStore({
        readerSettings: baseReaderSettings,
        readerLocation: baseReaderLocation,
      })

      const location = {
        searchParams: 'currentSpineItemIndex=1&spreadIndex=0',
      }

      store.dispatch(updateQueryString(location))

      expect(history.replace).toHaveBeenCalled()
      expect(history.push).not.toHaveBeenCalled()

      expect(store.getActions()).toEqual([
        { type: actionTypes.LOCATION_UPDATE, payload: location },
      ])
    })

    test('uses history.push when the slug changes', () => {
      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          searchParams: '',
        },
        readerLocation: {
          searchParams: 'slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
        },
      })

      const location = {
        searchParams: 'slug=chapter-2&currentSpineItemIndex=1&spreadIndex=0',
      }

      store.dispatch(updateQueryString(location))

      expect(history.push).toHaveBeenCalled()
      expect(history.replace).not.toHaveBeenCalled()
    })

    test('uses history.replace when the slug is unchanged', () => {
      const store = mockStore({
        readerSettings: baseReaderSettings,
        readerLocation: {
          searchParams: 'slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
        },
      })

      const location = {
        searchParams: 'slug=chapter-1&currentSpineItemIndex=1&spreadIndex=0',
      }

      store.dispatch(updateQueryString(location))

      expect(history.replace).toHaveBeenCalled()
      expect(history.push).not.toHaveBeenCalled()
    })
  })

  describe('updateLocation', () => {
    test('dispatches updateQueryString when locationState is QUERY_PARAMS', () => {
      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          locationState: locationStates.QUERY_PARAMS,
        },
        readerLocation: baseReaderLocation,
      })

      const location = {
        searchParams: 'currentSpineItemIndex=1&spreadIndex=0',
      }

      store.dispatch(updateLocation(location))

      expect(history.replace).toHaveBeenCalled()
      expect(store.getActions()).toEqual([
        { type: actionTypes.LOCATION_UPDATE, payload: location },
      ])
    })

    test('dispatches updateLocalStorage when locationState is LOCAL_STORAGE', () => {
      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          locationState: locationStates.LOCAL_STORAGE,
        },
        readerLocation: baseReaderLocation,
      })

      const location = { searchParams: 'currentSpineItemIndex=1&spreadIndex=0' }

      store.dispatch(updateLocation(location))

      expect(store.getActions()).toEqual([
        { type: actionTypes.LOCATION_UPDATE, payload: location },
      ])
    })

    test('returns undefined for unrecognized locationState (no-op)', () => {
      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          locationState: locationStates.MEMORY,
        },
        readerLocation: baseReaderLocation,
      })

      const result = store.dispatch(updateLocation({ searchParams: '' }))

      expect(result).toBeUndefined()
      expect(store.getActions()).toEqual([])
    })
  })

  describe('setInitialSearchParams', () => {
    test('uses prevSearchParams string when set on readerSettings', () => {
      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          searchParams: 'currentSpineItemIndex=2&spreadIndex=1',
        },
      })

      store.dispatch(setInitialSearchParams())

      expect(store.getActions()).toEqual([
        {
          type: actionTypes.LOCATION_UPDATE,
          payload: { searchParams: 'currentSpineItemIndex=2&spreadIndex=1' },
        },
      ])
    })

    test('parses prevSearchParams plain object via ensureSearchParams', () => {
      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          searchParams: { slug: 'chapter-1' },
        },
      })

      store.dispatch(setInitialSearchParams())

      const [{ payload }] = store.getActions()
      const params = new URLSearchParams(payload.searchParams)
      expect(params.get('slug')).toBe('chapter-1')
      expect(params.has('currentSpineItemIndex')).toBe(true)
      expect(params.has('spreadIndex')).toBe(true)
    })

    test('QUERY_PARAMS: reads from window.location.search when valid', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?currentSpineItemIndex=3&spreadIndex=1',
        },
        writable: true,
      })

      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          searchParams: '',
          locationState: locationStates.QUERY_PARAMS,
        },
      })

      store.dispatch(setInitialSearchParams())

      const [{ payload }] = store.getActions()
      const params = new URLSearchParams(payload.searchParams)
      expect(params.get('currentSpineItemIndex')).toBe('3')
      expect(params.get('spreadIndex')).toBe('1')
    })

    test('QUERY_PARAMS: falls back to localStorage when window.location.search is invalid', () => {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '' },
        writable: true,
      })

      const hash = require('../../src/helpers/Asset').default.createHash(
        baseReaderSettings.bookURL
      )

      Storage.set({
        [hash]: {
          location: {
            searchParams: 'currentSpineItemIndex=5&spreadIndex=2',
          },
        },
      })

      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          searchParams: '',
          locationState: locationStates.QUERY_PARAMS,
        },
      })

      store.dispatch(setInitialSearchParams())

      const [{ payload }] = store.getActions()
      const params = new URLSearchParams(payload.searchParams)
      expect(params.get('currentSpineItemIndex')).toBe('5')
      expect(params.get('spreadIndex')).toBe('2')
    })

    test('LOCAL_STORAGE: reads and persists location from localStorage', () => {
      const hash = require('../../src/helpers/Asset').default.createHash(
        baseReaderSettings.bookURL
      )

      Storage.set({
        [hash]: {
          location: {
            searchParams: 'currentSpineItemIndex=7&spreadIndex=0',
          },
        },
      })

      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          searchParams: '',
          locationState: locationStates.LOCAL_STORAGE,
        },
      })

      store.dispatch(setInitialSearchParams())

      const [{ payload }] = store.getActions()
      const params = new URLSearchParams(payload.searchParams)
      expect(params.get('currentSpineItemIndex')).toBe('7')
      expect(params.get('spreadIndex')).toBe('0')

      const stored = Storage.get()
      expect(stored[hash].location.searchParams).toBe(payload.searchParams)
    })

    test('LOCAL_STORAGE: warns when bookURL is missing', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          bookURL: '',
          searchParams: '',
          locationState: locationStates.LOCAL_STORAGE,
        },
      })

      store.dispatch(setInitialSearchParams())

      expect(consoleSpy).toHaveBeenCalledWith('Err! No `bookURL` provided')

      consoleSpy.mockRestore()
    })

    test('default branch: returns empty searchParams when no condition matches', () => {
      const store = mockStore({
        readerSettings: {
          ...baseReaderSettings,
          searchParams: '',
          locationState: locationStates.MEMORY,
        },
      })

      store.dispatch(setInitialSearchParams())

      expect(store.getActions()).toEqual([
        { type: actionTypes.LOCATION_UPDATE, payload: { searchParams: '' } },
      ])
    })
  })
})
