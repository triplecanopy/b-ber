import React from 'react'
import { noop } from '../helpers/utils'

export interface ReaderContextValue {
  lastSpread: boolean
  spreadIndex: number
  getTranslateX: (spreadIndex?: number) => number
  // Provided by Reader/index.jsx; signatures vary across call sites, so kept loose.
  // TODO: type this once Reader navigation is converted to TS
  navigateToChapterByURL: (...args: any[]) => any
  getSpineItemByAbsoluteUrl: (...args: any[]) => any
}

const defaultContext: ReaderContextValue = {
  lastSpread: false,
  spreadIndex: 0,
  getTranslateX: () => 0,
  navigateToChapterByURL: noop,
  getSpineItemByAbsoluteUrl: noop,
}

const ReaderContext = React.createContext<ReaderContextValue>(defaultContext)

ReaderContext.displayName = 'ReaderContext'

export default ReaderContext
