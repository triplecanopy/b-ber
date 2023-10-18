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
        const opacity = 0.5
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
            style={{ left, opacity, marginLeft }}
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
