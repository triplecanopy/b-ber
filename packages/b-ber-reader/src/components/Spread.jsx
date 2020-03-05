/* eslint-disable class-methods-use-this,react/sort-comp */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill'
import debounce from 'lodash/debounce'
import { debug } from '../config'
import { isNumeric } from '../helpers/Types'
import { cssHeightDeclarationPropType } from '../lib/custom-prop-types'
import Messenger from '../lib/Messenger'
import { messagesTypes } from '../constants'
import Viewport from '../helpers/Viewport'
import { SpreadImageStyles } from '.'

class Spread extends Component {
  static contextTypes = {
    height: cssHeightDeclarationPropType, // from Layout.jsx
    paddingTop: PropTypes.number,
    paddingLeft: PropTypes.number,
    paddingRight: PropTypes.number,
    paddingBottom: PropTypes.number,
    columnGap: PropTypes.number,
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
      // height: 0,

      // verso and recto relate to the position of the marker node
      verso: false,
      recto: false,
      left: '',
      transform: '',

      spreadPosition: 0,
      marker: {
        verso: false,
        recto: false,
        x: 0,
        markerId: '',
        unbound: false,
      },
    }

    this.debounceSpeed = 60
    this.messageKey = null

    this.calculateSpreadOffset = this.calculateSpreadOffset.bind(this)
    this.updateChildElementPositions = this.updateChildElementPositions.bind(
      this
    )
    this.connectResizeObserver = this.connectResizeObserver.bind(this)
    this.disconnectResizeObserver = this.disconnectResizeObserver.bind(this)
    this.debounceCalculateSpreadOffset = debounce(
      this.calculateSpreadOffset,
      this.debounceSpeed,
      {}
    ).bind(this)
  }
  getChildContext() {
    return {
      left: this.state.left,
      transform: this.state.transform,
      recto: this.state.recto,
      verso: this.state.verso,
    }
  }

  componentWillReceiveProps(_, nextContext) {
    const markerRefId = this.props['data-marker-reference']
    if (nextContext.refs[markerRefId]) {
      const { verso, recto, x, markerId, unbound } = nextContext.refs[
        markerRefId
      ]

      if (
        verso !== this.state.marker.verso ||
        recto !== this.state.marker.recto ||
        x !== this.state.marker.x ||
        markerId !== this.state.marker.markerId ||
        unbound !== this.state.marker.unbound
      ) {
        this.setState(
          { marker: nextContext.refs[markerRefId] },
          this.updateChildElementPositions
        )
      }
    }
  }
  componentWillMount() {
    // Adds listener for our 'ready' event that's fired in
    // decorate-observable.js. This is used to update the absolutely
    // positioned images in fullbleed panels which function properly on
    // Chrome, so we only need it for FF and Safari
    this.messageKey = Messenger.register(() => {
      this.updateChildElementPositions()
    }, messagesTypes.DEFERRED_EVENT)
  }
  componentDidMount() {
    this.connectResizeObserver()
    setImmediate(this.updateChildElementPositions)
  }
  componentWillUnmount() {
    this.disconnectResizeObserver()
    Messenger.deregister(this.messageKey)
  }
  connectResizeObserver() {
    const contentNode = document.querySelector('#content')
    if (!contentNode) {
      return console.error('Spread#connectResizeObserver: No #content node')
    }
    this.resizeObserver = new ResizeObserver(this.debounceCalculateSpreadOffset)
    this.resizeObserver.observe(contentNode)
  }
  disconnectResizeObserver() {
    this.resizeObserver.disconnect()
  }
  calculateSpreadOffset() {
    let { height } = this.context
    const { paddingTop, paddingBottom } = this.context
    const padding = paddingTop + paddingBottom

    height = isNumeric(height) ? height * 2 - padding * 2 : height
    if (isNumeric(height)) height -= 1 // nudge to prevent overflow onto next spread

    if (this.state.marker.unbound === true) {
      // height = height / 2 - 1
    }

    // eslint-disable-next-line react/no-unused-state
    this.setState({ height }, this.updateChildElementPositions)
  }

  // Spread#updateChildElementPositions lays out absolutely positioned images
  // over fullbleed placeholders for FF and Safari. This is Chrome's default
  // behaviour but we update there as well for consistency
  updateChildElementPositions() {
    const { verso, recto, x, unbound } = this.state.marker
    // set this after loading to prevent figures drifing around on initial page load
    // TODO: should be passing in transition speed
    // @issue: https://github.com/triplecanopy/b-ber/issues/216
    const transform = 'transition: transform 400ms ease'
    const width = window.innerWidth
    const { paddingLeft, paddingRight, columnGap } = this.context
    const layoutWidth = width - paddingLeft - paddingRight + columnGap // not sure why we're adding columnGap in here ...
    const spreadPosition = Math.round((x + paddingLeft) / layoutWidth) + 1

    let left = 0

    if (!Viewport.isMobile()) {
      left = layoutWidth * spreadPosition
      if (recto) left -= layoutWidth
      if (unbound) left = 0
    } else {
      left = 0
    }

    left = `${left}px`

    this.setState({
      left,
      recto,
      verso,
      transform,
      spreadPosition,
    })
  }

  render() {
    const { /* height, */ spreadPosition } = this.state
    const markerRefId = this.props['data-marker-reference']
    const { unbound } = this.state.marker
    const { paddingLeft } = this.context

    const debugStyles = { background: 'blue' }

    let styles = {}
    if (debug) styles = { ...styles, ...debugStyles }

    return (
      <div {...this.props} id={`spread__${markerRefId}`} style={styles}>
        <SpreadImageStyles
          recto={this.state.marker.recto}
          markerRefId={markerRefId}
          spreadPosition={spreadPosition}
          unbound={unbound}
          paddingLeft={paddingLeft}
          markerX={this.state.marker.x}
        />
        {this.props.children}
      </div>
    )
  }
}

export default Spread
