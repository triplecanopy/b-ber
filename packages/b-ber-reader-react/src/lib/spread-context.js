import React from 'react'

// Default value is currently only a single property for positioning figures in
// spreads
const defaultContext = { left: '0px', layout: 'columns' }
const SpreadContext = React.createContext(defaultContext)

SpreadContext.displayName = 'SpreadContext'

export default SpreadContext
