import type { ComponentType, CSSProperties } from 'react'
import type { Action } from 'redux'
import type { ThunkAction, ThunkDispatch } from 'redux-thunk'

// Loose action shape used by the slice reducers. Redux v5 dropped `AnyAction`;
// reducers receive every dispatched action and narrow on `type`, so `payload`
// is intentionally permissive here.
// TODO: tighten per-slice action unions when the Redux store is modernized
// (TASK-073).
export interface ReducerAction {
  type: string
  payload?: any
}

export interface Book {
  title: string
  url: string
  cover?: string
}

export interface Download {
  label: string
  title: string
  url: string
  description?: string
}

export interface NavigationHeaderIcons {
  home?: boolean
  toc?: boolean
  downloads?: boolean
  info?: boolean
}

export interface NavigationFooterIcons {
  chapter?: boolean
  page?: boolean
}

export interface UiOptions {
  navigation?: {
    header_icons?: NavigationHeaderIcons
    footer_icons?: NavigationFooterIcons
  }
}

export interface SearchParamKeys {
  slug: string
  currentSpineItemIndex: string
  spreadIndex: string
}

export interface ReaderSettingsState {
  books: Book[]
  bookURL: string
  downloads: Download[]
  projectURL: string
  disableBodyStyles: boolean

  // User-supplied UI component overrides (null when using the defaults).
  NavigationHeader: ComponentType<any> | null
  NavigationFooter: ComponentType<any> | null
  SidebarChapters: ComponentType<any> | null
  SidebarDownloads: ComponentType<any> | null
  SidebarMetadata: ComponentType<any> | null
  SidebarSettings: ComponentType<any> | null

  uiOptions: UiOptions
  searchParamKeys: SearchParamKeys
  locationState: string
  searchParams: string | Record<string, string>
  style: CSSProperties
  className: string
  cache: boolean
  layout: string
}

export interface ViewerSettingsState {
  width: number
  height: number
  paddingTop: number
  paddingLeft: number
  paddingRight: number
  paddingBottom: number
  columns: string
  columnGap: number
  columnWidth: number
  transition: string
  transitionSpeed: number
  theme: string
  fontSize: number | string
}

export interface ReaderLocationState {
  searchParams: string
}

export interface MarkersState {
  [markerId: string]: Record<string, unknown>
}

export interface ViewState {
  loaded: boolean
  ultimateOffsetLeft: number
  lastSpreadIndex: number
}

export interface UserInterfaceState {
  enableTransitions: boolean
  handleEvents: boolean
  spinnerVisible: boolean
}

export interface RootState {
  readerSettings: ReaderSettingsState
  viewerSettings: ViewerSettingsState
  readerLocation: ReaderLocationState
  markers: MarkersState
  view: ViewState
  userInterface: UserInterfaceState
}

// Thunk helpers. Thunks return `dispatch(...)` results that callers ignore, so
// the default return type is void (void-returning functions may still return a
// value in TS).
export type AppThunk<R = void> = ThunkAction<R, RootState, unknown, Action>
export type AppDispatch = ThunkDispatch<RootState, unknown, Action>
