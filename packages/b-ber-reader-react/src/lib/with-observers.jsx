// window.innerWidth 2320 window.innerHeight 1234

/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
// import debounce from 'lodash/debounce'
// import ResizeObserver from 'resize-observer-polyfill'
import { isNumeric } from '../helpers/Types'
// import { debug, verboseOutput } from '../config'
import browser from './browser'
// import { RESIZE_DEBOUNCE_TIMER, MUTATION_DEBOUNCE_TIMER } from '../constants'
import * as viewActions from '../actions/view'

const withObservers = WrappedComponent => {
  function ObseverWrapperComponent(props) {
    const node = useRef(null)
    const [contentDimensions, setContentDimensions] = useState(0)
    const [lastSpreadIndex, setLastSpreadIndex] = useState(0)

    useEffect(() => {
      const timer = setInterval(() => {
        // TODO should this be layout==='columns'?
        // const { columns } = props

        // const lastNode = document.querySelector('.bber-ultimate') // TODO redux

        // let contentDimensions
        // let nextLastSpreadIndex
        // let frameHeight
        // let nodeEdgeRight

        // const { paddingLeft /*, columnGap */ } = props.viewerSettings

        // TODO prevent multiple callbacks. good to have this off for debug
        // if (props.ready === true) return

        // Height of the reader frame (viewport - padding top and bottom),
        // rounded so we get a natural divisor
        // frameHeight = props.getFrameHeight()

        // // getFrameHeight will return 'auto' for mobile. set to zero so that
        // // chapter navigation still works
        // if (!isNumeric(frameHeight)) frameHeight = 0

        // We need the width of the frame for calculations for FF and Windows
        // Edge (macOS Edge calculates columns the same as Chrome and Safari)
        // const frameWidth = props.getFrameWidth()

        // if (
        //   (browser.name === 'firefox' ||
        //     (browser.name === 'edge' &&
        //       /Windows/.test(window.navigator.userAgent))) &&
        //   lastNode
        // ) {
        //   // Fix for FF and Windows Edge. we need to find the document height,
        //   // but firefox interprets our column layout as having width, so we
        //   // measure the distance of the left edge of the last node in our
        //   // document, and divide it by the number of columns

        //   // This is just used for checking to see if the layout should
        //   // be recalculated
        //   contentDimensions = lastNode.offsetLeft - props.getSingleColumnWidth()

        //   nodeEdgeRight = lastNode.offsetLeft + lastNode.offsetWidth + paddingLeft

        //   const d = nodeEdgeRight / (frameWidth + paddingLeft)
        //   const x = Math.round((d + Number.EPSILON) * 10) / 10
        //   const nextX = Math.ceil(x)

        //   console.log(nodeEdgeRight, d, x, nextX)

        //   lastSpreadIndex = nextX - 1

        //   console.log('lastSpreadIndex', lastSpreadIndex)
        // } else {

        const nextContentDimensions = Math.max(
          node.current.scrollHeight,
          node.current.offsetHeight,
          node.current.clientHeight
        )

        // Find the last index by dividing the document length by the frame
        // height, and then divide the result by 2 to account for the 2
        // column layout. Math.ceil to only allow whole numbers (each page
        // must have 2 columns), and to account for dangling lines of text
        // that will spill over to the next column (contentDimensions /
        // frameHeight in these cases will be something like 6.1 for a
        // six-page chapter). Minus one since we want it to be a zero-based
        // index

        // const pages = nextContentDimensions / frameHeight / 2

        // // Round to 10th. Allows a bit of slop when using Math.ceil,
        // // e.g., 2.0001 -> 2.0 instead of 2.0001 -> 3
        // const round = Math.round((pages + Number.EPSILON) * 10) / 10
        // const ceil = Math.ceil(round)

        // // console.log('pages', pages)
        // // console.log('ceil', ceil)
        // // console.log('spread', ceil - 1)

        // nextLastSpreadIndex = ceil - 1
        // // }
        // //
        // //
        // //
        // // End if

        // // Never less than 0
        // nextLastSpreadIndex = nextLastSpreadIndex < 0 ? 0 : nextLastSpreadIndex

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

      // console.log('pages', pages)
      // console.log('ceil', ceil)
      // console.log('spread', ceil - 1)

      let nextLastSpreadIndex = ceil - 1
      // }
      //
      //
      //
      // End if

      // Never less than 0
      nextLastSpreadIndex = nextLastSpreadIndex < 0 ? 0 : nextLastSpreadIndex
      console.log('update spread index', lastSpreadIndex)

      setLastSpreadIndex(nextLastSpreadIndex)

      console.log('commit lastspreadindex', nextLastSpreadIndex)
      props.viewActions.updateLastSpreadIndex(nextLastSpreadIndex)
    }, [contentDimensions])

    // useEffect(() => {
    //   console.log('commit lastspreadindex', lastSpreadIndex)
    //   props.viewActions.updateLastSpreadIndex(lastSpreadIndex)
    // }, [lastSpreadIndex])

    // componentDidMount() {
    //   calculateNodePositionAfterResize = debounce(
    //     calculateNodePosition,
    //     RESIZE_DEBOUNCE_TIMER,
    //     {
    //       leading: false,
    //       trailing: true,
    //     }
    //   ).bind(this)

    //   calculateNodePositionAfterMutation = debounce(
    //     calculateNodePosition,
    //     MUTATION_DEBOUNCE_TIMER,
    //     {
    //       leading: false,
    //       trailing: true,
    //     }
    //   ).bind(this)

    //   observe()
    // }

    // function calculateNodePosition() {
    //   const { columns } = props
    //   const lastNode = document.querySelector('.bber-ultimate') // TODO redux

    //   let contentDimensions
    //   let lastSpreadIndex
    //   let frameHeight
    //   // let nodeEdgeRight

    //   // const { paddingLeft /*, columnGap */ } = props.viewerSettings

    //   // TODO prevent multiple callbacks. good to have this off for debug
    //   // if (props.ready === true) return

    //   // Height of the reader frame (viewport - padding top and bottom),
    //   // rounded so we get a natural divisor
    //   frameHeight = props.getFrameHeight()

    //   // getFrameHeight will return 'auto' for mobile. set to zero so that
    //   // chapter navigation still works
    //   if (!isNumeric(frameHeight)) frameHeight = 0

    //   // We need the width of the frame for calculations for FF and Windows
    //   // Edge (macOS Edge calculates columns the same as Chrome and Safari)
    //   // const frameWidth = props.getFrameWidth()

    //   // if (
    //   //   (browser.name === 'firefox' ||
    //   //     (browser.name === 'edge' &&
    //   //       /Windows/.test(window.navigator.userAgent))) &&
    //   //   lastNode
    //   // ) {
    //   //   // Fix for FF and Windows Edge. we need to find the document height,
    //   //   // but firefox interprets our column layout as having width, so we
    //   //   // measure the distance of the left edge of the last node in our
    //   //   // document, and divide it by the number of columns

    //   //   // This is just used for checking to see if the layout should
    //   //   // be recalculated
    //   //   contentDimensions = lastNode.offsetLeft - props.getSingleColumnWidth()

    //   //   nodeEdgeRight = lastNode.offsetLeft + lastNode.offsetWidth + paddingLeft

    //   //   const d = nodeEdgeRight / (frameWidth + paddingLeft)
    //   //   const x = Math.round((d + Number.EPSILON) * 10) / 10
    //   //   const nextX = Math.ceil(x)

    //   //   console.log(nodeEdgeRight, d, x, nextX)

    //   //   lastSpreadIndex = nextX - 1

    //   //   console.log('lastSpreadIndex', lastSpreadIndex)
    //   // } else {
    //   contentDimensions = Math.max(
    //     node.current.scrollHeight,
    //     node.current.offsetHeight,
    //     node.current.clientHeight
    //   )

    //   // Find the last index by dividing the document length by the frame
    //   // height, and then divide the result by 2 to account for the 2
    //   // column layout. Math.ceil to only allow whole numbers (each page
    //   // must have 2 columns), and to account for dangling lines of text
    //   // that will spill over to the next column (contentDimensions /
    //   // frameHeight in these cases will be something like 6.1 for a
    //   // six-page chapter). Minus one since we want it to be a zero-based
    //   // index

    //   const pages = contentDimensions / frameHeight / 2

    //   // Round to 10th. Allows a bit of slop when using Math.ceil,
    //   // e.g., 2.0001 -> 2.0 instead of 2.0001 -> 3
    //   const round = Math.round((pages + Number.EPSILON) * 10) / 10
    //   const ceil = Math.ceil(round)

    //   // console.log('pages', pages)
    //   // console.log('ceil', ceil)
    //   // console.log('spread', ceil - 1)

    //   lastSpreadIndex = ceil - 1
    //   // }
    //   //
    //   //
    //   //
    //   // End if

    //   // Never less than 0
    //   lastSpreadIndex = lastSpreadIndex < 0 ? 0 : lastSpreadIndex

    //   console.log(lastSpreadIndex, contentDimensions, frameHeight, columns)

    // Check that everything's been added to the DOM. If there's a disparity
    // in dimensions, or the node we use to measure width of the DOM isn't
    // available, then hide then show content to trigger the resize observer's
    // callback
    // if (previousContentDimensions !== contentDimensions || lastNode == null) {
    //   // console.log('Recalculate layout')

    //   previousContentDimensions = contentDimensions
    //   node.current.style.display = 'none'
    //   node.current.style.display = 'block'
    // } else {
    //   props.viewActions.updateLastSpreadIndex(lastSpreadIndex)
    // }
    // }

    return <WrappedComponent {...props} innerRef={node} />
  }

  return connect(
    () => ({}),
    dispatch => ({ viewActions: bindActionCreators(viewActions, dispatch) })
  )(ObseverWrapperComponent)
}

export default withObservers
