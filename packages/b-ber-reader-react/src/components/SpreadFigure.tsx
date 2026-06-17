import React, { useContext } from 'react'
import ReaderApiContext from '../lib/reader-api-context'
import SpreadContext from '../lib/spread-context'

interface SpreadFigureProps {
  id?: string
  className?: string
  children?: React.ReactNode
}

const SpreadFigure = (props: SpreadFigureProps) => {
  const readerApi = useContext(ReaderApiContext)

  return (
    <SpreadContext.Consumer>
      {({ left: origLeft }) => {
        const absTranslateX = Math.abs(readerApi.getTranslateX())

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
