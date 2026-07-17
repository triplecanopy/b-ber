import { useMemo } from 'react'
import type { ReaderStore } from './createReaderStore'
import { useReaderStore } from './StoreContext'
import type { ContentState } from './types'

// Writes the rendered chapter tree into the store (TASK-106). `setContent` is a
// single atomic write of `{ spineItemURL, node }` so BookContent's key and its
// content change together — one re-render, no transient where the old keyed
// instance briefly shows the new node.
export function createContentActions(store: ReaderStore) {
  return {
    setContent: (content: ContentState) => store.setState({ content }),
  }
}

export type ContentActions = ReturnType<typeof createContentActions>

export function useContentActions(): ContentActions {
  const store = useReaderStore()
  return useMemo(() => createContentActions(store), [store])
}
