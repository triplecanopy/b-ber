import React, { useContext } from 'react'
import SpreadContext from '../lib/spread-context'
import ReaderContext from '../lib/reader-context'

const SpreadFigure = props => {
  const readerContext = useContext(ReaderContext)

  return (
    <SpreadContext.Consumer>
      {({ left }) => {
        const absTranslateX = Math.abs(readerContext.getTranslateX())
        // const opacity = 1 // Math.abs(translateX) === left ? 1 : 0

        // Account for minute differences in measurement
        const adjustedLeft = Math.floor(left)

        const opacity = 0.5
        const offset = window.innerWidth / 2
        const marginLeft =
          absTranslateX === adjustedLeft
            ? 0
            : absTranslateX > adjustedLeft
            ? offset * -1
            : offset

        return (
          <figure
            id={props.id}
            style={{ left: adjustedLeft, opacity, marginLeft }}
            className={props.className || ''}
          >
            {props.children}
          </figure>
        )
      }}
    </SpreadContext.Consumer>
  )
}

export default SpreadFigure
