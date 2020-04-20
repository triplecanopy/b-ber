import React from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import transitions from '../lib/transition-styles'
import Viewport from '../helpers/Viewport'
import { debug } from '../config'
import browser from '../lib/browser'
import withObservers from '../lib/with-observers'
import withDimensions from '../lib/with-dimensions'

const Leaves = ({ leafLeftStyles, leafRightStyles }) =>
  Viewport.isMobile() ? null : (
    <React.Fragment>
      <div className="leaf leaf--left" style={leafLeftStyles} />
      <div className="leaf leaf--right" style={leafRightStyles} />
    </React.Fragment>
  )

class Layout extends React.Component {
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

  state = {
    margin: 0,
    border: 0,
    boxSizing: 'border-box',
    transform: 'translateX(0)',
    translateX: 0,
    columnFill: 'auto',
  }

  constructor() {
    super()

    const debounceSpeed = 60

    this.handleResize = debounce(this.onResizeDone, debounceSpeed, {}).bind(
      this
    )
  }

  componentDidMount() {
    this.props.updateDimensions()
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

  onResizeDone = () => {
    this.props.updateDimensions()
    this.updateTransform()
  }

  getTranslateX(_spreadIndex) {
    const spreadIndex =
      typeof _spreadIndex === 'undefined'
        ? this.props.spreadIndex
        : _spreadIndex

    const {
      width,
      paddingLeft,
      paddingRight,
      columnGap,
    } = this.props.viewerSettings

    const isMobile = Viewport.isMobile()

    let translateX = 0
    if (!isMobile) {
      translateX =
        (width - paddingLeft - paddingRight + columnGap) * spreadIndex * -1

      // no -0
      translateX =
        translateX === 0 && Math.sign(1 / translateX) === -1 ? 0 : translateX
    }

    return translateX
  }

  bindEventListeners() {
    window.addEventListener('resize', this.handleResize)
  }

  unBindEventListeners() {
    window.removeEventListener('resize', this.handleResize)
  }

  updateTransform = spreadIndex => {
    const translateX = this.getTranslateX(spreadIndex)
    const transform = `translateX(${translateX}px)`

    this.setState({ transform, translateX })
  }

  layoutStyles() {
    const {
      width,
      height,
      columns,
      columnGap,
      paddingTop,
      paddingLeft,
      paddingRight,
      paddingBottom,
    } = this.props.viewerSettings

    const { margin, border, boxSizing, columnFill, transform } = this.state

    return {
      width,
      height,
      columnGap,
      paddingTop,
      paddingLeft,
      paddingRight,
      paddingBottom,

      margin,
      border,
      boxSizing,
      columns,
      columnFill,
      transform,
    }
  }

  leafStyles(position /* <left|right> */) {
    // Overlay styles for hiding content in the 'padding' range. FF animations
    // 'jump' when animating a transform, so we use 'left' and 'right'
    // properties in that case. in either case, need to move the leaves in the
    // opposite direction as the containing element

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
    const height = this.props.getFrameHeight()
    const { pageAnimation, spreadIndex, slug } = this.props

    const {
      transition,
      transitionSpeed,
      paddingLeft,
      paddingRight,
    } = this.props.viewerSettings

    const contextClass = Viewport.isMobile() ? 'mobile' : 'desktop'
    const defaultContentStyles = { padding: 0, margin: 0 }
    const contentStyles = { ...defaultContentStyles, minHeight: height }
    const layoutTransition = transitions({ transitionSpeed })[transition]

    let layoutStyles = { ...this.layoutStyles(), ...layoutTransition }
    let leafLeftStyles = { ...this.leafStyles('left'), width: paddingLeft }
    let leafRightStyles = {
      ...this.leafStyles('right'),
      width: paddingRight,
    }

    // Disable transition animation by default. Enabling transition requires
    // user action, e.g. clicking 'next'
    if (!pageAnimation) {
      layoutStyles = { ...layoutStyles, transition: 'none' }
      leafLeftStyles = { ...leafLeftStyles, transition: 'none' }
      leafRightStyles = { ...leafRightStyles, transition: 'none' }
    }

    return (
      <div
        id="layout"
        style={layoutStyles}
        className={`spread-index__${spreadIndex} context__${contextClass} ${slug}`}
      >
        <div id="content" style={contentStyles} ref={this.props.innerRef}>
          <this.props.BookContent {...this.props} {...this.state} />
        </div>

        <Leaves
          leafLeftStyles={leafLeftStyles}
          leafRightStyles={leafRightStyles}
        />
      </div>
    )
  }
}

export default withDimensions(withObservers(Layout))
