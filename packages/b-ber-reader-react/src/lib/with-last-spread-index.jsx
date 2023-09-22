import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { isNumeric } from '../helpers/Types'
import browser from './browser'
import * as viewActions from '../actions/view'

const withLastSpreadIndex = WrappedComponent => {
  function WrapperComponent(props) {
    const node = useRef(null)
    const [contentDimensions, setContentDimensions] = useState(0)
    const [lastSpreadIndex, setLastSpreadIndex] = useState(0)

    useEffect(() => {
      const timer = setInterval(() => {
        const lastNode = document.querySelector('.bber-ultimate') // TODO redux

        let nextContentDimensions
        if (
          browser.name === 'firefox' ||
          (browser.name === 'edge' &&
            /Windows/.test(window.navigator.userAgent) &&
            lastNode)
        ) {
          // Fix for FF and Windows Edge. we need to find the document height,
          // but firefox interprets our column layout as having width, so we
          // measure the distance of the left edge of the last node in our
          // document, and divide it by the number of columns
          nextContentDimensions = lastNode.offsetLeft //- props.getSingleColumnWidth()
          // nextContentDimensions = Math.max(1, nextContentDimensions)

          //   nodeEdgeRight = lastNode.offsetLeft + lastNode.offsetWidth + paddingLeft
          //   const d = nodeEdgeRight / (frameWidth + paddingLeft)
          //   const x = Math.round((d + Number.EPSILON) * 10) / 10
          //   const nextX = Math.ceil(x)
          //   console.log(nodeEdgeRight, d, x, nextX)
          //   lastSpreadIndex = nextX - 1
          //   console.log('lastSpreadIndex', lastSpreadIndex)
        } else {
          nextContentDimensions = Math.max(
            node.current.scrollHeight,
            node.current.offsetHeight,
            node.current.clientHeight
          )
        }

        console.log('update content dimensions', nextContentDimensions)

        setContentDimensions(nextContentDimensions)
      }, 1000)

      return () => clearInterval(timer)
    }, [])

    useEffect(() => {
      let frameHeight = props.getFrameHeight()

      // getFrameHeight will return 'auto' for mobile. set to zero so that
      // chapter navigation still works
      if (!isNumeric(frameHeight)) frameHeight = 0

      const pages = contentDimensions / frameHeight / 2

      // Round to 10th. Allows a bit of slop when using Math.ceil,
      // e.g., 2.0001 -> 2 instead of 2.0001 -> 3
      const round = Math.round((pages + Number.EPSILON) * 10) / 10
      const ceil = Math.ceil(round)

      let nextLastSpreadIndex = ceil - 1

      // Never less than 0
      nextLastSpreadIndex = nextLastSpreadIndex < 0 ? 0 : nextLastSpreadIndex
      console.log('update spread index', lastSpreadIndex)

      setLastSpreadIndex(nextLastSpreadIndex)

      console.log('commit lastspreadindex', nextLastSpreadIndex)
      props.viewActions.updateLastSpreadIndex(nextLastSpreadIndex)
    }, [contentDimensions])

    return (
      <WrappedComponent
        innerRef={node}
        getFrameHeight={props.getFrameHeight}
        getFrameWidth={props.getFrameWidth}
        getSingleColumnWidth={props.getSingleColumnWidth}
        updateDimensions={props.updateDimensions}
        BookContent={props.BookContent}
        className={props.className}
        lastSpreadIndex={props.lastSpreadIndex}
        layout={props.layout}
        readerSettings={props.readerSettings}
        slug={props.slug}
        spreadIndex={props.spreadIndex}
        style={props.style}
        view={props.view}
        viewerSettings={props.viewerSettings}
        userInterface={props.userInterface}
        viewerSettingsActions={props.viewerSettingsActions}
        viewActions={props.viewActions}
      />
    )
  }

  return connect(
    () => ({}),
    dispatch => ({ viewActions: bindActionCreators(viewActions, dispatch) })
  )(WrapperComponent)
}

export default withLastSpreadIndex
