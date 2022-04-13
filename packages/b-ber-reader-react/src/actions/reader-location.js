/* eslint-disable import/prefer-default-export */

import isPlainObject from 'lodash/isPlainObject'
import * as actionTypes from '../constants/reader-location'
import {
  hasSearchParams,
  stripSearchParams,
  ensureSearchParams,
} from '../helpers/search-params'
import Asset from '../helpers/Asset'
import Storage from '../helpers/Storage'
import Url from '../helpers/Url'
import history from '../lib/History'

export const locationStates = {
  MEMORY: 'memory',
  QUERY_PARAMS: 'queryParams',
  LOCAL_STORAGE: 'localStorage',
}

export const updateLocalStorage = location => (dispatch, getState) => {
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

export const updateQueryString = location => (dispatch, getState) => {
  const prevState = getState()
  const { searchParamKeys } = prevState.readerSettings

  const { searchParams: prevSearchParams } = prevState.readerLocation
  const { searchParams: nextSearchParams } = location

  const { slug: slugKey } = searchParamKeys

  const prevQuery = Url.parseQueryString(prevSearchParams)
  const nextQuery = Url.parseQueryString(nextSearchParams)

  const prevSlug = prevQuery[slugKey]
  const nextSlug = nextQuery[slugKey]

  const updateMethod = !prevSlug || prevSlug === nextSlug ? 'replace' : 'push'

  history[updateMethod](location)

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
export const setInitialSearchParams = () => (dispatch, getState) => {
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

  console.log('prevSearchParams', prevSearchParams)

  let location = { searchParams: '' }

  if (prevSearchParams) {
    location.searchParams = prevSearchParams
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
      searchParams = stripSearchParams(searchParams, searchParamKeys)
    } else {
      const hash = Asset.createHash(bookURL)
      const storage = Storage.get() || {}

      searchParams = storage[hash]?.location?.search || ''
    }

    searchParams = ensureSearchParams(searchParams, searchParamKeys)

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

export const updateLocation = location => (dispatch, getState) => {
  const prevState = getState()
  const { locationState } = prevState.readerSettings

  // console.log('Update location', location)

  if (locationState === locationStates.QUERY_PARAMS) {
    return dispatch(updateQueryString(location))
  }

  if (locationState === locationStates.LOCAL_STORAGE) {
    return dispatch(updateLocalStorage(location))
  }
}
