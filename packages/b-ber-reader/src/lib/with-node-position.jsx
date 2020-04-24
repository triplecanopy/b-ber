import React from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import { connect } from 'react-redux'
import DocumentPreProcessor from './DocumentPreProcessor'
import { unlessDefined } from '../helpers/utils'

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
//    useAdjustedColumnWidth: bool
//
//    Should the calculations be based on an element that sits inside of the
//    columns or one that stretches the width of the viewport.
//    Default false.
//
//
//    isMarker: bool
//
//    Whether the wrapped component is a Marker component
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

      ultimateLeft: 0,
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
    }

    componentWillUnmount() {
      this.disconnectObservers()
    }

    componentWillReceiveProps(nextProps) {
      if (this.props.view.left !== nextProps.view.left) {
        console.log('calls calculate node position from willReceiveprops')

        this.setState(
          { ultimateLeft: nextProps.view.left },
          this.calculateNodePosition
        )
      }
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
        const layoutElem = document.querySelector('#layout')
        const matrix = window
          .getComputedStyle(layoutElem)
          .transform.replace(/(?:^matrix\(|\)$)/g, '')
          .split(',')
          .map(n => Number(n.trim()))

        const transformLeft = Math.abs(matrix[4])

        // console.log('transformLeft', transformLeft)

        elementEdgeLeft =
          elem.getBoundingClientRect().x + Math.abs(transformLeft)
      }

      // if (!elem.classList.contains('marker')) {
      //   console.log('elementEdgeLeft', elementEdgeLeft)
      // }

      // Test whether the element's left offset is divisible by the
      // visible frame width. A remainder means that the element is
      // positioned at 1/2 of the page width, or 'recto'

      // Width of a single column
      const columnWidth = (window.innerWidth - paddingLeft * 2 - columnGap) / 2

      // Width of the visible portion of the layout
      const innerFrameWidth = window.innerWidth - paddingLeft * 2 + columnGap

      if (useAdjustedColumnWidth === false) {
        // clearTimeout(this.timer)
        // this.timer = setTimeout(() => {
        // const ult = document.querySelector('.ultimate')
        // console.log(ult)

        // if (!ult) {
        //   console.log('no ult')
        //   elem.style.display = 'none'
        //   elem.style.display = 'block'

        //   return
        // }

        let finalSpreadEdgeLeft

        const colsAsIndexes =
          Math.floor(this.state.ultimateLeft / innerFrameWidth) - 1
        // const colsAsIndexes = Math.floor(ult.offsetLeft / innerFrameWidth) - 1
        if (colsAsIndexes % 2 !== 0) {
          // odd colsAsIndexes
          finalSpreadEdgeLeft = this.state.ultimateLeft - innerFrameWidth / 2
        } else {
          finalSpreadEdgeLeft = this.state.ultimateLeft - innerFrameWidth
        }

        const spreadThatElementAppearsOn =
          this.state.ultimateLeft / innerFrameWidth -
          (this.state.ultimateLeft - elementEdgeLeft) / innerFrameWidth

        // spreadThatElementAppearsOn = Math.round(spreadThatElementAppearsOn)

        // const spreadThatElementAppearsOn =
        //   (finalSpreadEdgeLeft - Math.round(elementEdgeLeft)) /
        //     innerFrameWidth -
        //   1

        // console.log('elem', elem)
        // console.log('ult.offsetLeft', ult.offsetLeft)
        // console.log('elementEdgeLeft', elementEdgeLeft)
        // console.log('colsAsIndexes', colsAsIndexes)
        console.log('spreadThatElementAppearsOn', spreadThatElementAppearsOn)
        console.log(
          'spreadThatElementAppearsOnRounded',
          Math.round(spreadThatElementAppearsOn)
        )
        console.log('finalSpreadEdgeLeft', finalSpreadEdgeLeft)
        // console.log('-----')
        // }, 1000)

        this.setState({
          verso: true,
          recto: false,
          // edgePosition,
          spreadIndex: Math.round(spreadThatElementAppearsOn),
          // edgePositionVariance,
          // elementEdgeLeft,
        })

        return
      }

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
      let verso
      let recto
      if (useAdjustedColumnWidth) {
        verso =
          edgePositionVariance >= ELEMENT_EDGE_VERSO_MIN &&
          edgePositionVariance <= ELEMENT_EDGE_VERSO_MAX
        recto =
          edgePositionVariance >= ELEMENT_EDGE_RECTO_MIN &&
          edgePositionVariance <= ELEMENT_EDGE_RECTO_MAX
      } else {
        verso = true
        recto = false
      }

      // Calculate the spread that the element appears on by rounding the
      // position
      const spreadIndex = Math.round(Number(edgePosition.toFixed(2)))

      // In the case that the marker's edge is not within the allowable
      // range (during a transition or resize), calculateNodePosition
      // calls itself again
      if (
        (useAdjustedColumnWidth &&
          this.elementEdgeIsInAllowableRange(edgePositionVariance) === false) ||
        (useAdjustedColumnWidth === false &&
          edgePositionVariance < 93 &&
          edgePositionVariance > 7) ||
        (verso === false && recto === false)
      ) {
        console.log('Recalculating layout')

        elem.style.display = 'none'
        elem.style.display = 'block'
      }

      this.setState({
        verso,
        recto,
        edgePosition,
        spreadIndex,
        edgePositionVariance,
        elementEdgeLeft,
      })

      // TODO Marker component specific code needs to be handled better here
      if (isMarker) {
        DocumentPreProcessor.removeStyleSheets()
        DocumentPreProcessor.createStyleSheets({ paddingLeft, columnGap })
        DocumentPreProcessor.appendStyleSheets()
      }
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
