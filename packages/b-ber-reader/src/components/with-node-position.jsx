import React from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import { connect } from 'react-redux'
import DocumentPreProcessor from '../lib/DocumentPreProcessor'
import { unlessDefined } from '../helpers/utils'

const ELEMENT_EDGE_VERSO_MIN = 48
const ELEMENT_EDGE_VERSO_MAX = 52
const ELEMENT_EDGE_RECTO_MIN = 0
const ELEMENT_EDGE_RECTO_MAX = 5
// const ELEMENT_EDGE_RECTO_MAX = 2

// TODO: This is a refined version of what's in Marker.jsx. The Marker class
// should be wrapped with this HOC.

// options =  {
//
//    useParentDimensions: bool
//
//    Should the calculations for the spread postion be based on the element
//    that the ref is attached to, or the ref's parent container.
//    Default false.
//
//
//    useAdjustedColumnWidth: bool
//
//    Should the calculations be based on an element that sits inside of the
//    columns or one that stretches the width of the viewport.
//    Default false.
//
//
//    isMarker: bool
//    TODO description
//
// }

const withNodePosition = (WrappedComponent, options) => {
  class WrapperComponent extends React.Component {
    state = {
      verso: null,
      recto: null,
      edgePosition: null,
      spreadIndex: null,
      currentSpreadIndex: null,
      edgePositionVariance: null, // position
      elementEdgeLeft: null, // x
    }

    constructor(props) {
      super(props)

      this.timer = null
      this.elemRef = React.createRef()
      this.calculateNodePosition = this.calculateNodePosition.bind(this)
      this.calculateNodePositionAfterResize = () => {}

      this.settings = {
        useParentDimensions: unlessDefined(
          this.props.useParentDimensions,
          options.useParentDimensions,
          false
        ),

        useAdjustedColumnWidth: unlessDefined(
          this.props.useAdjustedColumnWidth,
          options.useAdjustedColumnWidth,
          true
        ),

        isMarker: unlessDefined(options.isMarker, false),
      }
    }

    componentDidMount() {
      this.calculateNodePositionAfterResize = debounce(
        this.calculateNodePosition,
        0,
        {
          leading: false,
          trailing: true,
        }
      ).bind(this)

      this.connectObserver()
      // this.calculateNodePosition()
    }

    componentWillUnmount() {
      this.disconnectObservers()
    }

    connectObserver() {
      const { useParentDimensions } = this.settings
      let elem
      if (useParentDimensions) {
        elem = this.elemRef.current?.parentElement
          ? this.elemRef.current.parentElement
          : null
      } else {
        elem = this.elemRef.current
      }

      if (!elem) return console.error('No element to conenct to ResizeObserver')

      this.resizeObserver = new ResizeObserver(
        this.calculateNodePositionAfterResize
      )

      this.resizeObserver.observe(elem)
    }

    disconnectObservers() {
      clearTimeout(this.timer)
      this.resizeObserver.disconnect()
    }

    // eslint-disable-next-line class-methods-use-this
    elementEdgeIsInAllowableRange(edgePositionVariance) {
      const result =
        (edgePositionVariance >= ELEMENT_EDGE_VERSO_MIN &&
          edgePositionVariance <= ELEMENT_EDGE_VERSO_MAX) ||
        (edgePositionVariance >= ELEMENT_EDGE_RECTO_MIN &&
          edgePositionVariance <= ELEMENT_EDGE_RECTO_MAX)

      return result
    }

    // Determine if the element is verso or recto and calculate the index of
    // the spread that it appears on.
    calculateNodePosition() {
      // Calculate position of either the attached node (ref), or its parent element
      const {
        useParentDimensions,
        useAdjustedColumnWidth,
        isMarker,
      } = this.settings

      let elem
      if (useParentDimensions) {
        elem = this.elemRef.current?.parentElement
          ? this.elemRef.current.parentElement
          : null
      } else {
        elem = this.elemRef.current
      }

      if (!elem) return console.error('Element does not exist')

      const { paddingLeft, columnGap } = this.props.viewerSettings

      let marginLeft
      let elementPaddingLeft
      let elementEdgeLeft

      if (useAdjustedColumnWidth) {
        const computedStyle = window.getComputedStyle(elem)
        // eslint-disable-next-line prefer-destructuring
        marginLeft = computedStyle.marginLeft
        elementPaddingLeft = computedStyle.paddingLeft

        // Get the left edge of the element, taking into account padding and margins
        elementEdgeLeft =
          elem.offsetLeft -
          parseFloat(marginLeft) -
          parseFloat(elementPaddingLeft)
      } else {
        elementEdgeLeft = elem.getBoundingClientRect().x
      }

      // We test whether the element's left offset is divisible by the
      // visible frame width. A remainder means that the element is
      // positioned at 1/2 of the page width, or 'recto'

      // Width of a single column
      const columnWidth = (window.innerWidth - paddingLeft * 2 - columnGap) / 2

      // Width of the visible portion of the layout
      const innerFrameWidth = window.innerWidth - paddingLeft * 2 + columnGap

      // Calculate for the left edge of the element as if it were in the
      // recto position
      let elementEdgeLeftInRecto
      if (useAdjustedColumnWidth) {
        elementEdgeLeftInRecto =
          elementEdgeLeft - columnGap - columnWidth - paddingLeft
      } else {
        elementEdgeLeftInRecto = elementEdgeLeft
      }

      // Calculate the position (verso or recto) of the element by
      // dividing by the visible frame. If we're left with a remainder,
      // then we know that the position is verso
      const edgePosition = Math.abs(elementEdgeLeftInRecto / innerFrameWidth)

      // Get the decimal value of the recto unit over the visible frame,
      // rounded to two. this allows us to account for tiny variants in
      // the actual position of the left edge of the element, and
      // determine if the element is moving (in the middle of a
      // transition) or if it's within allowable range of either the recto
      // or verso ranges (ELEMENT_EDGE_<POSITION>_MIN and MAX)
      const edgePositionVariance = Number(
        (edgePosition % 1).toFixed(2).substring(2)
      )

      // Verify that the variance in the calculations is within an allowable range
      const verso =
        edgePositionVariance >= ELEMENT_EDGE_VERSO_MIN &&
        edgePositionVariance <= ELEMENT_EDGE_VERSO_MAX
      const recto =
        edgePositionVariance >= ELEMENT_EDGE_RECTO_MIN &&
        edgePositionVariance <= ELEMENT_EDGE_RECTO_MAX

      // Calculate the spread that the element appears on by rounding the
      // position
      const spreadIndex = Math.round(Number(edgePosition.toFixed(2)))

      // In the case that the marker's edge is not within the allowable
      // range (during a transition or resize), calculateNodePosition
      // calls itself again

      // TODO: there should be a guard in place to ensure that this
      // doesn't end up calling itself forever @issue:
      // https://github.com/triplecanopy/b-ber/issues/211
      if (
        this.elementEdgeIsInAllowableRange(edgePositionVariance) === false ||
        (verso === false && recto === false)
      ) {
        console.warn('Recalculating layout')
        // this.timer = setTimeout(this.calculateNodePosition, 500)
      }

      // TODO
      if (isMarker) {
        DocumentPreProcessor.removeStyleSheets()
        DocumentPreProcessor.createStyleSheets({ paddingLeft, columnGap })
        DocumentPreProcessor.appendStyleSheets()
      }

      // TODO: may want to debounce this call, or write up 'swap' functions in
      // DocumentPreProcessor in case of flickering, but seems OK rn
      // @issue: https://github.com/triplecanopy/b-ber/issues/212
      // DocumentPreProcessor.removeStyleSheets()
      // DocumentPreProcessor.createStyleSheets({ paddingLeft, columnGap })
      // DocumentPreProcessor.appendStyleSheets()

      this.setState({
        verso,
        recto,
        edgePosition,
        spreadIndex,
        edgePositionVariance,
        elementEdgeLeft,
      })
    }

    render() {
      return (
        <WrappedComponent
          elemRef={this.elemRef}
          {...this.state}
          {...this.props}
        />
      )
    }
  }

  return connect(
    ({ viewerSettings, view }) => ({ viewerSettings, view }),
    () => ({})
  )(WrapperComponent)
}

export default withNodePosition
