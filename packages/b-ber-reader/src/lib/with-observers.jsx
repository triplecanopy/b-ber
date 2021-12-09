/* eslint-disable react/jsx-props-no-spreading */
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import debounce from 'lodash/debounce'
import ResizeObserver from 'resize-observer-polyfill'
import { isNumeric } from '../helpers/Types'
import { debug, verboseOutput } from '../config'
import browser from './browser'
import { RESIZE_DEBOUNCE_TIMER, MUTATION_DEBOUNCE_TIMER } from '../constants'
import * as viewActions from '../actions/view'

const log = (lastSpreadIndex, contentDimensions, frameHeight, columns) => {
  if (debug && verboseOutput) {
    console.group('Layout#connectResizeObserver')
    console.log(
      'lastSpreadIndex: %d; contentDimensions: %d; frameHeight %d; columns %d',
      lastSpreadIndex,
      contentDimensions,
      frameHeight,
      columns
    )
    console.groupEnd()
  }
}

const assertRef = node => {
  if (!node?.current) {
    throw new Error('Cannot observe node:', node || typeof node)
  }
}

const withObservers = WrappedComponent => {
  let resizeObserver = null
  let mutationObserver = null
  let previousContentDimensions = 0

  class WrapperComponent extends React.Component {
    node = React.createRef()

    componentDidMount() {
      this.calculateNodePositionAfterResize = debounce(
        this.calculateNodePosition,
        RESIZE_DEBOUNCE_TIMER,
        {
          leading: false,
          trailing: true,
        }
      ).bind(this)

      this.calculateNodePositionAfterMutation = debounce(
        this.calculateNodePosition,
        MUTATION_DEBOUNCE_TIMER,
        {
          leading: false,
          trailing: true,
        }
      ).bind(this)

      this.observe()
    }

    componentWillUnmount() {
      this.unobserve()
    }

    connectResizeObserver() {
      assertRef(this.node)

      resizeObserver = new ResizeObserver(this.calculateNodePositionAfterResize)
      resizeObserver.observe(this.node.current)
    }

    connectMutationObserver() {
      assertRef(this.node)

      mutationObserver = new window.MutationObserver(
        this.calculateNodePositionAfterMutation
      )

      mutationObserver.observe(this.node.current, {
        attributes: true,
        subtree: true,
      })
    }

    // eslint-disable-next-line class-methods-use-this
    disconnectResizeObserver() {
      resizeObserver.disconnect()
    }

    // eslint-disable-next-line class-methods-use-this
    disconnectMutationObserver() {
      mutationObserver.disconnect()
    }

    unobserveResizeObserver() {
      assertRef(this.node)
      resizeObserver.unobserve(this.node.current)
    }

    unobserveMutationObserver() {
      assertRef(this.node)
      mutationObserver.disconnect(this.node.current)
    }

    calculateNodePosition() {
      assertRef(this.node)

      const { columns } = this.props
      const lastNode = document.querySelector('.ultimate') // TODO redux

      if (lastNode) {
        lastNode.style.background = 'pink'
        lastNode.style.height = '1px'
        lastNode.style.display = 'block'
      }

      let contentDimensions
      let lastSpreadIndex
      let frameHeight

      // TODO prevent multiple callbacks. good to have this off for debug
      // if (this.props.ready === true) return

      // Height of the reader frame (viewport - padding top and bottom),
      // rounded so we get a natural divisor
      frameHeight = this.props.getFrameHeight()

      // getFrameHeight will return 'auto' for mobile. set to zero so that
      // chapter navigation still works
      if (!isNumeric(frameHeight)) frameHeight = 0

      // We need the width of the frame for calculations for FF and Windows
      // Edge (macOS Edge calculates columns the same as Chrome and Safari)
      const frameWidth = this.props.getFrameWidth()

      if (
        (browser.name === 'firefox' ||
          (browser.name === 'edge' &&
            /Windows/.test(window.navigator.userAgent))) &&
        lastNode
      ) {
        // Fix for FF and Windows Edge. we need to find the document height,
        // but firefox interprets our column layout as having width, so we
        // measure the distance of the left edge of the last node in our
        // document, and divide it by the number of columns

        // Determine if the last node is on recto or verso
        const { paddingLeft /*, columnGap */ } = this.props.viewerSettings

        // console.log('paddingLeft, columnGap', paddingLeft, columnGap)

        // // const { left: lastNodeClientLeft } = lastNode.getBoundingClientRect()
        // const lastNodeClientLeft = lastNode.offsetLeft

        // const lastNodePositionToLeftEdge = Math.round(
        //   lastNodeClientLeft - columnGap - paddingLeft
        // )
        // const approximateColumnWidth = Math.round(
        //   this.props.getSingleColumnWidth()
        // )

        // console.log(
        //   lastNodePositionToLeftEdge,
        //   approximateColumnWidth,
        //   lastNodePositionToLeftEdge % approximateColumnWidth
        // )

        // if (lastNodePositionToLeftEdge === approximateColumnWidth) {
        //   contentDimensions =
        //     lastNode.offsetLeft - this.props.getSingleColumnWidth()
        // } else {
        //   contentDimensions =
        //     lastNode.offsetLeft + this.props.getSingleColumnWidth()
        //   }

        // const x = Number(
        //   String(
        //     Math.round(
        //       (lastNode.offsetLeft / window.innerWidth + Number.EPSILON) * 100
        //     ) / 100
        //   )
        // )

        // const recto = x > 4 && x <= 6

        // console.log(recto, lastNode.offsetLeft / window.innerWidth, x)

        // const posLeft =
        //   (lastNode.getBoundingClientRect().left + columnGap + paddingLeft) /
        //   window.innerWidth

        // console.log(
        //   'dim',
        //   lastNode.getBoundingClientRect().left + columnGap + paddingLeft,
        //   window.innerWidth,
        //   contentDimensions
        // )

        // console.log(
        //   'dims',
        //   // frameWidth,
        //   // frameWidth - paddingLeft * 2 - columnGap,
        //   // frameWidth / 2,
        //   (frameWidth - paddingLeft * 2 - columnGap) / 2,
        //   document.querySelector('#content').offsetWidth,
        //   document.querySelector('.ultimate').offsetLeft,
        //   document.querySelector('#content').offsetWidth -
        //     document.querySelector('.ultimate').offsetLeft
        // )
        console.log(
          'dims',
          lastNode.getBoundingClientRect().right + paddingLeft,
          frameWidth,
          (lastNode.getBoundingClientRect().right + paddingLeft) / frameWidth,
          (lastNode.getBoundingClientRect().right + paddingLeft) /
            window.innerWidth
        )

        // This is just used for checking to see if the layout should
        // be recalculated
        contentDimensions =
          lastNode.offsetLeft - this.props.getSingleColumnWidth()

        // contentDimensions = recto
        //   ? lastNode.offsetLeft - this.props.getSingleColumnWidth()
        //   : lastNode.offsetLeft + this.props.getSingleColumnWidth()

        // console.log(
        //   lastNode.offsetLeft,
        //   this.props.getSingleColumnWidth(),
        //   contentDimensions / frameWidth
        // )

        // lastSpreadIndex = Math.round(contentDimensions / frameWidth)
        // lastSpreadIndex -= 1
        // lastSpreadIndex = Math.round(posLeft)

        const nodeEdgeRight =
          lastNode.getBoundingClientRect().right + paddingLeft

        lastSpreadIndex = Math.floor(nodeEdgeRight / frameWidth) - 1

        console.log('lastSpreadIndex', lastSpreadIndex)
      } else {
        contentDimensions = Math.max(
          this.node.current.scrollHeight,
          this.node.current.offsetHeight,
          this.node.current.clientHeight
        )

        // console.log('contentDimensions', contentDimensions)

        // console.log('orig frameHeight', frameHeight)

        // frameHeight = Math.round(frameHeight)

        // console.log('next frameHeight', frameHeight)

        // Find the last index by dividing the document length by the frame
        // height, and then divide the result by 2 to account for the 2
        // column layout. Math.ceil to only allow whole numbers (each page
        // must have 2 columns), and to account for dangling lines of text
        // that will spill over to the next column (contentDimensions /
        // frameHeight in these cases will be something like 6.1 for a
        // six-page chapter). Minus one since we want it to be a zero-based
        // index

        // console.log(contentDimensions / frameHeight)
        // console.log(contentDimensions / frameHeight / 2)
        // console.log(Math.ceil(contentDimensions / frameHeight / 2))
        // console.log(contentDimensions, previousContentDimensions)
        // console.log(contentDimensions / 100)

        // contentDimensions -= contentDimensions / 100

        const pages = contentDimensions / frameHeight / 2

        // Round to 10th. Allows a bit of slop when using Math.ceil,
        // e.g., 2.0001 -> 2.0 instead of 2.0001 -> 3
        const round = Math.round((pages + Number.EPSILON) * 10) / 10
        const ceil = Math.ceil(round)

        // console.log('pages', pages)
        // console.log('ceil', ceil)
        // console.log('spread', ceil - 1)

        lastSpreadIndex = ceil - 1
      }

      // Never less than 0
      lastSpreadIndex = lastSpreadIndex < 0 ? 0 : lastSpreadIndex

      log(lastSpreadIndex, contentDimensions, frameHeight, columns)

      // Check that everything's been added to the DOM. If there's a disparity
      // in dimensions, or the node we use to measure width of the DOM isn't
      // available, then hide then show content to trigger the resize observer's
      // callback
      if (previousContentDimensions !== contentDimensions || lastNode == null) {
        console.log('recalc')

        previousContentDimensions = contentDimensions
        this.node.current.style.display = 'none'
        this.node.current.style.display = 'block'
      } else {
        this.props.viewActions.updateLastSpreadIndex(lastSpreadIndex)
      }
    }

    observe() {
      this.connectResizeObserver()
      this.connectMutationObserver()
    }

    unobserve() {
      this.unobserveResizeObserver()
      this.unobserveMutationObserver()
    }

    disconnect() {
      this.disconnectResizeObserver()
      this.disconnectMutationObserver()
    }

    render() {
      return <WrappedComponent {...this.props} innerRef={this.node} />
    }
  }

  return connect(
    () => ({}),
    dispatch => ({ viewActions: bindActionCreators(viewActions, dispatch) })
  )(WrapperComponent)
}

export default withObservers
