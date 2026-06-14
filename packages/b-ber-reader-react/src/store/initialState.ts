import { mergeDeep } from '../helpers/utils'
import { ViewerSettings } from '../models'
import { initialState as initialReaderSettings } from '../reducers/reader-settings'
import type { RootState } from './types'

// The default slice values are the seed for `createReaderStore`. They mirror the
// per-reducer defaults exactly so the built-in store and the (still-present)
// Redux store start identical while slices migrate one at a time (TASK-106).
// When Redux is deleted these become the sole source of truth.
export const initialUserInterface: RootState['userInterface'] = {
  enableTransitions: false,
  handleEvents: false,
  spinnerVisible: true,
}

export const initialView: RootState['view'] = {
  loaded: false,
  ultimateOffsetLeft: 0,
  lastSpreadIndex: 0,
}

export const initialReaderLocation: RootState['readerLocation'] = {
  searchParams: '',
}

export const initialMarkers: RootState['markers'] = {}

// Props supplied to the Reader component are merged into the `readerSettings`
// slice, exactly as `index.tsx` seeds the Redux store. The clone protects the
// module-level `initialReaderSettings` from `mergeDeep`'s in-place mutation.
export function createInitialState(
  props: Record<string, unknown> = {}
): RootState {
  return {
    readerSettings: mergeDeep(
      JSON.parse(JSON.stringify(initialReaderSettings)),
      props
    ),
    viewerSettings: new ViewerSettings().get() as RootState['viewerSettings'],
    readerLocation: { ...initialReaderLocation },
    markers: { ...initialMarkers },
    view: { ...initialView },
    userInterface: { ...initialUserInterface },
  }
}
