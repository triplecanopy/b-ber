import React from 'react'

// Reactive view-position context. Carries only the values whose changes deep
// consumers must re-render on: the current spread and whether it is the last
// one. The imperative methods that used to live here moved to the stable
// ReaderApiContext (TASK-106) so method-only consumers stop re-rendering on
// spread changes. Only Vimeo / useMediaPlayer subscribe here (to pause/resume
// playback as their spread scrolls in and out of view).
export interface ReaderContextValue {
  lastSpread: boolean
  spreadIndex: number
}

const defaultContext: ReaderContextValue = {
  lastSpread: false,
  spreadIndex: 0,
}

const ReaderContext = React.createContext<ReaderContextValue>(defaultContext)

ReaderContext.displayName = 'ReaderContext'

export default ReaderContext
