import React from 'react'

declare module '@canopycanopycanopy/b-ber-reader-react'

export interface Book {
  title: string
  url: string
  cover?: string
}

export interface Download {
  label: string
  title: string
  description?: string
  url: string
}

export interface UINavigationFooterIcons {
  chapter?: boolean
  page?: boolean
}

export interface UINavigationHeaderIcons {
  info?: boolean
  home?: boolean
  downloads?: boolean
  toc?: boolean
}

export interface UINavigation {
  header_icons?: UINavigationHeaderIcons
  footer_icons?: UINavigationFooterIcons
}

export interface UI {
  navigation?: UINavigation
}

export enum Layout {
  SCROLL = 'scroll',
  COLUMNS = 'columns',
}

export type RequireOneOf<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

// Used for renaming the query parameters
export interface BberReaderQueryParameterKeys {
  slug?: string
  currentSpineItemIndex?: number
  spreadIndex?: number
}

export interface Download {
  label: string
  title: string
  url: string
  description?: string
}

export interface UiOptionsNavigationHeaderIcons {
  home?: boolean
  toc?: boolean
  downloads?: boolean
  info?: boolean
}

export interface UiOptionsNavigationFooterIcons {
  chapter?: boolean
  page?: boolean
}

export interface UiOptionsNavigation {
  header_icons?: UiOptionsNavigationHeaderIcons
  footer_icons?: UiOptionsNavigationFooterIcons
}

export interface UiOptions {
  navigation?: UiOptionsNavigation
}

export enum SidebarName {
  CHAPTERS = 'chapters',
  DOWNLOADS = 'downloads',
  METADATA = 'metadata',
  // SETTINGS = 'settings',
}

export interface NavigationHeaderProps {
  destroyReaderComponent: () => void
  handleSidebarButtonClick: (name: `${SidebarName}` | null) => void
  downloads: Download[]
  uiOptions: UiOptions
}

export interface SpineItem {
  absoluteURL: string
  children: SpineItem[]
  depth: number
  href: string
  id: string
  idref: string
  inTOC: boolean
  linear: string
  mediaType: string
  properties: string[]
  slug: string
  title: string
}

export type Spine = SpineItem[]

export interface Metadata {
  title: string
  creator: string
  date: string
  publisher: string
  description: string
  language: string
  rights: string
  identifier: string
}

export interface NavigationFooterProps {
  uiOptions: UiOptions
  currentSpineItemIndex: number
  spine: Spine
  layout: `${Layout}`
  spreadIndex: number
  lastSpreadIndex: number
  handleEvents: boolean
  handleChapterNavigation: (increment: number) => void
  enablePageTransitions: () => void
  handlePageNavigation: (increment: number) => void
  goToPrevChapter: () => void
  goToNextChapter: () => void
  goToPrevPage: () => void
  goToNextPage: () => void
}

export interface SidebarChaptersProps {
  showSidebar: SidebarName | null
  spine: Spine
  currentSpineItemIndex: number
  navigateToChapterByURL: (url: string) => void
}

export interface SidebarDownloadsProps {
  showSidebar: SidebarName | null
  downloads: Download[]
}

export interface SidebarMetadataProps {
  showSidebar: SidebarName | null
  metadata: Metadata
}

// interface SidebarSettingsProps {}

export type UiReaderProp<T> = React.Component<T> | ((props: T) => JSX.Element)

export type LocationState = 'memory' | 'localStorage' | 'queryParams'

export type KeysValues<T> = { [P in keyof T]: T[P] }

export type SearchParams = string | KeysValues<BberReaderQueryParameterKeys>

export interface OptionalBberReaderProps {
  bookURL?: string
  manifestURL?: string
  projectURL?: string
  books?: Book[]
  downloads?: Download[]
  basePath?: string
  loadRemoteLibrary?: boolean
  uiOptions?: UI
  cache?: boolean
  layout?: `${Layout}`
  searchParamKeys?: BberReaderQueryParameterKeys
  disableBodyStyles?: boolean

  NavigationHeader?: UiReaderProp<NavigationHeaderProps>
  NavigationFooter?: UiReaderProp<NavigationFooterProps>
  SidebarChapters?: UiReaderProp<SidebarChaptersProps>
  SidebarDownloads?: UiReaderProp<SidebarDownloadsProps>
  SidebarMetadata?: UiReaderProp<SidebarMetadataProps>
  // SidebarSettings?: UiReaderProp<SidebarSettingsProps>

  locationState?: LocationState
  searchParams?: SearchParams
}

export type BberReaderProps = RequireOneOf<
  OptionalBberReaderProps,
  'bookURL' | 'manifestURL'
> &
  React.HTMLAttributes<HTMLDivElement>

declare const BberReader: React.FunctionComponent<BberReaderProps>

export default BberReader
