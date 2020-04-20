import React from 'react'
import { noop } from '../helpers/utils'

const defaultContext = {
  spreadIndex: 0,
  lastSpread: false,
  navigateToChapterByURL: noop,
}

const ReaderContext = React.createContext(defaultContext)

ReaderContext.displayName = 'ReaderContext'

export default ReaderContext
