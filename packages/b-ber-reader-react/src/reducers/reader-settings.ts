import * as actionTypes from '../constants/reader-settings'
import { locationStates } from '../store/readerLocationActions'
import type { ReaderSettingsState, ReducerAction } from '../store/types'

export const initialState: ReaderSettingsState = {
  // loadRemoteLibrary: true, // TODO unused

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
      header_icons: {
        home: true,
        toc: true,
        downloads: true,
        info: true,
      },
      footer_icons: {
        chapter: true,
        page: true,
      },
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

const readerSettings = (
  state: ReaderSettingsState = initialState,
  action: ReducerAction = { type: '' }
): ReaderSettingsState => {
  switch (action.type) {
    case actionTypes.SETTINGS_UPDATE:
      return {
        ...state,
        ...action.payload,
      }

    default:
      return state
  }
}

export default readerSettings
