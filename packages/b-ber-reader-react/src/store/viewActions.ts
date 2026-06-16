import { useMemo } from 'react'
import type { ReaderStore } from './createReaderStore'
import { useReaderStore } from './StoreContext'
import type { ViewState } from './types'

// Store-backed equivalents of the former `actions/view` creators (TASK-106).
// The dead `queueDeferredCallbacks`/`dequeueDeferredCallbacks` (no call sites,
// reducer was a no-op) were dropped, not ported. `update` is a generic slice
// patch so callers can apply several `view` fields as one atomic store write —
// e.g. Ultimate's settle, which previously dispatched `load()` and
// `updateUltimateNodePosition()` back to back (batched into one render under
// Redux) and would otherwise be two store notifies / two renders (§3c).
export function createViewActions(store: ReaderStore) {
  const patch = (next: Partial<ViewState>) =>
    store.setState((s) => ({ view: { ...s.view, ...next } }))

  return {
    update: patch,
    load: () => patch({ loaded: true }),
    unload: () => patch({ loaded: false }),
    updateUltimateNodePosition: (position: Partial<ViewState>) =>
      patch(position),
    updateLastSpreadIndex: (lastSpreadIndex: number) =>
      patch({ lastSpreadIndex }),
  }
}

export type ViewActions = ReturnType<typeof createViewActions>

export function useViewActions(): ViewActions {
  const store = useReaderStore()
  return useMemo(() => createViewActions(store), [store])
}
