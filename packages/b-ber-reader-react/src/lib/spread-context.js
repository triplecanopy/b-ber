import React from 'react'

// Used to position figures within spreads. `left` is a numeric pixel value —
// SpreadFigure does Math.floor(left), so the default must be a number (a string
// like '0px' would floor to NaN and push the figure off-screen).
const defaultContext = { left: 0, layout: 'columns' }
const SpreadContext = React.createContext(defaultContext)

SpreadContext.displayName = 'SpreadContext'

export default SpreadContext
