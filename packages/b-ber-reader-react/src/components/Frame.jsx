import React from 'react'
import { isPlainObject } from 'lodash'
import { connect } from 'react-redux'
import { Layout, DebugGrid } from '.'
import Viewport from '../helpers/Viewport'
import { layouts } from '../constants'
import Messenger from '../lib/Messenger'
import Asset from '../helpers/Asset'

class Frame extends React.Component {
  node = React.createRef()

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !Viewport.isMobile() ||
      !this.node?.current ||
      nextProps.view.loaded === false ||
      this.props.view.loaded === nextProps.view.loaded
    ) {
      return
    }

    this.node.current.scrollTo(0, 0)
  }

  handleScroll = e => {
    const documentHeight = Math.max(
      this.node.current.scrollHeight,
      this.node.current.offsetHeight,
      this.node.current.clientHeight
    )

    Messenger.sendScrollEvent(e, e.target.scrollTop, documentHeight)
  }

  componentDidMount() {
    this.node.current.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    this.node.current.removeEventListener('scroll', this.handleScroll)
  }

  style() {
    const { fontSize } = this.props.viewerSettings

    let style = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 0,
      padding: 0,
      border: 0,
      fontSize: `${fontSize}%`, // TODO standardize how fontSize is stored and loaded from viewerSettings
    }

    if (this.props.layout === layouts.SCROLL || Viewport.isMobile()) {
      // Mobile
      style = {
        ...style,
        WebkitOverflowScrolling: 'touch',
        overflowY: 'auto',
        overflowX: 'hidden',
      }
    } else {
      // Desktop
      style = {
        ...style,
        overflow: 'hidden',
      }
    }

    if (this.props.style && isPlainObject(this.props.style)) {
      style = {
        ...style,
        ...this.props.style,
      }
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
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <DebugGrid {...this.props} />
      </div>
    )
  }
}

export default connect(
  ({ readerSettings, viewerSettings }) => ({ readerSettings, viewerSettings }),
  () => ({})
)(Frame)
