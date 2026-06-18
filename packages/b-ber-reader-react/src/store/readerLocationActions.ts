import isPlainObject from 'lodash/isPlainObject'
import { useMemo } from 'react'
import * as Asset from '../helpers/Asset'
import * as Storage from '../helpers/Storage'
import {
  appendExternalParams,
  ensureSearchParams,
  hasSearchParams,
} from '../helpers/search-params'
import Url from '../helpers/Url'
import history from '../lib/History'
import type { ReaderStore } from './createReaderStore'
import { useReaderStore } from './StoreContext'

// Moved here from the former redux `actions/reader-location` (TASK-106). The
// three thunks ported directly: they read the store snapshot synchronously
// (where they read `getState()`) and write the `readerLocation` slice via
// `store.setState` (where they dispatched `LOCATION_UPDATE`). The two dead
// `viewerSettings` thunks were dropped, not ported.
export const locationStates = {
  MEMORY: 'memory',
  QUERY_PARAMS: 'searchParams',
  LOCAL_STORAGE: 'localStorage',
}

export interface LocationPayload {
  searchParams: string
}

export function createReaderLocationActions(store: ReaderStore) {
  const setLocation = (location: LocationPayload) =>
    store.setState((s) => ({
      readerLocation: { ...s.readerLocation, ...location },
    }))

  const updateLocalStorage = (location: LocationPayload) => {
    const { bookURL } = store.getSnapshot().readerSettings

    const hash = Asset.createHash(bookURL)
    const storage = Storage.get() || {}

    storage[hash] = storage[hash] || {}
    storage[hash].location = location

    Storage.set(storage)

    setLocation(location)
  }

  const updateQueryString = (location: LocationPayload) => {
    const { searchParamKeys } = store.getSnapshot().readerSettings
    const { searchParams: prevSearchParams } =
      store.getSnapshot().readerLocation
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

    setLocation(location)
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
  const setInitialSearchParams = () => {
    const { readerSettings } = store.getSnapshot()

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

    setLocation(location)
  }

  const updateLocation = (location: LocationPayload) => {
    const { locationState } = store.getSnapshot().readerSettings

    if (locationState === locationStates.QUERY_PARAMS) {
      updateQueryString(location)
      return
    }

    if (locationState === locationStates.LOCAL_STORAGE) {
      updateLocalStorage(location)
    }
  }

  return {
    updateLocalStorage,
    updateQueryString,
    setInitialSearchParams,
    updateLocation,
  }
}

export type ReaderLocationActions = ReturnType<
  typeof createReaderLocationActions
>

export function useReaderLocationActions(): ReaderLocationActions {
  const store = useReaderStore()
  return useMemo(() => createReaderLocationActions(store), [store])
}
