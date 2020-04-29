import React from 'react'

// Default value is currently only a single property for positioning figures in
// spreads
const left = '0px'
const SpreadContext = React.createContext(left)

SpreadContext.displayName = 'SpreadContext'

export default SpreadContext
