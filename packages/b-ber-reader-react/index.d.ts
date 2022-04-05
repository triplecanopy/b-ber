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
}

export type BberReaderProps = RequireOneOf<
  OptionalBberReaderProps,
  'bookURL' | 'manifestURL'
> &
  React.HTMLAttributes<HTMLDivElement>

declare const BberReader: React.FunctionComponent<BberReaderProps>

export default BberReader
