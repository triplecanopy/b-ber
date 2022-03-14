declare module '@canopycanopycanopy/b-ber-reader-react'

export as namespace BberReader

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

export interface BberReaderProps {
  bookURL: string
  projectURL?: string
  books?: Book[]
  downloads?: Download[]
  basePath?: string
  loadRemoteLibrary?: boolean
  uiOptions?: UI
  cache?: boolean
  layout?: Layout
}

export default function BberReader(props?: BberReaderProps): JSX.Element
