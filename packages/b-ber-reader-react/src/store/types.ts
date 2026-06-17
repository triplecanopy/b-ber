import type { ComponentType, CSSProperties, ReactNode } from 'react'

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

// The current chapter's rendered React tree, kept in the store rather than a
// module global so it flows through the render pipeline tear-free (TASK-106).
// `spineItemURL` keys BookContent so a chapter change remounts it (and the
// Ultimate sentinel inside), restarting the layout-stability watch.
export interface ContentState {
  spineItemURL: string
  node: ReactNode
}

export interface RootState {
  readerSettings: ReaderSettingsState
  viewerSettings: ViewerSettingsState
  readerLocation: ReaderLocationState
  markers: MarkersState
  view: ViewState
  userInterface: UserInterfaceState
  content: ContentState
}
