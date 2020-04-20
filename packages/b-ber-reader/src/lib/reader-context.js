import React from 'react'

const defaultContext = { spreadIndex: 0, lastSpread: false }
const ReaderContext = React.createContext(defaultContext)
ReaderContext.displayName = 'ReaderContext'

export default ReaderContext
