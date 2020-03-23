import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import pick from 'lodash/pick'
import transitions from '../lib/transition-styles'
import Viewport from '../helpers/Viewport'
import { isNumeric } from '../helpers/Types'
import { cssHeightDeclarationPropType } from '../lib/custom-prop-types'
import observable from '../lib/decorate-observable'
import { debug } from '../config'
import browser from '../lib/browser'

@observable
class Layout extends Component {
  static propTypes = {
    viewerSettings: PropTypes.shape({
      paddingTop: PropTypes.number.isRequired,
      paddingLeft: PropTypes.number.isRequired,
      paddingBottom: PropTypes.number.isRequired,
      fontSize: PropTypes.string.isRequired,
      columnGap: PropTypes.number.isRequired,
      transition: PropTypes.string.isRequired,
      transitionSpeed: PropTypes.number.isRequired,
      theme: PropTypes.string.isRequired,
    }).isRequired,
  }
  static childContextTypes = {
    height: cssHeightDeclarationPropType,
    columnGap: PropTypes.number,
    translateX: PropTypes.number,
    paddingTop: PropTypes.number,
    paddingLeft: PropTypes.number,
    paddingRight: PropTypes.number,
    paddingBottom: PropTypes.number,
    transitionSpeed: PropTypes.number,
  }
  constructor(props) {
    super(props)

    const {
      columnGap,
      paddingTop,
      paddingLeft,
      paddingRight,
      paddingBottom,
    } = this.props.viewerSettings

    this.state = {
      margin: 0,
      border: 0,
      paddingTop,
      paddingLeft,
      paddingRight,
      paddingBottom,
      boxSizing: 'border-box',

      width: 0,
      height: 0,
      transform: 'translateX(0)',
      translateX: 0,

      columnWidth: 'auto',
      columnCount: 2,
      columnGap,
      columnFill: 'auto',
    }

    this.debounceSpeed = 60
    this.contentNode = null
    this.layoutNode = null

    this.getSingleColumnWidth = this.getSingleColumnWidth.bind(this)
    this.getFrameWidth = this.getFrameWidth.bind(this)
    this.getFrameHeight = this.getFrameHeight.bind(this)
    this.updateDimensions = this.updateDimensions.bind(this)
    this.updateTransform = this.updateTransform.bind(this)
    this.onResizeDone = this.onResizeDone.bind(this)
    this.bindEventListeners = this.bindEventListeners.bind(this)
    this.unBindEventListeners = this.unBindEventListeners.bind(this)

    this.handleResize = debounce(
      this.onResizeDone,
      this.debounceSpeed,
      {}
    ).bind(this)
  }

  getChildContext() {
    return {
      height: this.state.height,
      columnGap: this.state.columnGap,
      translateX: this.state.translateX,
      paddingTop: this.state.paddingTop,
      paddingLeft: this.state.paddingLeft,
      paddingRight: this.state.paddingRight,
      paddingBottom: this.state.paddingBottom,
      transitionSpeed: this.props.viewerSettings.transitionSpeed,
    }
  }

  componentDidMount() {
    this.updateDimensions()
    this.updateTransform()
    this.bindEventListeners()
  }

  componentWillReceiveProps(nextProps) {
    const { spreadIndex } = nextProps
    this.updateTransform(spreadIndex)
  }

  componentWillUnmount() {
    this.unBindEventListeners()
  }

  onResizeDone() {
    this.updateDimensions()
    // this.updateTransform()
  }

  getFrameHeight() {
    if (Viewport.isMobile()) return 'auto'

    let { height } = this.state
    const { paddingTop, paddingBottom } = this.state

    // make sure we're not treating 'auto' as a number
    if (!isNumeric(height)) height = window.innerHeight

    height -= paddingTop
    height -= paddingBottom

    return height
  }

  // eslint-disable-next-line class-methods-use-this
  getFrameWidth() {
    const { width, paddingLeft, paddingRight, columnGap } = this.state
    return width - paddingLeft - paddingRight - columnGap
  }

  getSingleColumnWidth() {
    return this.getFrameWidth() / 2
  }

  getTranslateX(_spreadIndex) {
    const spreadIndex =
      typeof _spreadIndex === 'undefined'
        ? this.props.spreadIndex
        : _spreadIndex
    const { width, paddingLeft, paddingRight, columnGap } = this.state
    const isMobile = Viewport.isMobile()

    let translateX = 0
    if (!isMobile) {
      translateX =
        (width - paddingLeft - paddingRight + columnGap) * spreadIndex * -1
    }
    if (!isMobile) {
      translateX =
        translateX === 0 && Math.sign(1 / translateX) === -1 ? 0 : translateX
    } // no -0

    return translateX
  }

  updateDimensions() {
    const {
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    } = this.props.viewerSettings

    const isMobile = Viewport.isMobile()
    const width = window.innerWidth
    const columns = isMobile ? 1 : 2
    const height = isMobile ? 'auto' : window.innerHeight

    this.setState({
      width,
      height,
      columns,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    })
  }

  bindEventListeners() {
    window.addEventListener('resize', this.handleResize, false)
  }

  unBindEventListeners() {
    window.removeEventListener('resize', this.handleResize, false)
  }

  updateTransform(spreadIndex) {
    const translateX = this.getTranslateX(spreadIndex)
    const transform = `translateX(${translateX}px)`

    this.setState({ transform, translateX })
  }

  layoutStyles() {
    return {
      ...pick(this.state, [
        'margin',
        'border',
        'paddingTop',
        'paddingLeft',
        'paddingRight',
        'paddingBottom',
        'columnGap',
        'boxSizing',
        'width',
        'height',
        'columns',
        'columnFill',
        'transform',
      ]),
    }
  }

  // eslint-disable-next-line class-methods-use-this
  contentStyles() {
    return {
      padding: 0,
      margin: 0,
    }
  }

  leafStyles(position /* <left|right> */) {
    // our overlay styles for hiding content in the 'padding' range. FF
    // animations 'jump' when animating a transform, so we use 'left' and
    // 'right' properties in that case. in either case, need to move the
    // leaves in the opposite direction as the containing element

    const { transitionSpeed } = this.props.viewerSettings

    let styles = {}
    let positionX = 0

    positionX = this.getTranslateX()

    if (browser.name === 'firefox') {
      if (position === 'left') positionX *= -1
      styles = {
        [position]: `${positionX}px`,
        transition: `${position} ${transitionSpeed}ms ease 0s`,
      }
    } else {
      positionX *= -1
      const transform = `translateX(${positionX}px)`
      styles = {
        transform,
        transition: `transform ${transitionSpeed}ms ease 0s`,
      }
    }

    if (debug) styles = { ...styles, opacity: 0.4, backgroundColor: 'blue' }

    return styles
  }

  render() {
    const height = this.getFrameHeight()
    const { pageAnimation, spreadIndex, slug } = this.props
    const { paddingLeft, paddingRight } = this.state
    const { transition, transitionSpeed } = this.props.viewerSettings
    const isMobile = Viewport.isMobile()
    const contextClass = isMobile ? 'mobile' : 'desktop'

    // const contentStyles = { ...this.contentStyles() }
    const contentStyles = { ...this.contentStyles(), minHeight: height }

    const layoutTransition = transitions({ transitionSpeed })[transition]

    let layoutStyles = { ...this.layoutStyles(), ...layoutTransition }
    let leafLeftStyles = { ...this.leafStyles('left'), width: paddingLeft }
    let leafRightStyles = {
      ...this.leafStyles('right'),
      width: paddingRight,
    }

    // disable transition animation by default. enabling transition requires
    // user action, like clicking 'next'
    if (!pageAnimation) {
      layoutStyles = { ...layoutStyles, transition: 'none' }
      leafLeftStyles = { ...leafLeftStyles, transition: 'none' }
      leafRightStyles = { ...leafRightStyles, transition: 'none' }
    }

    return (
      <div
        id="layout"
        className={`spread-index__${spreadIndex} context__${contextClass} ${slug}`}
        style={layoutStyles}
        ref={node => (this.layoutNode = node)}
      >
        <div
          id="content"
          style={contentStyles}
          ref={node => (this.contentNode = node)}
        >
          <this.props.bookContent {...this.props} {...this.state} />
        </div>
        {!isMobile && (
          <div className="leaf leaf--left" style={leafLeftStyles} />
        )}
        {!isMobile && (
          <div className="leaf leaf--right" style={leafRightStyles} />
        )}
      </div>
    )
  }
}

export default Layout
