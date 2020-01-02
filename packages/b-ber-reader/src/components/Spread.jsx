/* eslint-disable class-methods-use-this,react/sort-comp */
import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
// import ResizeObserver from 'resize-observer-polyfill'
// import debounce from 'lodash/debounce'
import { debug } from '../config'
import { isNumeric } from '../helpers/Types'
// import { cssHeightDeclarationPropType } from '../lib/custom-prop-types'
// import Messenger from '../lib/Messenger'
// import { messagesTypes } from '../constants'
import Viewport from '../helpers/Viewport'
import { SpreadImageStyles } from '.'

class Spread extends React.Component {
  static contextTypes = {
    // height: cssHeightDeclarationPropType, // from Layout.jsx
    refs: PropTypes.object,
  }

  static childContextTypes = {
    left: PropTypes.string,
    transform: PropTypes.string,
    recto: PropTypes.bool,
    verso: PropTypes.bool,
  }

  constructor(props) {
    super(props)

    this.state = {
      left: '',
      transform: '',
      spreadPosition: 0,

      // recto and verso properties are forwaraded to SpreadFigure, so need to
      // be copied to this component from
      // props.markers[markerId]
      verso: false,
      recto: false,
    }

    // this.debounceSpeed = 60
    // this.messageKey = null

    this.calculateSpreadOffset = this.calculateSpreadOffset.bind(this)
    this.updateChildElementPositions = this.updateChildElementPositions.bind(
      this
    )

    // this.connectResizeObserver = this.connectResizeObserver.bind(this)
    // this.disconnectResizeObserver = this.disconnectResizeObserver.bind(this)
    // this.debounceCalculateSpreadOffset = debounce(
    //   this.calculateSpreadOffset,
    //   this.debounceSpeed,
    //   {}
    // ).bind(this)
  }

  getChildContext() {
    return {
      left: this.state.left,
      transform: this.state.transform,
      recto: this.state.recto,
      verso: this.state.verso,
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    const markerId = this.props['data-marker-reference']
    const marker = nextProps.markers[markerId]

    if (!marker) return

    const { recto, verso, elementEdgeLeft, unbound } = marker

    if (
      recto !== this.props.recto ||
      verso !== this.props.verso ||
      elementEdgeLeft !== this.props.elementEdgeLeft ||
      unbound !== this.props.unbound
    ) {
      this.setState({ recto, verso }, this.updateChildElementPositions)

      // this.props.update({
      //   recto,
      //   verso,
      //   elementEdgeLeft,
      //   markerId,
      //   unbound,
      // })
    }
  }

  // if (
  //   verso !== this.state.marker.verso ||
  //   recto !== this.state.marker.recto ||
  //   x !== this.state.marker.x ||
  //   markerId !== this.state.marker.markerId ||
  //   unbound !== this.state.marker.unbound
  // ) {
  //   this.setState(
  //     { marker: nextContext.refs[markerRefId] },
  //     this.updateChildElementPositions
  //   )
  // }
  // }

  // eslint-disable-next-line camelcase
  // UNSAFE_componentWillMount() {
  //   // Adds listener for our 'ready' event that's fired in
  //   // decorate-observable.js. This is used to update the absolutely
  //   // positioned images in fullbleed panels which function properly on
  //   // Chrome, so we only need it for FF and Safari
  //   this.messageKey = Messenger.register(() => {
  //     this.updateChildElementPositions()
  //   }, messagesTypes.DEFERRED_EVENT)
  // }

  componentDidMount() {
    // this.connectResizeObserver()
    this.updateChildElementPositions()
    // setImmediate(this.updateChildElementPositions)
  }

  // componentWillUnmount() {
  //   // this.disconnectResizeObserver()
  //   // Messenger.deregister(this.messageKey)
  // }

  // connectResizeObserver() {
  //   const contentNode = document.querySelector('#content')
  //   if (!contentNode) {
  //     return console.error('Spread#connectResizeObserver: No #content node')
  //   }
  //   this.resizeObserver = new ResizeObserver(this.debounceCalculateSpreadOffset)
  //   this.resizeObserver.observe(contentNode)
  // }

  // disconnectResizeObserver() {
  //   this.resizeObserver.disconnect()
  // }

  calculateSpreadOffset() {
    let { height } = this.props.viewerSettings
    const { paddingTop, paddingBottom } = this.props.viewerSettings
    const padding = paddingTop + paddingBottom

    height = isNumeric(height) ? height * 2 - padding * 2 : height
    if (isNumeric(height)) height -= 1 // nudge to prevent overflow onto next spread

    // if (this.state.marker.unbound === true) {
    //   // height = height / 2 - 1
    // }

    // eslint-disable-next-line react/no-unused-state
    // this.setState({ height }, this.updateChildElementPositions)
    this.updateChildElementPositions()
  }

  // Spread#updateChildElementPositions lays out absolutely positioned images
  // over fullbleed placeholders for FF and Safari. This is Chrome's default
  // behaviour but we update there as well for consistency
  updateChildElementPositions() {
    const markerId = this.props['data-marker-reference']
    const marker = this.props.markers[markerId]

    if (!marker) {
      return console.error('Cannot update child positions: No marker')
    }

    const { verso, recto, elementEdgeLeft, unbound } = marker
    // set this after loading to prevent figures drifing around on initial page load
    // TODO: should be passing in transition speed
    // @issue: https://github.com/triplecanopy/b-ber/issues/216
    const transform = 'transition: transform 400ms ease'
    const width = window.innerWidth
    const { paddingLeft, paddingRight, columnGap } = this.props.viewerSettings
    const layoutWidth = width - paddingLeft - paddingRight + columnGap // not sure why we're adding columnGap in here ...
    const spreadPosition =
      Math.round((elementEdgeLeft + paddingLeft) / layoutWidth) + 1

    let left = 0

    if (!Viewport.isMobile()) {
      left = layoutWidth * spreadPosition
      if (recto) left -= layoutWidth
      if (unbound) left = 0
    } else {
      left = 0
    }

    left = `${left}px`

    console.log(left)

    this.setState({
      left,
      recto,
      verso,
      transform,
      spreadPosition,
    })
  }

  render() {
    const markerId = this.props['data-marker-reference']
    const marker = this.props.markers[markerId]
    if (!marker) return null

    const { spreadPosition } = this.state
    const { recto, elementEdgeLeft, unbound } = marker
    const { paddingLeft } = this.props.viewerSettings

    // TODO
    // eslint-disable-next-line no-unused-vars
    const { viewerSettings, markers, ...rest } = this.props

    const debugStyles = { background: 'blue' }

    let styles = {}
    if (debug) styles = { ...styles, ...debugStyles }

    // console.log('markerId', markerId)

    return (
      <div {...rest} id={`spread__${markerId}`} style={styles}>
        <SpreadImageStyles
          recto={recto}
          markerRefId={markerId}
          spreadPosition={spreadPosition}
          unbound={unbound}
          paddingLeft={paddingLeft}
          markerX={elementEdgeLeft}
        />
        {this.props.children}
      </div>
    )
  }
}

export default connect(
  ({ viewerSettings, markers }) => ({
    viewerSettings,
    markers,
  }),
  () => ({})
)(Spread)
