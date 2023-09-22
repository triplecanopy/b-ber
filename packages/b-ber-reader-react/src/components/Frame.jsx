import React from 'react'
import isPlainObject from 'lodash/isPlainObject'
import { connect } from 'react-redux'
import { Layout } from '.'
import Viewport from '../helpers/Viewport'
import Asset from '../helpers/Asset'

class Frame extends React.Component {
  node = React.createRef()

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !Viewport.isSingleColumn() ||
      !this.node?.current ||
      nextProps.view.loaded === false ||
      this.props.view.loaded === nextProps.view.loaded
    ) {
      return
    }

    this.node.current.scrollTo(0, 0)
  }

  handleScroll = e => {}

  componentDidMount() {
    this.node.current.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    this.node.current.removeEventListener('scroll', this.handleScroll)
  }

  style() {
    let style = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 0,
      padding: 0,
      border: 0,
    }

    if (Viewport.isVerticallyScrolling(this.props)) {
      // Mobile
      style.WebkitOverflowScrolling = 'touch'
      style.overflowY = 'auto'
      style.overflowX = 'hidden'
    } else {
      // Desktop
      style.overflow = 'hidden'
    }

    if (isPlainObject(this.props.style)) {
      style = { ...style, ...this.props.style }
    }

    return style
  }

  className() {
    const hash = Asset.createHash(this.props.readerSettings.bookURL)
    let className = `_${hash}`

    if (this.props.className && typeof this.props.className === 'string') {
      className = `${className} ${this.props.className}`
    }

    return className
  }

  render() {
    return (
      <div
        id="frame"
        className={this.className()}
        style={this.style()}
        ref={this.node}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Layout {...this.props} />
      </div>
    )
  }
}

export default connect(
  ({ readerSettings, viewerSettings }) => ({ readerSettings, viewerSettings }),
  () => ({})
)(Frame)
