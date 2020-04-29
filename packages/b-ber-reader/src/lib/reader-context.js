import React from 'react'
import { noop } from '../helpers/utils'

const defaultContext = {
  lastSpread: false,
  spreadIndex: 0,
  getTranslateX: () => 0,
  navigateToChapterByURL: noop,
}

const ReaderContext = React.createContext(defaultContext)

ReaderContext.displayName = 'ReaderContext'

export default ReaderContext
