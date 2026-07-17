import React from 'react'
import { noop } from '../helpers/utils'

// Stable, ref-backed imperative API exposed to deep descendants (Link,
// SpreadFigure, Layout, use-node-position). Split out of ReaderContext in
// TASK-106: the provided value's identity never changes (Reader memoizes it
// once and the methods delegate to a live ref), so these consumers no longer
// re-render on every spread change — only the genuinely reactive consumers
// (Vimeo, useMediaPlayer) subscribe to the slim ReaderContext for spreadIndex.
export interface ReaderApiContextValue {
  getTranslateX: (spreadIndex?: number) => number
  // Provided by Reader/index.tsx; signatures vary across call sites, so kept
  // loose. TODO: type this once Reader navigation is fully converted to TS.
  navigateToChapterByURL: (...args: any[]) => any
  getSpineItemByAbsoluteUrl: (...args: any[]) => any
}

const defaultApi: ReaderApiContextValue = {
  getTranslateX: () => 0,
  navigateToChapterByURL: noop,
  getSpineItemByAbsoluteUrl: noop,
}

const ReaderApiContext = React.createContext<ReaderApiContextValue>(defaultApi)

ReaderApiContext.displayName = 'ReaderApiContext'

export default ReaderApiContext
