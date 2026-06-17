import React, { useContext } from 'react'
import ReaderApiContext from '../lib/reader-api-context'
import ReaderContext from '../lib/reader-context'
import SpreadContext from '../lib/spread-context'

interface SpreadFigureProps {
  id?: string
  className?: string
  children?: React.ReactNode
}

const SpreadFigure = (props: SpreadFigureProps) => {
  const { getTranslateX } = useContext(ReaderApiContext)
  // getTranslateX() resolves against the current spread, so this figure's
  // margin must recompute on every page turn. getTranslateX itself lives on the
  // stable ReaderApiContext (no re-render), so subscribe to the reactive
  // spreadIndex here and pass it explicitly to keep the dependency visible.
  const { spreadIndex } = useContext(ReaderContext)

  return (
    <SpreadContext.Consumer>
      {({ left: origLeft }) => {
        const absTranslateX = Math.abs(getTranslateX(spreadIndex))

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
