import isPlainObject from 'lodash/isPlainObject'
import * as actionTypes from '../constants/reader-location'
import Asset from '../helpers/Asset'
import Storage from '../helpers/Storage'
import {
  appendExternalParams,
  ensureSearchParams,
  hasSearchParams,
} from '../helpers/search-params'
import Url from '../helpers/Url'
import history from '../lib/History'
import type { AppThunk } from '../store/types'

export const locationStates = {
  MEMORY: 'memory',
  QUERY_PARAMS: 'searchParams',
  LOCAL_STORAGE: 'localStorage',
}

export interface LocationPayload {
  searchParams: string
}

export const updateLocalStorage =
  (location: LocationPayload): AppThunk =>
  (dispatch, getState) => {
    const prevState = getState()
    const { bookURL } = prevState.readerSettings

    const hash = Asset.createHash(bookURL)
    const storage = Storage.get() || {}

    storage[hash] = storage[hash] || {}
    storage[hash].location = location

    Storage.set(storage)

    return dispatch({
      type: actionTypes.LOCATION_UPDATE,
      payload: location,
    })
  }

export const updateQueryString =
  (location: LocationPayload): AppThunk =>
  (dispatch, getState) => {
    const prevState = getState()
    const { searchParamKeys } = prevState.readerSettings

    const { searchParams: prevSearchParams } = prevState.readerLocation
    const { searchParams: nextSearchParams } = location

    const { slug: slugKey } = searchParamKeys

    // TODO: drop the cast once Url.parseQueryString is typed (utilities wave)
    const prevQuery = Url.parseQueryString(prevSearchParams) as Record<
      string,
      string | undefined
    >
    const nextQuery = Url.parseQueryString(nextSearchParams) as Record<
      string,
      string | undefined
    >

    const prevSlug = prevQuery[slugKey]
    const nextSlug = nextQuery[slugKey]

    const updateMethod = !prevSlug || prevSlug === nextSlug ? 'replace' : 'push'

    const search = appendExternalParams(
      nextSearchParams,
      searchParamKeys
    ).toString()

    history[updateMethod]({ search })

    return dispatch({
      type: actionTypes.LOCATION_UPDATE,
      payload: location,
    })
  }

// When the reader mounts, navigate to the desired location. The location is
// determined by checking the following in this order:
//
// 1. The `searchParams` prop if one exists on the Reader component
// 2. The query string (if the locationState is set to `queryString`).
//    In the case that both the query string and `searchParams` prop are set,
//    the reader will load the value from the `searchParams` prop.
// 3. The values stored in localStorage from the last time the user loaded the
//    book if a location is available there.
// 4. If neither of the above conditions are met, then the first page of the
//    book is loaded.
export const setInitialSearchParams = (): AppThunk => (dispatch, getState) => {
  const { readerSettings } = getState()

  const { bookURL, searchParamKeys, locationState } = readerSettings

  let { searchParams: prevSearchParams } = readerSettings

  // Parse params in case they've been passed into the reader component
  // as an object
  if (isPlainObject(prevSearchParams)) {
    prevSearchParams = ensureSearchParams(
      prevSearchParams,
      searchParamKeys
    ).toString()
  }

  let location: LocationPayload = { searchParams: '' }

  if (prevSearchParams) {
    // At this point a non-empty `prevSearchParams` is a string (either the
    // original string prop or the stringified object above).
    location.searchParams = prevSearchParams as string
  } else if (locationState === locationStates.QUERY_PARAMS) {
    // Check that necessary keys are set in location.searchParams, if not then
    // set to 0. Reader doesn't require a 'slug' param, it can be set later.
    // If there is no location.search, check for a value in localStorage
    let searchParams

    if (
      window.location.search &&
      hasSearchParams(window.location.search, searchParamKeys)
    ) {
      searchParams = new URLSearchParams(window.location.search)
      // searchParams = stripSearchParams(searchParams, searchParamKeys)
    } else {
      const hash = Asset.createHash(bookURL)
      const storage = Storage.get() || {}

      searchParams = storage[hash]?.location?.searchParams || ''
    }

    searchParams = ensureSearchParams(searchParams, searchParamKeys)
    searchParams = appendExternalParams(searchParams, searchParamKeys)

    location = { searchParams: searchParams.toString() }
  } else if (locationState === locationStates.LOCAL_STORAGE) {
    if (!bookURL) {
      console.error('Err! No `bookURL` provided')
    }

    let searchParams

    const hash = Asset.createHash(bookURL)
    const storage = Storage.get() || {}

    storage[hash] = storage[hash] || {}

    searchParams = storage[hash].location?.searchParams || ''
    searchParams = ensureSearchParams(searchParams, searchParamKeys)

    location = { searchParams: searchParams.toString() }

    storage[hash].location = location

    Storage.set(storage)
  }

  return dispatch({
    type: actionTypes.LOCATION_UPDATE,
    payload: location,
  })
}

export const updateLocation =
  (location: LocationPayload): AppThunk =>
  (dispatch, getState) => {
    const prevState = getState()
    const { locationState } = prevState.readerSettings

    if (locationState === locationStates.QUERY_PARAMS) {
      return dispatch(updateQueryString(location))
    }

    if (locationState === locationStates.LOCAL_STORAGE) {
      return dispatch(updateLocalStorage(location))
    }
  }
