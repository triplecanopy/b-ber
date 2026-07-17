import { useMemo } from 'react'
import type { ReaderStore } from './createReaderStore'
import { useReaderStore } from './StoreContext'
import type { ViewerSettingsState } from './types'

// Store-backed equivalent of `actions/viewer-settings`'s `update` (TASK-106).
// The reducer's SETTINGS_UPDATE merge becomes a shallow slice patch; `load`/
// `save` were already dropped as dead. Only `update` is used (resize.ts and
// useDimensions' viewport measurement).
export function createViewerSettingsActions(store: ReaderStore) {
  const update = (settings: Partial<ViewerSettingsState> = {}) =>
    store.setState((s) => ({
      viewerSettings: { ...s.viewerSettings, ...settings },
    }))

  return { update }
}

export type ViewerSettingsActions = ReturnType<
  typeof createViewerSettingsActions
>

export function useViewerSettingsActions(): ViewerSettingsActions {
  const store = useReaderStore()
  return useMemo(() => createViewerSettingsActions(store), [store])
}
