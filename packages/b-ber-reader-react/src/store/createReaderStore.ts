import type { RootState } from './types'

type Listener = () => void

export type StatePatch =
  | Partial<RootState>
  | ((state: RootState) => Partial<RootState>)

export interface ReaderStore {
  getSnapshot: () => RootState
  subscribe: (listener: Listener) => () => void
  setState: (patch: StatePatch) => void
}

// A tiny hand-rolled external store read via `useSyncExternalStore` — the
// replacement for plain Redux (TASK-106). `setState` shallow-merges at the
// top (slice) level, mirroring `combineReducers`: to update inside a slice the
// caller spreads the previous slice, e.g.
// `setState(s => ({ view: { ...s.view, loaded: true } }))`. The notify pass is
// synchronous, matching Redux's dispatch semantics (no batching regression —
// MIGRATION-CONVENTIONS §3c).
export function createReaderStore(initial: RootState): ReaderStore {
  let state = initial
  const listeners = new Set<Listener>()

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setState: (patch) => {
      const next = typeof patch === 'function' ? patch(state) : patch
      state = { ...state, ...next }
      for (const listener of listeners) listener()
    },
  }
}
