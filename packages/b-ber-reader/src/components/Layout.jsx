import React from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import transitions from '../lib/transition-styles'
import Viewport from '../helpers/Viewport'
import browser from '../lib/browser'
import withObservers from '../lib/with-observers'
import withDimensions from '../lib/with-dimensions'
import ReaderContext from '../lib/reader-context'
import { RESIZE_DEBOUNCE_TIMER, layouts } from '../constants'

const Leaves = ({ layout, leafLeftStyles, leafRightStyles }) =>
  layout === layouts.SCROLL || Viewport.isMobile() ? null : (
    <React.Fragment>
      <div className="leaf leaf--left" style={leafLeftStyles} />
      <div className="leaf leaf--right" style={leafRightStyles} />
    </React.Fragment>
  )

class Layout extends React.Component {
  static contextType = ReaderContext

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
    transform: 'translateX(0) translate3d(0, 0, 0)',
    columnFill: 'auto',
  }

  constructor() {
    super()

    this.handleResize = debounce(
      this.onResizeDone,
      RESIZE_DEBOUNCE_TIMER,
      {}
    ).bind(this)
  }

  componentDidMount() {
    this.props.updateDimensions()
    this.updateTransform()
    this.bindEventListeners()
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
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

  bindEventListeners() {
    window.addEventListener('resize', this.handleResize)
  }

  unBindEventListeners() {
    window.removeEventListener('resize', this.handleResize)
  }

  updateTransform = spreadIndex => {
    const translateX = this.context.getTranslateX(spreadIndex)
    const transform = `translateX(${translateX}px) translate3d(0, 0, 0)`

    this.setState({ transform })
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

    positionX = this.context.getTranslateX()

    if (browser.name === 'firefox') {
      if (position === 'left') positionX *= -1
      styles = {
        [position]: `${positionX}px`,
        transition: `${position} ${transitionSpeed}ms ease 0s`,
      }
    } else {
      positionX *= -1
      const transform = `translateX(${positionX}px) translate3d(0, 0, 0)`
      styles = {
        transform,
        transition: `transform ${transitionSpeed}ms ease 0s`,
      }
    }

    return styles
  }

  render() {
    const height = this.props.getFrameHeight()
    const { pageAnimation, spreadIndex, slug, layout } = this.props

    const {
      transition,
      transitionSpeed,
      paddingLeft,
      paddingRight,
    } = this.props.viewerSettings

    const contextClass =
      layout === layouts.SCROLL || Viewport.isMobile() ? 'mobile' : 'desktop'

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
          <this.props.BookContent />
        </div>

        <Leaves
          layout={layout}
          leafLeftStyles={leafLeftStyles}
          leafRightStyles={leafRightStyles}
        />
      </div>
    )
  }
}

export default withDimensions(withObservers(Layout))
