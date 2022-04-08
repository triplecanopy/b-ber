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

type RequireOneOf<T, Keys extends keyof T = keyof T> = Pick<
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
  currentSpineItemIndex?: string
  spreadIndex?: string
}

interface Download {
  label: string
  title: string
  url: string
  description?: string
}

interface UiOptionsNavigationHeaderIcons {
  home?: boolean
  toc?: boolean
  downloads?: boolean
  info?: boolean
}

interface UiOptionsNavigationFooterIcons {
  chapter?: boolean
  page?: boolean
}

interface UiOptionsNavigation {
  header_icons?: UiOptionsNavigationHeaderIcons
  footer_icons?: UiOptionsNavigationFooterIcons
}

interface UiOptions {
  navigation?: UiOptionsNavigation
}

interface NavigationHeaderProps {
  destroyReaderComponent: () => void
  handleSidebarButtonClick: () => void
  downloads: Download[]
  uiOptions: UiOptions
}

enum Layout {
  SCROLL = 'scroll',
  COLUMNS = 'columns',
}

interface SpineItem {
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

type Spine = SpineItem[]

interface Metadata {
  title: string
  creator: string
  date: string
  publisher: string
  description: string
  language: string
  rights: string
  identifier: string
}

interface NavigationFooterProps {
  uiOptions: UiOptions
  currentSpineItemIndex: number
  spine: Spine
  layout: Layout
  spreadIndex: number
  lastSpreadIndex: number
  handleEvents: boolean
  handleChapterNavigation: boolean
  enablePageTransitions: boolean
  handlePageNavigation: boolean
}

interface SidebarChaptersProps {
  showSidebar: boolean
  spine: Spine
  currentSpineItemIndex: number
  navigateToChapterByURL: () => void
}

interface SidebarDownloadsProps {
  showSidebar: boolean
  downloads: Download[]
}

interface SidebarMetadataProps {
  showSidebar: boolean
  metadata: Metadata
}

// interface SidebarSettingsProps {}

type UiReaderProp<T> = React.Component<T> | ((props: T) => JSX.Element)

interface OptionalBberReaderProps {
  bookURL?: string
  manifestURL?: string
  projectURL?: string
  books?: Book[]
  downloads?: Download[]
  basePath?: string
  loadRemoteLibrary?: boolean
  uiOptions?: UI
  cache?: boolean
  layout?: Layout
  paramKeys?: BberReaderQueryParameterKeys
  disableBodyStyles?: boolean

  NavigationHeader?: UiReaderProp<NavigationHeaderProps>
  NavigationFooter?: UiReaderProp<NavigationFooterProps>
  SidebarChapters?: UiReaderProp<SidebarChaptersProps>
  SidebarDownloads?: UiReaderProp<SidebarDownloadsProps>
  SidebarMetadata?: UiReaderProp<SidebarMetadataProps>
  // SidebarSettings?: UiReaderProp<SidebarSettingsProps>
}

export type BberReaderProps = RequireOneOf<
  OptionalBberReaderProps,
  'bookURL' | 'manifestURL'
> &
  React.HTMLAttributes<HTMLDivElement>

declare const BberReader: React.FunctionComponent<BberReaderProps>

export default BberReader
