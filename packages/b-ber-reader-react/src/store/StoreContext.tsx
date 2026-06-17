import React, { createContext, type ReactNode, useContext } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector'
import type { ReaderStore } from './createReaderStore'
import type { RootState } from './types'

// The store object's identity never changes for the life of a Reader instance,
// so the context value itself never triggers re-renders — reactivity comes from
// `useStore`'s `useSyncExternalStore` subscription, not from context (the
// distribution-vs-subscription split, MIGRATION-CONVENTIONS §3e).
const StoreContext = createContext<ReaderStore | null>(null)

export function StoreProvider({
  store,
  children,
}: {
  store: ReaderStore
  children: ReactNode
}) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useReaderStore(): ReaderStore {
  const store = useContext(StoreContext)
  if (store === null) {
    throw new Error('useReaderStore must be used within a StoreProvider')
  }
  return store
}

const referenceEquality = <T,>(a: T, b: T): boolean => Object.is(a, b)

// Read a slice of state with a selector. Re-renders only when the selected value
// changes — equivalent to `connect`'s bailout, no provider fan-out. Selectors
// that derive a *new* object each call must pass an `isEqual` (e.g. shallow
// equality) or the store loops; primitive/stable reads can use the default
// (MIGRATION-CONVENTIONS §3e, STATE-MIGRATION-PLAN "Gotchas").
export function useStore<T>(
  selector: (state: RootState) => T,
  isEqual: (a: T, b: T) => boolean = referenceEquality
): T {
  const store = useReaderStore()
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    selector,
    isEqual
  )
}
