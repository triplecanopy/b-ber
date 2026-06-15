import { useMemo } from 'react'
import type { ReaderStore } from './createReaderStore'
import { useReaderStore } from './StoreContext'
import type { UserInterfaceState } from './types'

// Store-backed equivalents of the former `actions/user-interface` creators
// (TASK-106). Each writes the `userInterface` slice directly instead of
// dispatching a redux action; the slice reducer's `{ ...state, ...payload }`
// merge becomes the shallow patch here, so behavior is identical. Kept as a
// bundle so Reader can inject it into `propsRef` and the loader/navigation
// modules keep calling `propsRef.current.userInterfaceActions.update(...)`.
export function createUserInterfaceActions(store: ReaderStore) {
  const patch = (next: Partial<UserInterfaceState>) =>
    store.setState((s) => ({ userInterface: { ...s.userInterface, ...next } }))

  return {
    update: patch,
    enablePageTransitions: () => patch({ enableTransitions: true }),
    disablePageTransitions: () => patch({ enableTransitions: false }),
    enableEventHandling: () => patch({ handleEvents: true }),
    disableEventHandling: () => patch({ handleEvents: false }),
    showSpinner: () => patch({ spinnerVisible: true }),
    hideSpinner: () => patch({ spinnerVisible: false }),
  }
}

export type UserInterfaceActions = ReturnType<typeof createUserInterfaceActions>

// The store identity is stable for a Reader instance, so the bundle is created
// once. Components/hooks that wrote `userInterface` via connect-dispatch use
// this instead.
export function useUserInterfaceActions(): UserInterfaceActions {
  const store = useReaderStore()
  return useMemo(() => createUserInterfaceActions(store), [store])
}
