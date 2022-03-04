import React from 'react'
import SpreadContext from '../lib/spread-context'

const SpreadFigure = props => (
  <SpreadContext.Consumer>
    {({ left }) => {
      const { children, ...rest } = props

      return (
        <figure style={{ left }} {...rest}>
          {children}
        </figure>
      )
    }}
  </SpreadContext.Consumer>
)

export default SpreadFigure
