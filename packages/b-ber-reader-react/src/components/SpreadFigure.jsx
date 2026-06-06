import React, { useContext } from 'react'
import ReaderContext from '../lib/reader-context'
import SpreadContext from '../lib/spread-context'

const SpreadFigure = (props) => {
  const readerContext = useContext(ReaderContext)

  return (
    <SpreadContext.Consumer>
      {({ left: origLeft }) => {
        const absTranslateX = Math.abs(readerContext.getTranslateX())

        // Account for minute differences in measurement
        const left = Math.floor(origLeft)

        const offset = window.innerWidth / 2
        const marginLeft =
          absTranslateX === left
            ? 0
            : absTranslateX > left
              ? offset * -1
              : offset

        return (
          <figure
            id={props.id}
            style={{
              left,
              marginLeft,
            }}
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
