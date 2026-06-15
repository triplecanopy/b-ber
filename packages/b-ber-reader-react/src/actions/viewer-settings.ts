import * as actionTypes from '../constants/viewer-settings'
import type { AppThunk, ViewerSettingsState } from '../store/types'

// `load` and `save` were dead (no call sites; `load` was a no-op TODO) and were
// removed during the state migration (TASK-106). `update` remains in use
// (resize.ts) until the viewerSettings slice itself migrates off redux.
export const update =
  (settings: Partial<ViewerSettingsState> = {}): AppThunk =>
  (dispatch) => {
    return dispatch({
      type: actionTypes.SETTINGS_UPDATE,
      payload: settings,
    })
  }
