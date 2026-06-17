import { mergeDeep } from '../helpers/utils'
import { ViewerSettings } from '../models'
import { locationStates } from './readerLocationActions'
import type { ReaderSettingsState, RootState } from './types'

// Default values for every slice — the seed for `createReaderStore` and the
// sole source of truth now that Redux is gone (TASK-106).
export const initialReaderSettings: ReaderSettingsState = {
  books: [],
  bookURL: '',
  downloads: [],
  projectURL: '',
  disableBodyStyles: false,

  // Components for rendering the reader's UI
  NavigationHeader: null,
  NavigationFooter: null,
  SidebarChapters: null,
  SidebarDownloads: null,
  SidebarMetadata: null,
  SidebarSettings: null,

  uiOptions: {
    navigation: {
      header_icons: { home: true, toc: true, downloads: true, info: true },
      footer_icons: { chapter: true, page: true },
    },
  },

  // Query param customization
  searchParamKeys: {
    slug: 'slug',
    currentSpineItemIndex: 'currentSpineItemIndex',
    spreadIndex: 'spreadIndex',
  },

  // Query param behaviour
  locationState: locationStates.QUERY_PARAMS,
  searchParams: '',

  // Layout component style/class
  style: {},
  className: '',

  cache: true, // TODO handled based on build?
  layout: '',
}

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
// slice. The clone protects the module-level `initialReaderSettings` from
// `mergeDeep`'s in-place mutation.
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
