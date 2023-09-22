/* eslint-disable react/jsx-props-no-spreading */
import React from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import { connect } from 'react-redux'
import DocumentPreProcessor from './DocumentPreProcessor'
import { unlessDefined } from '../helpers/utils'
import ReaderContext from './reader-context'

const ELEMENT_EDGE_VERSO_MIN = 48
const ELEMENT_EDGE_VERSO_MAX = 52
const ELEMENT_EDGE_RECTO_MIN = 0
const ELEMENT_EDGE_RECTO_MAX = 5

// options =  {
//
//    useParentDimensions: bool
//
//    Should the calculations for the spread postion be based on the element
//    that the ref is attached to, or the ref's parent container.
//    Default false.
//
//
//    useElementOffsetLeft: bool
//
//    Should the calculations be based on an element's `offsetLeft`. If true,
//    calculations are made using `getBoundingClientRect`.
//    Default false.
//
//
//    useFullscreenElementWidth: bool
//
//    Should the calculations be based on an element that it outside of the
//    normal flow of columns, e.g., a fullscreen element
//
//
//    isMarker: bool
//
//    Whether the wrapped component is a Marker component
//
// }

const withNodePosition = (WrappedComponent, options = {}) => {
  class WrapperComponent extends React.Component {
    static contextType = ReaderContext

    state = {
      verso: null,
      recto: null,
      spreadIndex: null,
      currentSpreadIndex: null, // TODO used?
      elementEdgeLeft: null,
    }

    elemRef = React.createRef()

    constructor(props) {
      super(props)

      this.calculateNodePositionUsingOffsetLeft = this.calculateNodePositionUsingOffsetLeft.bind(
        this
      )

      this.calculateNodePositionAfterResize = () => {}

      this.settings = {
        useParentDimensions: unlessDefined(
          this.props.useParentDimensions,
          options.useParentDimensions,
          false
        ),

        useElementOffsetLeft: unlessDefined(
          this.props.useElementOffsetLeft,
          options.useElementOffsetLeft,
          true
        ),

        useFullscreenElementWidth: unlessDefined(
          this.props.useFullscreenElementWidth,
          options.useFullscreenElementWidth,
          false
        ),

        isMarker: unlessDefined(options.isMarker, false),
      }
    }

    componentDidMount() {
      if (!this.settings.useElementOffsetLeft) {
        this.calculateNodePositionUsingBoundingClientRect()
        return
      }

      this.calculateNodePositionAfterResize = debounce(
        this.calculateNodePositionUsingOffsetLeft,
        0,
        { leading: false, trailing: true }
      ).bind(this)

      this.connectObserver()
    }

    componentWillUnmount() {
      if (!this.settings.useElementOffsetLeft) return

      this.disconnectObservers()
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.settings.useElementOffsetLeft) return

      const { ultimateOffsetLeft: nextUltimateOffsetLeft } = nextProps
      const { ultimateOffsetLeft } = this.props.view

      if (nextUltimateOffsetLeft === ultimateOffsetLeft) {
        return
      }

      this.calculateNodePositionUsingBoundingClientRect()
    }

    connectObserver() {
      const node = this.getRef()

      if (!node) return console.error('No element to conenct to ResizeObserver')

      this.resizeObserver = new ResizeObserver(
        this.calculateNodePositionAfterResize
      )

      this.resizeObserver.observe(node)
    }

    disconnectObservers() {
      this.resizeObserver.disconnect()
    }

    elementEdgeIsInAllowableRange = edgePositionVariance => {
      const withinRange =
        (edgePositionVariance >= ELEMENT_EDGE_VERSO_MIN &&
          edgePositionVariance <= ELEMENT_EDGE_VERSO_MAX) ||
        (edgePositionVariance >= ELEMENT_EDGE_RECTO_MIN &&
          edgePositionVariance <= ELEMENT_EDGE_RECTO_MAX)

      return withinRange
    }

    getRef = () => {
      const { useParentDimensions } = this.settings

      let elem
      if (useParentDimensions) {
        elem = this.elemRef.current?.parentElement
          ? this.elemRef.current.parentElement
          : null
      } else {
        elem = this.elemRef.current
      }

      return elem
    }

    // Determine if the element is verso or recto and calculate the index of
    // the spread that it appears on.
    calculateNodePositionUsingOffsetLeft = () => {
      // Calculate position of either the attached node (ref), or its parent element
      const node = this.getRef()

      if (!node) return console.error('Element does not exist') // TODO necessary to check again?

      const { isMarker } = this.settings
      const { paddingLeft, columnGap } = this.props.viewerSettings

      // Get the offset of the node's (the marker's) parent's (span's) parent (element in
      // the document that it's been inserted into)
      const computedParentStyle = window.getComputedStyle(
        node.parentElement.parentElement
      )

      // eslint-disable-next-line prefer-destructuring
      const marginLeft = computedParentStyle.marginLeft
      const elementPaddingLeft = computedParentStyle.paddingLeft

      // Get the left edge of the element, taking into account padding and margins
      const elementEdgeLeft =
        node.offsetLeft -
        parseFloat(marginLeft) -
        parseFloat(elementPaddingLeft)

      // Test whether the element's left offset is divisible by the
      // visible frame width. A remainder means that the element is
      // positioned at 1/2 of the page width, or 'recto'

      // Width of a single column
      const columnWidth = (window.innerWidth - paddingLeft * 2 - columnGap) / 2

      // Width of the visible portion of the layout
      const innerFrameWidth = window.innerWidth - paddingLeft * 2 + columnGap

      // Calculate for the left edge of the element as if it were in the
      // recto position
      let elementEdgeLeftInRecto = elementEdgeLeft - columnGap - columnWidth

      // Subtract the left padding of the frame only if the element that is
      // being queried is "inline", i.e., inside of a normal column of flowing
      // text
      // if (this.settings.useFullscreenElementWidth === false) {
      if (node.offsetWidth !== window.innerWidth) {
        elementEdgeLeftInRecto -= paddingLeft
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

      // TODO return range? i.e., { spreadStart: 0, spreadEnd: 1 } Returning
      // a rounded number means that the index will never be 0
      const spreadIndex = Math.floor(Number(edgePosition.toFixed(2)))

      // In the case that the marker's edge is not within the allowable
      // range (during a transition or resize), calculateNodePosition
      // calls itself again
      if (
        this.elementEdgeIsInAllowableRange(edgePositionVariance) === false ||
        (verso === false && recto === false)
      ) {
        node.style.display = 'none'
        node.style.display = 'block'
      }

      this.setState({
        verso,
        recto,
        spreadIndex,
        elementEdgeLeft,
      })

      // TODO Marker component specific code needs to be handled better here
      if (isMarker) {
        DocumentPreProcessor.removeStyleSheets()
        DocumentPreProcessor.createStyleSheets({ paddingLeft, columnGap })
        DocumentPreProcessor.appendStyleSheets()
      }
    }

    // Calculate the position of the attached node (ref) or its parent element
    // in relation to the position of the last node in the chapter. This is
    // used when calculations can't be done using the attached node/node's
    // parent offsetLeft because it's absolutely positioned.
    calculateNodePositionUsingBoundingClientRect = () => {
      const node = this.getRef()

      if (!node) return console.error('Element does not exist') // TODO necessary to check again?

      // Get the left-most edge of the ultimate node. It can either be in
      // position verso or recto. Since the ultimate node is inline (a `span`
      // element), its left-most edge is fluid depending on the space that its
      // parent element consumes; e.g., appended to a `p` node, its left-most
      // edge might sit at the right-most edge of a column depending on the
      // length of text in the paragraph
      const { ultimateOffsetLeft } = this.props.view
      const { paddingLeft, columnGap } = this.props.viewerSettings

      // Get the current transform applied to the layout element in px
      const transformLeft = Math.abs(this.context.getTranslateX())

      // Get the node's DOMRect. The resulting position will be relative to its
      // position in the viewport, so account for the transforms applied to the
      // layout element
      const elementEdgeLeft = node.getBoundingClientRect().x + transformLeft

      // Find the width of the visible portion of the layout
      const innerFrameWidth = window.innerWidth - paddingLeft * 2 + columnGap

      // Calculate the difference between the position of the ultimate node and
      // the attached node
      let elementSpreadIndex =
        ultimateOffsetLeft / innerFrameWidth -
        (ultimateOffsetLeft - elementEdgeLeft) / innerFrameWidth

      // Account for slop
      elementSpreadIndex = Math.round(elementSpreadIndex)

      this.setState({
        verso: true,
        recto: false,
        spreadIndex: elementSpreadIndex,
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
    ({ readerSettings, viewerSettings, view }) => ({
      readerSettings,
      viewerSettings,
      view,
    }),
    () => ({})
  )(WrapperComponent)
}

export default withNodePosition
