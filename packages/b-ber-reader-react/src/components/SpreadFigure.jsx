import React from 'react'
import SpreadContext from '../lib/spread-context'

const SpreadFigure = props => (
  <SpreadContext.Consumer>
    {/* {({ left }) => { */}
    {() => {
      const {
        children,
        id,
        'data-marker-reference-figure': dataMarkerReferenceFigure,
      } = props

      return (
        <figure
          id={id}
          data-marker-reference-figure={dataMarkerReferenceFigure}
        >
          {children}
        </figure>
      )

      // return (
      //   <figure style={{ left }} {...rest}>
      //     {children}
      //   </figure>
      // )
    }}
  </SpreadContext.Consumer>
)

export default SpreadFigure
